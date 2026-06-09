/**
 * useEntitlements — Droits d'accès EFFECTIFS (perso + parrainage org + rôle).
 *
 * Combine usePlan (abo perso), useOrg (parrainage école/entreprise) et useRole
 * (owner/admin) en une source unique pour le gating. Règle directrice :
 *
 *   tier effectif = le MEILLEUR de { abo perso, parrainage org }
 *   staff (owner/admin) = accès total (serveur déjà exempté de quota)
 *
 * Tout le gating (PRO, énergie, CV, templates…) hérite de ce tier effectif.
 *
 * Retourne tout ce que renvoie usePlan, mais avec `tier` / `isFree` / les
 * capacités RECALCULÉS sur le tier effectif, plus :
 *   - isStaff, hasPro, proLocked, sponsoredTier
 */
import { usePlan } from '@/hooks/usePlan';
import { useRole } from '@/hooks/useRole';
import { useOrg } from '@/hooks/useOrg';
import { PLANS, betterTier } from '@/lib/planConfig';

export function useEntitlements() {
  const plan = usePlan();
  const { isStaff, role, loading } = useRole();
  const { tier: orgTier } = useOrg();

  // Tier effectif = max(perso, parrainage org)
  const tier = betterTier(plan.tier, orgTier);
  const eff = PLANS[tier] || PLANS.free;
  const isFree = tier === 'free';
  const hasPro = isStaff || !isFree;

  const cvCap = eff.maxCVs;
  const profCap = eff.maxProfiles;

  return {
    ...plan,
    // Surcharges sur le tier effectif
    tier,
    plan: eff,
    isFree,
    isPersonal: tier === 'personal',
    isBusiness: tier === 'business',
    isSchool: tier === 'school',
    sponsoredTier: orgTier || null,
    role,
    roleLoading: loading,
    isStaff,
    hasPro,
    proLocked: !hasPro,
    // Capacités recalculées sur le tier effectif (staff = illimité)
    canBulk: isStaff || eff.bulkEnabled,
    canCV: (n) => isStaff || n < cvCap,
    canProfile: (n) => isStaff || profCap === Infinity || n < profCap,
    canTemplate: (id) => isStaff || eff.templateIds.includes(id),
    remainingCVs: (n) => (isStaff || cvCap === Infinity ? Infinity : Math.max(0, cvCap - n)),
  };
}
