/**
 * usePlan — Hook React wrappant planConfig.js
 *
 * Expose les feature flags en temps réel (réagit aux changements de plan
 * via storage events cross-onglet).
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentPlan,
  getCurrentTier,
  canDo,
  canCreateCV,
  canCreateProfile,
  canUseTemplate,
  remainingCVs,
  nextPlanLabel,
  setPlan,
  PLANS,
} from '@/lib/planConfig';

export function usePlan() {
  const [tier, setTier] = useState(getCurrentTier);

  // Sync si le plan change dans un autre onglet
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'talia_plan') setTier(getCurrentTier());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const plan = PLANS[tier];

  const upgrade = useCallback((newTier, source = 'manual') => {
    setPlan(newTier, source);
    setTier(newTier);
  }, []);

  return {
    tier,
    plan,
    // Raccourcis
    isFree:     tier === 'free',
    isPersonal: tier === 'personal',
    isBusiness: tier === 'business',
    // Feature checks
    canBulk:              plan.bulkEnabled,
    canCloudSync:         plan.cloudSync,
    canCRMSync:           plan.crmSync,
    canCV:                (count) => canCreateCV(count),
    canProfile:           (count) => canCreateProfile(count),
    canTemplate:          (id) => canUseTemplate(id),
    remainingCVs:         (count) => remainingCVs(count),
    nextPlan:             nextPlanLabel(),
    // Mutations
    upgrade,
  };
}
