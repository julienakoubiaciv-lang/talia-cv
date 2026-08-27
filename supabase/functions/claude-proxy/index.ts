/**
 * claude-proxy — Supabase Edge Function (projet OCTO, base unifiée)
 *
 * Proxy sécurisé vers l'API Anthropic, partagé par les DEUX apps qui parlent
 * à ce projet Supabase : le CRM (`web-v2`, ce dépôt — actions `generate_cv`
 * côté candidat via `cvAnalyse.ts` et `crm_cv_generation` via
 * `lib/actions/cvGenerate.ts`) et le générateur grand public `altio-cv`
 * (`generate_cv`, `smart_match`, etc., candidats connectés directement).
 *
 * ⚠️ CE FICHIER EST DUPLIQUÉ À L'IDENTIQUE dans altio-cv
 * (`supabase/functions/claude-proxy/index.ts`) : les deux dépôts déploient la
 * MÊME fonction sur le MÊME projet Supabase (`zxiroikfhrwsyzgqflzb`), donc un
 * déploiement depuis l'un écrase le résultat du dernier déploiement de
 * l'autre si le contenu diverge. Toute modification ici doit être reportée
 * là-bas (et réciproquement) — pas de fork silencieux.
 *
 * - Auth JWT obligatoire. Contexte (staff | student | guest) via la RPC
 *   SECURITY DEFINER get_user_context() — MÊME source que le front (useUserContext).
 * - STAFF : gate consentement RGPD (candidates.consent_given si candidate_id)
 *   + quota ORG via check_quota (fail-closed).
 * - STUDENT : cap SERVEUR cv_count < max_cv (source = compteur cv_history dans
 *   get_user_context ; le cap front est bypassable). Crédit pro = candidates.max_cv.
 * - GUEST / orphelin : refusé (403 forbidden_no_access).
 * - Enregistre l'usage dans usage_events (org_id, action enum, tokens_used,
 *   cost_eur, entity_type/id, metadata). Le trigger increment_org_usage
 *   incrémente alors usage_cv_current / usage_score_current selon l'action.
 *   user_id = FK vers profiles (staff only) → null pour un élève (attribution
 *   via entity_id = sa fiche candidat).
 * - La clé ANTHROPIC_API_KEY n'est jamais exposée au client.
 *
 * POST /functions/v1/claude-proxy
 * Headers : Authorization: Bearer <supabase_jwt>
 * Body    : { action, messages, model?, system?, max_tokens?, candidate_id?, metadata? }
 *
 * `metadata` est libre (jsonb, non typé côté serveur) : les deux générateurs
 * y déposent `source` ('crm' | 'generator') pour que la Performance CRM
 * (`lib/cvGeneratorKpis.ts`) sache distinguer une génération faite par le
 * staff d'une génération faite par le candidat lui-même. Formation et genre
 * ne sont PAS dans `metadata` — ils se lisent sur `candidates` via entity_id.
 *
 * Secrets requis (dashboard OCTO → Edge Functions → Secrets) :
 *   ANTHROPIC_API_KEY          — sk-ant-...
 *   SUPABASE_SERVICE_ROLE_KEY  — (injecté par défaut)
 *   SUPABASE_URL / SUPABASE_ANON_KEY — (injectés par défaut)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL  = 'claude-sonnet-4-6';
const USD_TO_EUR     = 0.92; // conversion grossière pour cost_eur (les tarifs Anthropic sont en USD)

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Coût estimé en USD pour 1M tokens (entrée / sortie).
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.25,  output: 1.25  },
  'claude-haiku-4-5':          { input: 0.25,  output: 1.25  },
  'claude-sonnet-4-6':         { input: 3.00,  output: 15.00 },
  'claude-opus-4-8':           { input: 15.00, output: 75.00 },
};

/**
 * Mapping action front → enum usage_action d'OCTO.
 * ⚠️ Ne jamais mapper une action non-génération vers 'cv_generation' :
 * le trigger increment_org_usage incrémenterait le quota CV à tort.
 * Les actions absentes de ce mapping ne sont pas loguées (mais restent autorisées).
 *
 * `crm_cv_generation` (action envoyée par `web-v2/lib/actions/cvGenerate.ts`,
 * le générateur natif du CRM) DOIT rester mappée ici : sans ça, ces
 * générations ne sont ni comptées dans le quota org, ni loguées dans
 * usage_events — la Performance CRM ne verrait alors qu'une moitié de
 * l'usage réel du générateur.
 */
const ACTION_ENUM: Record<string, string> = {
  generate_cv:       'cv_generation',
  cv_generation:     'cv_generation',
  crm_cv_generation: 'cv_generation',
  smart_match:       'matching',
  matching:          'matching',
  candidate_scoring: 'candidate_scoring',
  cv_scoring:        'cv_scoring',
};

