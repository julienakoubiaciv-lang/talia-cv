/**
 * useEditorLayout — Choix du layout d'édition par l'utilisateur.
 *
 * Layouts disponibles :
 *   - 'atelier' (défaut, nouveau)   : 3 colonnes (édition / aperçu / design)
 *   - 'classique'                    : Layout historique (1 panneau gauche + iframe)
 *
 * Persistance : localStorage clé 'talia_editor_layout'
 * Sync cross-tab : storage event
 *
 * Usage :
 *   const { layout, setLayout, isAtelier } = useEditorLayout();
 */
import { useState, useEffect, useCallback } from 'react';
import { track } from '@/lib/monitoring';

const LS_KEY = 'talia_editor_layout';
export const DEFAULT_LAYOUT = 'atelier';
export const LAYOUTS = ['atelier', 'classique'];

function readLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return LAYOUTS.includes(raw) ? raw : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useEditorLayout() {
  const [layout, setLayoutState] = useState(readLS);

  // ── Sync cross-tab ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === LS_KEY) setLayoutState(readLS());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setLayout = useCallback((next) => {
    if (!LAYOUTS.includes(next)) return;
    try { localStorage.setItem(LS_KEY, next); } catch {/* ignore */}
    setLayoutState(next);
    track('editor_layout_changed', { layout: next });
  }, []);

  return {
    layout,
    setLayout,
    isAtelier:   layout === 'atelier',
    isClassique: layout === 'classique',
  };
}
