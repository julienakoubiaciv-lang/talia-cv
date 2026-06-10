/**
 * claude-proxy — Supabase Edge Function
 *
 * Proxy sécurisé vers l'API Anthropic.
 * - Vérifie le quota de l'utilisateur avant chaque appel
 * - Enregistre l'usage (tokens + coût estimé) dans usage_events
 * - La clé ANTHROPIC_API_KEY n'est jamais exposée au client
 *
 * POST /functions/v1/claude-proxy
 * Headers : Authorization: Bearer <supabase_jwt>
 * Body    : { action: string, messages: object[], model?: string, system?: string, max_tokens?: number }
 *
 * Secrets requis :
 *   ANTHROPIC_API_KEY       — sk-ant-...
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL  = 'claude-sonnet-4-6';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Coût estimé en USD pour 1M tokens (entrée / sortie)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.25,  output: 1.25  },
  'claude-sonnet-4-6':         { input: 3.00,  output: 15.00 },
  'claude-opus-4-7':           { input: 15.00, output: 75.00 },
};

function estimateCost(model: string, inputTokens: number, cachedTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_MODEL];
  const billableInput = Math.max(0, inputTokens - cachedTokens);
  return (billableInput * pricing.input + outputTokens * pricing.output) / 1_000_000;
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
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, messages, system, max_tokens = 2048 } = body;
    const model = body.model ?? DEFAULT_MODEL;

    if (!action || !messages?.length) {
      return new Response(JSON.stringify({ error: 'action et messages requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Vérification quota (fail-closed) ───────────────────────
    const { data: quota, error: quotaErr } = await supabaseAdmin
      .rpc('check_quota', { p_user_id: user.id, p_action: action });

    // Si la vérification de quota échoue, on BLOQUE (fail-closed) :
    // mieux vaut refuser un appel légitime que laisser filer la dépense.
    if (quotaErr || !quota) {
      console.error('[claude-proxy] check_quota error:', quotaErr);
      return new Response(JSON.stringify({ error: 'quota_check_failed' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quotaRow = quota?.[0];
    // Pas de ligne de quota exploitable → on bloque (fail-closed).
    if (!quotaRow) {
      console.error('[claude-proxy] check_quota: aucune ligne retournée', { action, user: user.id });
      return new Response(JSON.stringify({ error: 'quota_check_failed' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!quotaRow.allowed) {
      return new Response(JSON.stringify({
        error: 'quota_exceeded',
        used:  quotaRow.used,
        limit: quotaRow.limit,
        tier:  quotaRow.tier,
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'anthropic_error', detail: errText }), {
        status: anthropicRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await anthropicRes.json();

    // ── Enregistrement usage ───────────────────────────────────
    const usage       = result.usage ?? {};
    const inputTokens  = usage.input_tokens   ?? 0;
    const cachedTokens = usage.cache_read_input_tokens ?? 0;
    const outputTokens = usage.output_tokens  ?? 0;
    const costUsd      = estimateCost(model, inputTokens, cachedTokens, outputTokens);

    await supabaseAdmin.from('usage_events').insert({
      user_id:       user.id,
      action,
      model,
      input_tokens:  inputTokens,
      cached_tokens: cachedTokens,
      output_tokens: outputTokens,
      cost_usd:      costUsd,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[claude-proxy]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
