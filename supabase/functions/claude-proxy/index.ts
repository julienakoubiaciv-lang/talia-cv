/**
 * claude-proxy — Supabase Edge Function (projet OCTO, base unifiée)
 *
 * Proxy sécurisé vers l'API Anthropic, partagé par les DEUX apps qui parlent
 * à ce projet Supabase : le CRM (`web-v2` — actions `generate_cv` côté
 * candidat via `cvAnalyse.ts` et `crm_cv_generation` via
 * `lib/actions/cvGenerate.ts`) et le générateur grand public (`altio-cv` —
 * `generate_cv`, `smart_match`, etc., candidats connectés directement).
 *
 * ⚠️ CE FICHIER EST DUPLIQUÉ À L'IDENTIQUE entre `web-v2` et `altio-cv`
 * (`supabase/functions/claude-proxy/index.ts` dans les deux dépôts) : les
 * deux déploient la MÊME fonction sur le MÊME projet Supabase
 * (`zxiroikfhrwsyzgqflzb`), donc un déploiement depuis l'un écrase le
 * résultat du dernier déploiement de l'autre si le contenu diverge. Toute
 * modification ici doit être reportée dans l'autre dépôt (et
 * réciproquement) — pas de fork silencieux. Les deux copies doivent rester
 * git-identiques (`diff` doit ne rien montrer) ; un écart constaté = l'une
 * des deux PR de synchronisation a été oubliée.
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
  // Actions du CRM natif restées hors mapping depuis leur création : ni
  // comptées dans le quota org, ni loguées dans usage_events (coût Anthropic
  // invisible). `crm_score_profil` rejoint 'candidate_scoring' (même nature
  // que candidate_scoring/cv_scoring) ; `crm_match` rejoint 'matching' (même
  // nature que smart_match) ; `crm_referentiel_extraction` n'a pas
  // d'équivalent — nouvelle valeur d'enum dédiée (migration
  // 20260829a_usage_action_referentiel_extraction.sql) plutôt qu'un
  // rattachement approximatif qui fausserait les KPI.
  crm_score_profil:          'candidate_scoring',
  crm_match:                 'matching',
  crm_referentiel_extraction: 'referentiel_extraction',
  // Analyse IA de l'onglet Performance (lib/actions/performanceAi.ts) —
  // bucket "free" comme matching/referentiel_extraction (pas de plafond
  // dédié), mais doit rester loguée dans usage_events (cf. migration
  // 20260903a_usage_action_performance_analysis.sql).
  performance_ai_analysis:  'performance_analysis',
  // Retouches IA de la Messagerie (lib/actions/messagerieAi.ts) — 6 variantes,
  // une seule valeur d'enum (comme referentiel_extraction). C'était l'action
  // IA la plus fréquente du CRM restée hors ACTION_ENUM depuis sa création :
  // ni comptée, ni loguée (cf. migration 20260903b_usage_action_messagerie_ai.sql).
  // Plafonnée depuis (bucket dédié 'messagerie' dans check_quota, 200/mois/org
  // par défaut — cf. migration 20260903c_quota_messagerie_ai.sql) : c'est
  // l'action la plus répétée du CRM (à volonté par message), la seule des
  // actions récemment ajoutées à rester sans filet aurait été un choix, pas
  // un oubli.
  crm_messagerie_reformuler:  'messagerie_ai',
  crm_messagerie_raccourcir:  'messagerie_ai',
  crm_messagerie_adoucir:     'messagerie_ai',
  crm_messagerie_corriger:    'messagerie_ai',
  crm_messagerie_resumer:     'messagerie_ai',
  crm_messagerie_traduire:    'messagerie_ai',
  // Boutons IA de l'onglet Activité (lib/actions/activityAi.ts) — jusqu'ici
  // grisés côté UI (« proxy IA à brancher »), donc jamais appelés. Rejoignent
  // les deux valeurs d'enum posées dès l'origine mais jamais utilisées
  // ('daily_intelligence', 'accroche_generation') plutôt que d'en créer deux
  // de plus.
  crm_activite_resume:       'daily_intelligence',
  crm_activite_email:        'accroche_generation',
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
    // Plusieurs candidats ciblés à la fois (ex. `crm_match`, comparateur) —
    // `candidateId` seul reste supporté pour la rétro-compatibilité.
    const candidateIds: string[] = Array.isArray(body.candidate_ids)
      ? (body.candidate_ids as unknown[]).filter((v): v is string => typeof v === 'string')
      : candidateId
        ? [candidateId]
        : [];

    if (!action || !messages?.length) {
      return json({ error: 'action et messages requis' }, 400);
    }

    // Calculé une seule fois : sert à la fois au logging usage_events (plus
    // bas) et — désormais — à la vérification de quota ORG ci-dessous. La
    // RPC `check_quota` catégorise sur des noms d'action précis
    // ('generate_cv'/'cv_generation', 'candidate_scoring'/'cv_scoring'/'score') ;
    // lui passer l'action BRUTE du front (ex. 'crm_cv_generation',
    // 'crm_score_profil') la faisait tomber dans son bucket 'free', donc
    // sans plafond, quel que soit le contenu d'ACTION_ENUM ci-dessus.
    const enumAction = ACTION_ENUM[action] ?? null;
    const isCvGen = enumAction === 'cv_generation';

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
      // ── STAFF (pro) : gate consentement RGPD (si un ou plusieurs candidats
      // ciblés) + quota ORG.
      //
      // Portait auparavant sur `isCvGen` seul : `cv_scoring` (le CV réel —
      // document ou image — est envoyé tel quel à Anthropic), `crm_score_profil`
      // et `crm_match` (comparaison de plusieurs profils, cf. correction du
      // 2026-08-29) transmettent tout autant de PII candidat sans jamais être
      // soumis à ce contrôle. Le consentement est vérifié pour CHAQUE candidat
      // ciblé par la requête, quelle que soit l'action.
      if (candidateIds.length) {
        const { data: cands } = await supabaseAdmin
          .from('candidates')
          .select('id, consent_given')
          .in('id', candidateIds);
        const consentById = new Map(
          (cands ?? []).map((c: { id: string; consent_given: boolean }) => [c.id, c.consent_given])
        );
        for (const cid of candidateIds) {
          if (!consentById.has(cid)) return json({ error: 'unknown_candidate' }, 400);
          if (!consentById.get(cid)) return json({ error: 'consent_required', candidate_id: cid }, 403);
        }
      }

      // Vérification quota org (fail-closed). Action MAPPÉE (cf. `enumAction`
      // ci-dessus), pas l'action brute — voir le commentaire associé.
      const { data: quota, error: quotaErr } = await supabaseAdmin
        .rpc('check_quota', { p_user_id: user.id, p_action: enumAction ?? action });
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
    // `enumAction` déjà calculé plus haut (réutilisé pour le quota).
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
