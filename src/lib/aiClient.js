import { supabase, supabaseReady } from './supabase';

/**
 * Erreur structurée renvoyée par callAI.
 *  - code 'auth'    → utilisateur non connecté (401)
 *  - code 'quota'   → quota dépassé (429) ; porte { used, limit, tier }
 *  - code 'config'  → Supabase non configuré
 *  - code 'api'     → erreur Anthropic ou réseau
 */
export class AIError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    Object.assign(this, extra);
  }
}

/**
 * Appelle l'IA via l'Edge Function claude-proxy (clé serveur, quotas, log usage).
 * La clé Anthropic n'est jamais exposée au client.
 *
 * @param {object}   p
 * @param {string}   p.action      'generate_cv' | 'coach' | 'parse_pdf' | 'smart_match' | ...
 * @param {object[]} p.messages    messages Anthropic (rôle/contenu)
 * @param {string}  [p.system]     prompt système
 * @param {string}  [p.model]      id modèle (défaut côté proxy : claude-sonnet-4-6)
 * @param {number}  [p.max_tokens] défaut côté proxy : 2048
 * @returns {Promise<object>}      résultat Anthropic brut ({ content: [...], usage, ... })
 */
export async function callAI({ action, messages, system, model, max_tokens }) {
  if (!supabaseReady || !supabase) {
    throw new AIError('config', 'Service IA non configuré.');
  }

  const body = { action, messages };
  if (system != null) body.system = system;
  if (model != null) body.model = model;
  if (max_tokens != null) body.max_tokens = max_tokens;

  const { data, error } = await supabase.functions.invoke('claude-proxy', { body });

  // functions.invoke met les réponses non-2xx dans error.context (Response)
  if (error) {
    const res = error.context;
    if (res && typeof res.json === 'function') {
      let payload = null;
      try { payload = await res.json(); } catch { /* corps non-JSON */ }
      if (res.status === 401) {
        throw new AIError('auth', 'Connexion requise pour utiliser l’IA.');
      }
      if (res.status === 429 || payload?.error === 'quota_exceeded') {
        throw new AIError('quota', 'Quota atteint pour ce mois.', {
          used:  payload?.used,
          limit: payload?.limit,
          tier:  payload?.tier,
        });
      }
      throw new AIError('api', payload?.detail || payload?.error || 'Erreur du service IA.');
    }
    throw new AIError('api', error.message || 'Erreur réseau du service IA.');
  }

  if (data?.error) {
    if (data.error === 'quota_exceeded') {
      throw new AIError('quota', 'Quota atteint pour ce mois.', {
        used: data.used, limit: data.limit, tier: data.tier,
      });
    }
    throw new AIError('api', data.detail || data.error);
  }

  return data;
}

/** Message utilisateur lisible pour une erreur (AIError ou Error standard). */
export function aiErrorMessage(e) {
  if (e instanceof AIError) {
    if (e.code === 'auth')   return 'Connecte-toi pour utiliser l’IA.';
    if (e.code === 'config') return 'Service IA non configuré.';
    if (e.code === 'quota') {
      const detail = (e.used != null && e.limit != null)
        ? ` (${e.used}/${e.limit} ce mois, plan ${e.tier})`
        : '';
      return `Quota atteint${detail}. Passe à un plan supérieur.`;
    }
  }
  return e?.message || 'Erreur du service IA.';
}

/** Extrait le texte concaténé d'une réponse Anthropic. */
export function aiText(result) {
  if (!result?.content?.length) return '';
  return result.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
