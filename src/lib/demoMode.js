/**
 * demoMode — Bascule « mode démo » (IA simulée en local).
 *
 * Tant que le backend (Edge Function claude-proxy) n'est pas déployé, le mode
 * démo permet d'utiliser toutes les fonctionnalités IA avec des réponses
 * simulées réalistes — pour présenter l'outil sans serveur.
 *
 * Par défaut : ACTIVÉ quand aucun backend n'est configuré. L'utilisateur peut
 * forcer ON ('1') ou OFF ('0') ; ce choix explicite est prioritaire.
 */
import { supabaseReady } from '@/lib/supabase';

const LS_KEY = 'altio_demo';

/** Le mode démo est-il actif ? */
export function isDemoMode() {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch { /* ignore */ }
  return !supabaseReady; // défaut : démo si pas de backend
}

/** Force le mode démo (true/false) et le persiste. */
export function setDemoMode(on) {
  try { localStorage.setItem(LS_KEY, on ? '1' : '0'); } catch { /* ignore */ }
}

/** L'utilisateur a-t-il fait un choix explicite (vs valeur par défaut) ? */
export function hasExplicitDemoChoice() {
  try { return ['0', '1'].includes(localStorage.getItem(LS_KEY)); }
  catch { return false; }
}
