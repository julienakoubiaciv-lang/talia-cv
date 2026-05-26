import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const DEFAULT_SECTION_ORDER  = ['experiences', 'formations'];
export const DEFAULT_SIDEBAR_ORDER  = ['competences', 'langues', 'interets'];

function readLS(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

export function useSectionOrder() {
  // ── Ordre des sections PRINCIPALES (côté contenu) ────────────────────────
  const [order, setOrder] = useState(() => readLS('talia_section_order', DEFAULT_SECTION_ORDER));

  const onDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder(prev => {
      const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id));
      localStorage.setItem('talia_section_order', JSON.stringify(next));
      return next;
    });
  }, []);

  /** Ajoute une section (ex: 'competences') dans le contenu principal */
  const addSection = useCallback((id) => {
    setOrder(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('talia_section_order', JSON.stringify(next));
      return next;
    });
  }, []);

  /** Retire une section du contenu principal (repasse en sidebar) */
  const removeSection = useCallback((id) => {
    setOrder(prev => {
      const next = prev.filter(s => s !== id);
      localStorage.setItem('talia_section_order', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(DEFAULT_SECTION_ORDER);
    localStorage.removeItem('talia_section_order');
  }, []);

  // ── Ordre des sections de BARRE LATÉRALE ────────────────────────────────
  const [sidebarOrder, setSidebarOrder] = useState(() =>
    readLS('talia_sidebar_order', DEFAULT_SIDEBAR_ORDER)
  );

  const onSidebarDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSidebarOrder(prev => {
      const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id));
      localStorage.setItem('talia_sidebar_order', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSidebarOrder = useCallback(() => {
    setSidebarOrder(DEFAULT_SIDEBAR_ORDER);
    localStorage.removeItem('talia_sidebar_order');
  }, []);

  return {
    order, onDragEnd, addSection, removeSection, resetOrder,
    sidebarOrder, onSidebarDragEnd, resetSidebarOrder,
  };
}
