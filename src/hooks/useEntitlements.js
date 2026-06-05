/**
 * useEntitlements — Droits d'accès effectifs (plan + rôle).
 *
 * Combine usePlan (forfait) et useRole (owner/admin) en une source unique pour
 * les gates de fonctionnalités. Un membre du staff (owner/admin) a accès à TOUT,
 * quel que soit son forfait — côté serveur, le staff est déjà exempté de quota.
 *
 * Retourne tout ce que renvoie usePlan, plus :
 *   - isStaff   : owner ou admin
 *   - hasPro    : accès aux fonctionnalités PRO (staff OU forfait payant)
 *   - proLocked : raccourci pour les gates (= !hasPro)
 *   - canBulk   : génération en masse (staff inclus)
 */
import { usePlan } from '@/hooks/usePlan';
import { useRole } from '@/hooks/useRole';

export function useEntitlements() {
  const plan = usePlan();
  const { isStaff, role, loading } = useRole();
  const hasPro = isStaff || !plan.isFree;

  return {
    ...plan,
    role,
    roleLoading: loading,
    isStaff,
    hasPro,
    proLocked: !hasPro,
    // Le staff n'a aucune limite (côté serveur, déjà exempté de quota).
    canBulk: isStaff || plan.canBulk,
    canCV: (n) => isStaff || plan.canCV(n),
    canProfile: (n) => isStaff || plan.canProfile(n),
    canTemplate: (id) => isStaff || plan.canTemplate(id),
    remainingCVs: (n) => (isStaff ? Infinity : plan.remainingCVs(n)),
  };
}
