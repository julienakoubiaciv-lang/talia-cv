/**
 * claude-proxy — Edge Function unique pour tous les appels Claude
 *
 * Responsabilités :
 *   1. Authentification JWT Supabase obligatoire
 *   2. Vérification quota via RPC check_quota (bypass owner/admin)
 *   3. Appel Anthropic avec prompt caching activé
 *   4. Log des usage_events (tokens + coût)
 *
 * Variables d'environnement requises :
 *   ANTHROPIC_API_KEY        — clé secrète Claude
 *   SUPABASE_URL             — URL projet
 *   SUPABASE_SERVICE_ROLE_KEY — clé service (pour insert usage_events)
 *
 * Body attendu :
 *   {
 *     action:      'generate_cv' | 'smart_match' | 'coach' | 'multilingual' | 'photo_ai',
 *     model?:      'claude-haiku-4-5' | 'claude-sonnet-4-5',  // défaut haiku
 *     system?:     string,                                     // prompt système (sera cacheable)
 *     messages:    [{ role, content }],
 *     max_tokens?: number,                                     // défaut 4096
 *     metadata?:   object,                                     // logué tel quel
 *   }
 *
 * Réponses :
 *   200 → JSON Anthropic standard
 *   401 → { error: 'unauthorized' }
 *   429 → { error: 'quota_exceeded', used, limit, tier }
 *   500 → { error: 'internal_error', detail }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.32';

// ── Tarifs Anthropic en $/M tokens (à mettre à jour si Anthropic change les prix) ──
const PRICING: Record<string, { input: number; cached: number; output: number }> = {
  'claude-haiku-4-5':  { input: 1.0, cached: 0.10, output: 5.0  },
  'claude-sonnet-4-5': { input: 3.0, cached: 0.30, output: 15.0 },
};

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST')    return jsonResponse({ error: 'method_not_allowed' }, 405);

  // ── 1. Authentification ─────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: 'unauthorized', detail: userErr?.message }, 401);
  }
  const user = userData.user;

  // ── 2. Parsing body ─────────────────────────────────────────────────────
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const action     = payload.action     as string;
  const model      = (payload.model     as string) || 'claude-haiku-4-5';
  const system     = payload.system     as string | undefined;
  const messages   = payload.messages   as Array<{ role: string; content: any }>;
  const maxTokens  = (payload.max_tokens as number) || 4096;
  const metadata   = payload.metadata   ?? {};

  if (!action || !Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'invalid_payload', detail: 'action et messages requis' }, 400);
  }

  // ── 3. Vérification quota ───────────────────────────────────────────────
  const { data: quotaRows, error: quotaErr } = await supabase.rpc('check_quota', {
    p_user_id: user.id,
    p_action:  action,
  });

  if (quotaErr) {
    console.error('[claude-proxy] quota check failed:', quotaErr.message);
    return jsonResponse({ error: 'quota_check_failed', detail: quotaErr.message }, 500);
  }

  const quota = quotaRows?.[0];
  if (!quota?.allowed) {
    return jsonResponse({
      error: 'quota_exceeded',
      action,
      used:  quota?.used  ?? 0,
      limit: quota?.limit ?? 0,
      tier:  quota?.tier  ?? 'free',
    }, 429);
  }

  // ── 4. Appel Anthropic avec prompt caching ──────────────────────────────
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });

  // Construction du système avec cache_control
  const systemBlocks = system
    ? [{ type: 'text' as const, text: system, cache_control: { type: 'ephemeral' as const } }]
    : undefined;

  let response;
  try {
    response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      ...(systemBlocks && { system: systemBlocks }),
      messages: messages as any,
    });
  } catch (err: any) {
    console.error('[claude-proxy] anthropic error:', err?.message);
    return jsonResponse({
      error: 'anthropic_error',
      detail: err?.message ?? String(err),
      status: err?.status,
    }, 502);
  }

  // ── 5. Log usage_events ─────────────────────────────────────────────────
  const usage     = response.usage as any;
  const pricing   = PRICING[model] ?? PRICING['claude-haiku-4-5'];
  const inputT    = usage.input_tokens ?? 0;
  const cachedT   = usage.cache_read_input_tokens ?? 0;
  const outputT   = usage.output_tokens ?? 0;
  const cost      = ((inputT - cachedT) * pricing.input
                  + cachedT * pricing.cached
                  + outputT * pricing.output) / 1_000_000;

  const { error: logErr } = await supabase.from('usage_events').insert({
    user_id:       user.id,
    action,
    model,
    input_tokens:  inputT,
    cached_tokens: cachedT,
    output_tokens: outputT,
    cost_usd:      cost,
    metadata,
  });

  if (logErr) {
    console.error('[claude-proxy] usage log failed:', logErr.message);
    // Non-bloquant : on retourne quand même la réponse Claude
  }

  console.log(
    `[claude-proxy] ${action} | model=${model} | ` +
    `in=${inputT} cached=${cachedT} out=${outputT} | ` +
    `cost=$${cost.toFixed(6)} | user=${user.email}`
  );

  return jsonResponse(response, 200);
});
