/**
 * claude-proxy — Supabase Edge Function (cible : projet OCTO, base unifiée)
 *
 * Proxy sécurisé vers l'API Anthropic pour le générateur / la plateforme.
 * - Auth JWT obligatoire (générateur réservé aux PROS).
 * - Vérifie le quota AU NIVEAU ORG via check_quota (fail-closed).
 * - Gate consentement RGPD : si un candidate_id est fourni pour une génération,
 *   exige candidates.consent_given = true (décision produit : consentement par candidat).
 * - Enregistre l'usage dans usage_events (schéma OCTO : org_id, action enum,
 *   tokens_used, cost_eur, entity_type/id, metadata). Le trigger increment_org_usage
 *   incrémente alors usage_cv_current / usage_score_current selon l'action.
 * - La clé ANTHROPIC_API_KEY n'est jamais exposée au client.
 *
 * POST /functions/v1/claude-proxy
 * Headers : Authorization: Bearer <supabase_jwt>
 * Body    : { action, messages, model?, system?, max_tokens?, candidate_id?, metadata? }
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
 */
const ACTION_ENUM: Record<string, string> = {
  generate_cv:       'cv_generation',
  cv_generation:     'cv_generation',
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

    // ── Org du pro (générateur réservé aux pros). Sert au quota + au log usage. ──
    const { data: prof } = await supabaseAdmin
      .from('user_profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId: string | null = prof?.org_id ?? null;
    if (!orgId) {
      // Pas de profil pro → pas autorisé à utiliser l'IA (anti-abus étudiant).
      return json({ error: 'forbidden_not_pro' }, 403);
    }

    // ── Gate consentement RGPD (si un candidat cible est fourni pour une génération) ──
    if (candidateId && ACTION_ENUM[action] === 'cv_generation') {
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

    // ── Vérification quota (fail-closed) ───────────────────────
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

      const { error: insErr } = await supabaseAdmin.from('usage_events').insert({
        org_id:      orgId,
        user_id:     user.id,
        action:      enumAction,
        tokens_used: inputTokens + outputTokens,
        cost_eur:    costEur,
        entity_type: candidateId ? 'candidate' : null,
        entity_id:   candidateId,
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
