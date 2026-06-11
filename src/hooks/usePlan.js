/**
 * usePlan — Hook React wrappant planConfig.js + lecture Supabase.
 *
 * Priorité :
 *   1. Supabase subscriptions (si connecté + Supabase configuré)
 *   2. localStorage altio_plan (override manuel, pour tests)
 *   3. Défaut : free
 *
 * Réagit aux changements de plan (storage events cross-onglet).
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentPlan,
  getCurrentTier,
  canCreateCV,
  canCreateProfile,
  canUseTemplate,
  remainingCVs,
  nextPlanLabel,
  setPlan,
  PLANS,
} from '@/lib/planConfig';
import { supabase, supabaseReady } from '@/lib/supabase';
import { isAuthenticated, getCurrentUserId } from '@/lib/currentUser';

export function usePlan() {
  const [tier, setTier] = useState(getCurrentTier);

  // ── Lecture depuis Supabase si authentifié ──────────────────────────────
  useEffect(() => {
    if (!supabaseReady || !supabase || !isAuthenticated()) return;

    const userId = getCurrentUserId();
    supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        // N'activer que les abonnements actifs ou trialing
        if (['active', 'trialing'].includes(data.status) && PLANS[data.tier]) {
          setTier(data.tier);
          // Sync localStorage pour les modules non-React
          setPlan(data.tier, 'supabase');
        } else if (data.status === 'canceled' || data.status === 'past_due') {
          setTier('free');
          setPlan('free', 'supabase');
        }
      });
  }, []);

  // ── Sync si le plan change dans un autre onglet (localStorage) ──────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'altio_plan') setTier(getCurrentTier());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const plan = PLANS[tier] ?? PLANS.free;

  const upgrade = useCallback((newTier, source = 'manual') => {
    setPlan(newTier, source);
    setTier(newTier);
  }, []);

  return {
    tier,
    plan,
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
    upgrade,
  };
}
