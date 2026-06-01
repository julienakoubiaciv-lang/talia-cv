/**
 * useCheckoutSuccess — Gère le retour de Stripe Checkout.
 *
 * Déclenchement : l'URL contient ?checkout=success
 *
 * Flux :
 *   1. Détecte le paramètre → affiche "activation en cours…"
 *   2. Nettoie l'URL (history.replaceState)
 *   3. Poll Supabase /subscriptions toutes les POLL_INTERVAL ms
 *      jusqu'à ce que le tier passe à 'personal' ou 'business'
 *      (timeout = MAX_WAIT ms)
 *   4. Quand activé → appelle onActivated(tier) pour mettre à jour l'UI
 *   5. Si timeout → état 'pending' (le webhook n'est pas encore arrivé)
 *
 * Retourne :
 *   { checkoutState }  où checkoutState est null | 'activating' | 'activated' | 'pending'
 *   { activatedTier }  le tier activé ('personal' | 'business') ou null
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { isAuthenticated, getCurrentUserId } from '@/lib/currentUser';
import { PLANS } from '@/lib/planConfig';
import { track } from '@/lib/monitoring';

const POLL_INTERVAL = 3000;  // ms entre chaque poll
const MAX_WAIT      = 30000; // 30s max d'attente

export function useCheckoutSuccess({ onActivated } = {}) {
  const [checkoutState,  setCheckoutState]  = useState(null);
  const [activatedTier,  setActivatedTier]  = useState(null);

  const pollRef    = useRef(null);
  const startedRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollSubscription = useCallback(async () => {
    if (!supabaseReady || !supabase || !isAuthenticated()) return;

    const userId = getCurrentUserId();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single();

    if (error || !data) return;

    const isPaid = ['active', 'trialing'].includes(data.status)
      && PLANS[data.tier]
      && data.tier !== 'free';

    if (isPaid) {
      stopPolling();
      setActivatedTier(data.tier);
      setCheckoutState('activated');
      track('checkout_completed', { tier: data.tier, source: 'stripe' });
      onActivated?.(data.tier);
      return;
    }

    // Timeout dépassé → le webhook n'est probablement pas encore arrivé
    if (startedRef.current && Date.now() - startedRef.current > MAX_WAIT) {
      stopPolling();
      setCheckoutState('pending');
    }
  }, [onActivated, stopPolling]);

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const success = params.get('checkout') === 'success';
    if (!success) return;

    // Nettoyer l'URL immédiatement
    params.delete('checkout');
    params.delete('session_id');
    const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', clean);

    setCheckoutState('activating');
    startedRef.current = Date.now();

    // Premier poll immédiat
    pollSubscription();

    // Puis toutes les POLL_INTERVAL ms
    pollRef.current = setInterval(pollSubscription, POLL_INTERVAL);

    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount uniquement

  const dismiss = useCallback(() => {
    setCheckoutState(null);
    setActivatedTier(null);
  }, []);

  return { checkoutState, activatedTier, dismiss };
}
