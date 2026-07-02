/**
 * useEntitlements — Droits d'accès EFFECTIFS (perso + parrainage org + rôle + élève OCTO).
 *
 * Combine usePlan (abo perso), useOrg (parrainage école/entreprise), useRole
 * (owner/admin) et useUserContext (RPC get_user_context, base OCTO consolidée)
 * en une source unique pour le gating. Règles directrices :
 *
 *   élève OCTO (kind='student') → tier 'student' qui ÉCRASE tout le reste
 *     (jamais résolu via betterTier : un élève rattaché à une école hériterait
 *     sinon de l'illimité et contournerait le cap). maxCVs = candidates.max_cv
 *     (« crédit » ajustable par le pro, défaut 3), bulk désactivé.
 *   sinon : tier effectif = le MEILLEUR de { abo perso, parrainage org }
 *   staff (owner/admin) = accès total (serveur déjà exempté de quota)
 *
 * Tout le gating (PRO, énergie, CV, templates…) hérite de ce tier effectif.
 *
 * Retourne tout ce que renvoie usePlan, mais avec `tier` / `isFree` / les
 * capacités RECALCULÉS sur le tier effectif, plus :
 *   - isStaff, isStudent, hasPro, proLocked, sponsoredTier
 */
import { usePlan } from '@/hooks/usePlan';
import { useRole } from '@/hooks/useRole';
import { useOrg } from '@/hooks/useOrg';
import { useUserContext } from '@/hooks/useUserContext';
import { PLANS, betterTier } from '@/lib/planConfig';

export function useEntitlements() {
  const plan = usePlan();
  const { isStaff: roleStaff, role, loading } = useRole();
  const { tier: orgTier, orgName } = useOrg();
  const ctx = useUserContext();

  // ── Mode élève : écrase tout (voir en-tête). Un élève n'est jamais staff.
  const isStudent = ctx.isStudent;
  const isStaff = !isStudent && roleStaff;

  const tier = isStudent ? 'student' : betterTier(plan.tier, orgTier);
  const baseEff = PLANS[tier] || PLANS.free;
  // Le « crédit » du pro (candidates.max_cv, servi par la RPC) surcharge le
  // maxCVs par défaut du tier student.
  const eff = isStudent && ctx.maxCv != null ? { ...baseEff, maxCVs: ctx.maxCv } : baseEff;
  const isFree = tier === 'free';
  const hasPro = isStaff || isStudent || !isFree;

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
    isStudent,
    // Compteur serveur (cv_history) : source de vérité du cap élève.
    studentCvCount: isStudent ? ctx.cvCount : null,
    canGenerate: isStudent ? ctx.canGenerate : true,
    sponsoredTier: orgTier || null,
    orgName: orgName || null,
    role,
    roleLoading: loading || ctx.loading,
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
