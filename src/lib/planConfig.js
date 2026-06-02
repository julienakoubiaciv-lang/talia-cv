/**
 * planConfig.js — Définition des plans et feature flags TaliaCV
 *
 * Hiérarchie : free < personal < business
 *
 * Stockage courant : localStorage talia_plan = { tier, activatedAt, source }
 * Futur : synced depuis Supabase subscriptions (via Stripe webhook).
 *
 * Usage :
 *   import { getCurrentPlan, canDo, PLANS } from '@/lib/planConfig';
 *   if (!canDo('bulk')) → show upgrade gate
 */

const LS_KEY = 'talia_plan';

// ── Définitions des plans ──────────────────────────────────────────────────

export const PLANS = {
  free: {
    id:                 'free',
    label:              'Gratuit',
    emoji:              '🌱',
    maxCVs:             2,
    maxProfiles:        1,
    maxBulkPerSession:  0,       // 0 = bulk désactivé
    bulkEnabled:        false,
    cloudSync:          false,
    crmSync:            false,
    templateIds:        ['classic', 'minimal'],
  },
  personal: {
    id:                 'personal',
    label:              'Personnel',
    emoji:              '⚡',
    maxCVs:             Infinity,
    maxProfiles:        3,
    maxBulkPerSession:  10,
    bulkEnabled:        true,
    cloudSync:          true,
    crmSync:            false,
    templateIds:        ['classic', 'minimal', 'compact', 'impact'],
  },
  business: {
    id:                 'business',
    label:              'Business',
    emoji:              '🏆',
    maxCVs:             Infinity,
    maxProfiles:        Infinity,
    maxBulkPerSession:  Infinity,
    bulkEnabled:        true,
    cloudSync:          true,
    crmSync:            true,
    templateIds:        ['classic', 'minimal', 'compact', 'impact'],
  },
};

// ── Getters / Setters ──────────────────────────────────────────────────────

/** Retourne le tier actuel ('free' | 'personal' | 'business') */
export function getCurrentTier() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return 'free';
    const { tier } = JSON.parse(raw);
    return PLANS[tier] ? tier : 'free';
  } catch {
    return 'free';
  }
}

/** Retourne l'objet plan complet. */
export function getCurrentPlan() {
  return PLANS[getCurrentTier()];
}

/**
 * Définit le plan courant.
 * @param {'free'|'personal'|'business'} tier
 * @param {string} [source] - 'stripe' | 'crm' | 'manual'
 */
export function setPlan(tier, source = 'manual') {
  if (!PLANS[tier]) return;
  localStorage.setItem(LS_KEY, JSON.stringify({
    tier,
    activatedAt: new Date().toISOString(),
    source,
  }));
}

/** Remet en plan gratuit. */
export function resetPlan() {
  localStorage.removeItem(LS_KEY);
}

// ── Feature checks ─────────────────────────────────────────────────────────

/**
 * Vérifie si une feature est disponible pour le plan courant.
 * @param {'bulk'|'cloudSync'|'crmSync'|string} feature
 * @returns {boolean}
 */
export function canDo(feature) {
  const plan = getCurrentPlan();
  switch (feature) {
    case 'bulk':       return plan.bulkEnabled;
    case 'cloudSync':  return plan.cloudSync;
    case 'crmSync':    return plan.crmSync;
    default:           return false;
  }
}

/** Vérifie si l'utilisateur peut créer un nouveau CV. */
export function canCreateCV(currentCount) {
  const plan = getCurrentPlan();
  return currentCount < plan.maxCVs;
}

/** Vérifie si l'utilisateur peut créer un nouveau profil. */
export function canCreateProfile(currentCount) {
  const plan = getCurrentPlan();
  if (plan.maxProfiles === Infinity) return true;
  return currentCount < plan.maxProfiles;
}

/** Vérifie si un template est accessible. */
export function canUseTemplate(templateId) {
  const plan = getCurrentPlan();
  return plan.templateIds.includes(templateId);
}

/** Nombre de CVs restants (Infinity si illimité). */
export function remainingCVs(currentCount) {
  const plan = getCurrentPlan();
  if (plan.maxCVs === Infinity) return Infinity;
  return Math.max(0, plan.maxCVs - currentCount);
}

/** Texte du plan suivant pour les CTAs d'upgrade. */
export function nextPlanLabel() {
  const tier = getCurrentTier();
  if (tier === 'free')     return 'Personnel';
  if (tier === 'personal') return 'Business';
  return null; // déjà au max
}
