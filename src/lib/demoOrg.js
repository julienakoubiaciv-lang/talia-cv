/**
 * demoOrg — Organisations SIMULÉES (mode démo, sans backend).
 *
 * Permet de jouer le parcours « une école inscrit un étudiant via un lien »
 * de bout en bout en local, tant que le backend Supabase n'est pas déployé.
 * Deux écoles de démonstration + leurs liens d'invitation.
 *
 * L'appartenance est stockée par navigateur (localStorage) → pour simuler
 * deux étudiants différents, on réinitialise l'état entre les deux.
 */
const LS_MEMBER = 'talia_demo_membership';

/** Écoles de démo, indexées par token d'invitation. */
export const DEMO_INVITES = {
  'TALIA-PARIS-2026': { orgId: 'demo-paris', orgName: 'École Talia Paris', tier: 'school', cohort: 'Promo 2026' },
  'CFA-LYON-DIGITAL': { orgId: 'demo-lyon',  orgName: 'CFA Lyon Digital',  tier: 'school', cohort: 'Dev Web' },
};

/** Consomme un lien d'invitation de démo → enregistre l'appartenance. */
export function redeemDemoInvite(token) {
  const inv = DEMO_INVITES[token];
  if (!inv) return { ok: false, reason: 'invalid' };
  const membership = { ...inv, joinedAt: new Date().toISOString() };
  try { localStorage.setItem(LS_MEMBER, JSON.stringify(membership)); } catch { /* ignore */ }
  return { ok: true, org_id: inv.orgId, org_name: inv.orgName, reason: 'joined' };
}

/** Appartenance de démo courante (ou null). */
export function demoMembership() {
  try { return JSON.parse(localStorage.getItem(LS_MEMBER) || 'null'); }
  catch { return null; }
}

/** Tier de parrainage de démo (ou null). */
export function demoOrgTier() {
  return demoMembership()?.tier || null;
}

/** Quitte l'école de démo (pour réinitialiser une simulation). */
export function leaveDemoOrg() {
  try { localStorage.removeItem(LS_MEMBER); } catch { /* ignore */ }
}