function estimateCostUsd(model: string, inputTokens: number, cachedTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_MODEL];
  const billableInput = Math.max(0, inputTokens - cachedTokens);
  return (billableInput * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  );
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // ── Auth ──────────────────────────────────────────────────
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { action, messages, system, max_tokens = 2048, metadata } = body;
    const model = body.model ?? DEFAULT_MODEL;
    const candidateId: string | null = body.candidate_id ?? metadata?.candidate_id ?? null;

    if (!action || !messages?.length) {
      return json({ error: 'action et messages requis' }, 400);
    }

    const isCvGen = ACTION_ENUM[action] === 'cv_generation';

    // ── Contexte unifié (staff | student | guest) via RPC SECURITY DEFINER ──
    // Appelée avec le client USER (JWT) : get_user_context() lit auth.uid() en
    // interne → un user ne peut pas demander le contexte d'un autre. Fail-closed.
    const { data: ctx, error: ctxErr } = await supabaseUser.rpc('get_user_context');
    if (ctxErr || !ctx || !ctx.kind) {
      console.error('[claude-proxy] get_user_context error:', ctxErr);
      return json({ error: 'context_check_failed' }, 503);
    }
    const kind: string = ctx.kind;
    const orgId: string | null = ctx.org_id ?? null;

    if (kind !== 'staff' && kind !== 'student') {
      // Orphelin / non rattaché → pas d'accès IA.
      return json({ error: 'forbidden_no_access' }, 403);
    }

    if (kind === 'student') {
      // ── Élève : cap SERVEUR sur les générations de CV (cv_count < max_cv).
      // Source de vérité = get_user_context (compteur cv_history), non bypassable.
      // Les actions non-génération (entraînement entretien, etc.) ne sont pas
      // plafonnées par le crédit CV.
      if (isCvGen && ctx.can_generate === false) {
        return json({
          error: 'cv_cap_reached',
          used:  ctx.cv_count ?? null,
          limit: ctx.max_cv ?? null,
        }, 429);
      }
      // Consentement : l'élève génère SON propre CV (consentement donné à
      // l'inscription) → pas de gate consentement ici.
    } else {
      // ── STAFF (pro) : gate consentement RGPD (si candidat cible) + quota ORG.
      if (candidateId && isCvGen) {
        const { data: cand } = await supabaseAdmin
          .from('candidates')
          .select('id, consent_given')
          .eq('id', candidateId)
          .maybeSingle();
        if (!cand) return json({ error: 'unknown_candidate' }, 400);
        if (!cand.consent_given) {
          return json({ error: 'consent_required', candidate_id: candidateId }, 403);
        }
      }

      // Vérification quota org (fail-closed).
      const { data: quota, error: quotaErr } = await supabaseAdmin
        .rpc('check_quota', { p_user_id: user.id, p_action: action });
      if (quotaErr || !quota) {
        console.error('[claude-proxy] check_quota error:', quotaErr);
        return json({ error: 'quota_check_failed' }, 503);
      }
      const quotaRow = quota?.[0];
      if (!quotaRow) {
        console.error('[claude-proxy] check_quota: aucune ligne', { action, user: user.id });
        return json({ error: 'quota_check_failed' }, 503);
      }
      if (!quotaRow.allowed) {
        return json({
          error: 'quota_exceeded',
          used:  quotaRow.used,
          limit: quotaRow.limit,
          tier:  quotaRow.tier,
        }, 429);
      }
    }

    // ── Appel Anthropic ────────────────────────────────────────
    const anthropicBody: Record<string, unknown> = { model, messages, max_tokens };
    if (system) anthropicBody.system = system;

    const anthropicRes = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key':         Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[claude-proxy] Anthropic error:', anthropicRes.status, errText);
      return json({ error: 'anthropic_error', detail: errText }, anthropicRes.status);
    }

    const result = await anthropicRes.json();

    // ── Enregistrement usage (uniquement si l'action mappe sur l'enum OCTO) ──
    const enumAction = ACTION_ENUM[action] ?? null;
    if (enumAction) {
      const usage        = result.usage ?? {};
      const inputTokens  = usage.input_tokens ?? 0;
      const cachedTokens = usage.cache_read_input_tokens ?? 0;
      const outputTokens = usage.output_tokens ?? 0;
      const costEur      = estimateCostUsd(model, inputTokens, cachedTokens, outputTokens) * USD_TO_EUR;

      // Attribution : le candidat cible passé par le pro, sinon la fiche de
      // l'élève lui-même (kind=student → ctx.candidate_id).
      const entityId: string | null = candidateId ?? ctx.candidate_id ?? null;
      // usage_events.user_id → FK vers `profiles` (staff only). Un élève n'a pas
      // de ligne profiles → user_id null pour lui (attribution via entity_id).
      const usageUserId: string | null = kind === 'staff' ? user.id : null;
      const { error: insErr } = await supabaseAdmin.from('usage_events').insert({
        org_id:      orgId,
        user_id:     usageUserId,
        action:      enumAction,
        tokens_used: inputTokens + outputTokens,
        cost_eur:    costEur,
        entity_type: entityId ? 'candidate' : null,
        entity_id:   entityId,
        metadata:    metadata ?? {},
      });
      if (insErr) console.error('[claude-proxy] usage_events insert error:', insErr);
    }

    return json(result);

  } catch (err) {
    console.error('[claude-proxy]', err);
    return json({ error: (err as Error).message }, 500);
  }
});
