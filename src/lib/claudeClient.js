/**
 * claudeClient — Wrapper unifié pour tous les appels Claude via Edge Function
 *
 * Remplace tous les fetch('/api/anthropic', ...) du projet.
 * La clé Anthropic n'est plus jamais côté client : tout passe par
 * supabase/functions/claude-proxy avec auth JWT obligatoire.
 *
 * Usage :
 *   import { callClaude, QuotaError } from '@/lib/claudeClient';
 *
 *   try {
 *     const res = await callClaude({
 *       action:   'generate_cv',
 *       model:    'claude-haiku-4-5',
 *       system:   SYSTEM_PROMPT,          // sera mis en cache automatiquement
 *       messages: [{ role: 'user', content: 'Génère un CV pour…' }],
 *     });
 *     const text = res.content[0]?.text;
 *   } catch (err) {
 *     if (err instanceof QuotaError) {
 *       // afficher modal upgrade avec err.used / err.limit / err.tier
 *     }
 *   }
 */
import { supabase, supabaseReady } from '@/lib/supabase';

const FN_URL = supabaseReady
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`
  : null;

/** Erreur dédiée pour les quotas dépassés. */
export class QuotaError extends Error {
  constructor({ action, used, limit, tier }) {
    super(`Quota dépassé pour ${action} (${used}/${limit}, tier=${tier})`);
    this.name = 'QuotaError';
    this.action = action;
    this.used = used;
    this.limit = limit;
    this.tier = tier;
  }
}

/** Erreur générique côté Claude / Edge. */
export class ClaudeProxyError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ClaudeProxyError';
    this.status = status;
  }
}

/**
 * Appelle l'Edge Function claude-proxy.
 * @param {object} opts
 * @param {string} opts.action      - 'generate_cv' | 'smart_match' | 'coach' | 'multilingual' | 'photo_ai'
 * @param {string} [opts.model]     - 'claude-haiku-4-5' (défaut) | 'claude-sonnet-4-5'
 * @param {string} [opts.system]    - prompt système (cacheable automatiquement)
 * @param {Array}  opts.messages    - [{ role, content }]
 * @param {number} [opts.max_tokens]
 * @param {object} [opts.metadata]  - logué tel quel dans usage_events.metadata
 * @returns {Promise<object>} réponse Anthropic standard ({ id, content, usage, ... })
 */
export async function callClaude({
  action,
  model = 'claude-haiku-4-5',
  system,
  messages,
  max_tokens = 4096,
  metadata,
}) {
  if (!FN_URL || !supabase) {
    throw new ClaudeProxyError('Supabase non configuré', 0);
  }

  // Récupère le JWT utilisateur
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new ClaudeProxyError(
      'Connecte-toi pour utiliser cette fonctionnalité.',
      401
    );
  }

  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ action, model, system, messages, max_tokens, metadata }),
  });

  // Quota dépassé → erreur typée pour que l'UI ouvre la modal upgrade
  if (res.status === 429) {
    const err = await res.json().catch(() => ({}));
    throw new QuotaError({
      action: err.action ?? action,
      used:   err.used   ?? 0,
      limit:  err.limit  ?? 0,
      tier:   err.tier   ?? 'free',
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ClaudeProxyError(
      err.detail || err.error || `Erreur Claude proxy (${res.status})`,
      res.status
    );
  }

  return res.json();
}

/**
 * Extrait le texte de la première content block (cas le plus fréquent).
 * @param {object} response
 * @returns {string}
 */
export function extractText(response) {
  const block = response?.content?.[0];
  if (block?.type === 'text') return block.text;
  return '';
}
