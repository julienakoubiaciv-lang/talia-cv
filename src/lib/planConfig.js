/**
 * planConfig.js — Définition des plans et feature flags Altio CV
 *
 * Hiérarchie : free < personal < business
 *
 * Stockage courant : localStorage altio_plan = { tier, activatedAt, source }
 * Futur : synced depuis Supabase subscriptions (via Stripe webhook).
 *
 * Usage :
 *   import { getCurrentPlan, canDo, PLANS } from '@/lib/planConfig';
 *   if (!canDo('bulk')) → show upgrade gate
 */

const LS_KEY = 'altio_plan';

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
  // Cowork : petite équipe encadrée par un coach (3-5 personnes). Le coach paie
  // pour son équipe ; chaque membre obtient un accès « pro ».
  cowork: {
    id:                 'cowork',
    label:              'Cowork',
    emoji:              '🤝',
    maxCVs:             Infinity,
    maxProfiles:        3,
    maxBulkPerSession:  0,
    bulkEnabled:        false,
    cloudSync:          true,
    crmSync:            false,
    templateIds:        ['classic', 'minimal', 'compact', 'impact'],
  },
  // Forfait « parrainé » : accès offert à un élève via son école/entreprise.
  // Pris en charge par l'organisation (sièges), pas de paiement individuel.
  school: {
    id:                 'school',
    label:              'École',
    emoji:              '🎓',
    maxCVs:             Infinity,
    maxProfiles:        3,
    maxBulkPerSession:  0,
    bulkEnabled:        false,
    cloudSync:          true,
    crmSync:            true,
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

/**
 * Classement des tiers par niveau d'accès (pour résoudre l'entitlement effectif).
 * Le tier effectif d'un utilisateur = le MEILLEUR de : abo perso, parrainage org.
 */
export const TIER_RANK = { free: 0, personal: 1, cowork: 2, school: 3, business: 4 };

/** Renvoie le meilleur tier parmi ceux passés (ignore null/inconnus). */
export function betterTier(...tiers) {
  let best = 'free';
  for (const t of tiers) {
    if (t && TIER_RANK[t] != null && TIER_RANK[t] > TIER_RANK[best]) best = t;
  }
  return best;
}

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
