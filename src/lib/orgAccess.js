/**
 * orgAccess — Accès parrainé par une organisation (école/entreprise).
 *
 * Deux choses :
 *   1. Consommer un LIEN D'INVITATION (?org_invite=TOKEN) → rejoindre l'org.
 *   2. Lire le TIER EFFECTIF côté serveur (max perso / parrainage).
 *
 * Offline-first : sans Supabase ou hors connexion, tout est no-op (l'app
 * retombe sur le tier perso/local). Le token d'invitation est mémorisé tant
 * que l'utilisateur n'est pas connecté, puis consommé après login.
 */
import { supabase, supabaseReady } from './supabase';
import { isAuthenticated } from './currentUser';
import { isDemoMode } from './demoMode';
import { redeemDemoInvite, demoOrgTier } from './demoOrg';

const LS_PENDING = 'talia_pending_invite';
const LS_ORG_NAME = 'talia_org_name';   // nom de l'école rattachée
const LS_JOIN_NOTICE = 'talia_join_notice'; // notice de bienvenue (one-shot)

/** Détecte ?org_invite=TOKEN dans l'URL, le mémorise et nettoie l'URL. */
export function consumeOrgInviteFromURL() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('org_invite');
  if (!token) return null;
  try { localStorage.setItem(LS_PENDING, token); } catch { /* ignore */ }
  params.delete('org_invite');
  const search = params.toString() ? '?' + params.toString() : '';
  window.history.replaceState({}, '', window.location.pathname + search + window.location.hash);
  return token;
}

export function getPendingInvite() {
  try { return localStorage.getItem(LS_PENDING) || null; } catch { return null; }
}
export function clearPendingInvite() {
  try { localStorage.removeItem(LS_PENDING); } catch { /* ignore */ }
}

/** Nom de l'école rattachée (ou null). */
export function getOrgName() {
  try { return localStorage.getItem(LS_ORG_NAME) || null; } catch { return null; }
}
/** Notice de bienvenue à afficher une fois après rattachement (ou null). */
export function getJoinNotice() {
  try { return localStorage.getItem(LS_JOIN_NOTICE) || null; } catch { return null; }
}
export function clearJoinNotice() {
  try { localStorage.removeItem(LS_JOIN_NOTICE); } catch { /* ignore */ }
}
function onJoined(orgName) {
  try {
    if (orgName) { localStorage.setItem(LS_ORG_NAME, orgName); localStorage.setItem(LS_JOIN_NOTICE, orgName); }
  } catch { /* ignore */ }
}

/**
 * Consomme l'invitation en attente (si connecté). Renvoie le résultat de la RPC
 * { ok, org_id, org_name, reason } ou null si rien à faire.
 */
export async function redeemPendingInvite() {
  const token = getPendingInvite();
  if (!token) return null;

  // Mode démo : organisations simulées en local.
  if (isDemoMode()) {
    const res = redeemDemoInvite(token);
    clearPendingInvite();
    if (res.ok) onJoined(res.org_name);
    return res;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return null;
  try {
    const { data, error } = await supabase.rpc('redeem_org_invite', { p_token: token });
    if (error) { console.warn('[orgAccess] redeem:', error.message); return null; }
    const res = Array.isArray(data) ? data[0] : data;
    // On ne réessaie pas un token invalide/épuisé ; on garde si « no_seats » (transitoire)
    if (res?.ok || ['invalid', 'expired', 'exhausted', 'email_mismatch'].includes(res?.reason)) {
      clearPendingInvite();
    }
    if (res?.ok) onJoined(res.org_name);
    return res || null;
  } catch (e) { console.warn('[orgAccess] redeem:', e?.message); return null; }
}

/** Tier effectif côté serveur (max perso/parrainage), ou null hors-ligne. */
export async function fetchEffectiveTier() {
  if (isDemoMode()) return demoOrgTier();
  if (!supabaseReady || !supabase || !isAuthenticated()) return null;
  try {
    const { data, error } = await supabase.rpc('my_effective_tier');
    if (error) { console.warn('[orgAccess] tier:', error.message); return null; }
    return typeof data === 'string' ? data : null;
  } catch (e) { console.warn('[orgAccess] tier:', e?.message); return null; }
}
