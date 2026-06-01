/**
 * monitoring — Sentry (erreurs) + PostHog (product analytics).
 *
 * Activation conditionnelle via env vars :
 *   - VITE_SENTRY_DSN  → si présent, Sentry est initialisé
 *   - VITE_POSTHOG_KEY → si présent, PostHog est initialisé
 *
 * Si une env var manque, le wrapper devient no-op (sécurisé pour le dev local
 * sans clé). Évite les warnings console en dev.
 *
 * API publique :
 *   - initMonitoring()             — à appeler dans main.jsx au boot
 *   - identifyUser(user)           — appelé après login Supabase
 *   - resetUser()                  — appelé au signOut
 *   - track(event, props?)         — événements produit (PostHog)
 *   - captureError(err, context?)  — erreurs (Sentry)
 *   - captureMessage(msg, level?)  — messages info/warning (Sentry)
 *
 * Conventions d'événements produit (snake_case) :
 *   - cv_generated         { tier, formation, hasAnnonce, model, cost }
 *   - smart_match_used     { tier, score, semanticCount }
 *   - quota_exceeded       { tier, action, used, limit }
 *   - upgrade_clicked      { fromTier, ctaLocation }
 *   - checkout_completed   { tier, source: 'stripe' }
 *   - login | signup | signout
 */
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

const SENTRY_DSN  = import.meta.env.VITE_SENTRY_DSN  || '';
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.posthog.com';
const ENV = import.meta.env.MODE || 'development';

let sentryReady  = false;
let posthogReady = false;

/** Initialise Sentry + PostHog. À appeler une fois au boot. */
export function initMonitoring() {
  // ── Sentry ───────────────────────────────────────────────────────────────
  if (SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENV,
        // Pas de PII envoyée par défaut (les erreurs peuvent contenir des données)
        sendDefaultPii: false,
        // Sample rate raisonnable : 100% des erreurs, 10% des traces perfs
        tracesSampleRate: ENV === 'production' ? 0.1 : 0,
        // Replay session : utile pour debug mais coûteux → off par défaut
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: ENV === 'production' ? 0.1 : 0,
        // Ignorer les erreurs réseau "normales" (offline, abort)
        ignoreErrors: [
          'NetworkError',
          'AbortError',
          'Failed to fetch',
          'Load failed',
        ],
      });
      sentryReady = true;
    } catch (e) {
      console.warn('[monitoring] Sentry init failed:', e);
    }
  }

  // ── PostHog ──────────────────────────────────────────────────────────────
  if (POSTHOG_KEY) {
    try {
      posthog.init(POSTHOG_KEY, {
        api_host:                POSTHOG_HOST,
        person_profiles:         'identified_only', // pas de profil anonyme (RGPD-friendly)
        capture_pageview:        true,
        capture_pageleave:       true,
        autocapture:             false, // on tracke manuellement les events clés
        disable_session_recording: true,
        loaded: () => { posthogReady = true; },
      });
    } catch (e) {
      console.warn('[monitoring] PostHog init failed:', e);
    }
  }

  if (ENV === 'development') {
    console.log('[monitoring]',
      'sentry=' + (SENTRY_DSN ? '✓' : '–'),
      'posthog=' + (POSTHOG_KEY ? '✓' : '–'),
    );
  }
}

/** Associe l'identité de l'utilisateur connecté aux events futurs. */
export function identifyUser(user) {
  if (!user) return;
  if (sentryReady) {
    Sentry.setUser({
      id:    user.id,
      email: user.email,
    });
  }
  if (posthogReady) {
    posthog.identify(user.id, {
      email:      user.email,
      created_at: user.created_at,
    });
  }
}

/** Détache l'utilisateur (à appeler au signOut). */
export function resetUser() {
  if (sentryReady) Sentry.setUser(null);
  if (posthogReady) posthog.reset();
}

/** Track un événement produit (PostHog). No-op si non initialisé. */
export function track(event, props = {}) {
  if (!posthogReady) return;
  try {
    posthog.capture(event, props);
  } catch {
    // silently ignore
  }
}

/** Capture une erreur (Sentry). No-op si non initialisé. */
export function captureError(err, context = {}) {
  if (!sentryReady) {
    // En dev sans Sentry : on log dans la console pour débug
    if (ENV === 'development') console.error('[error]', err, context);
    return;
  }
  try {
    Sentry.captureException(err, { extra: context });
  } catch {
    // silently ignore
  }
}

/** Capture un message informatif/warning (Sentry). */
export function captureMessage(message, level = 'info') {
  if (!sentryReady) return;
  try {
    Sentry.captureMessage(message, level);
  } catch {
    // silently ignore
  }
}

/** ErrorBoundary Sentry à wrapper autour de l'app (optionnel). */
export const MonitoringErrorBoundary = Sentry.ErrorBoundary;
