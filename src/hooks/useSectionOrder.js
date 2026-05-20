import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const DEFAULT_SECTION_ORDER = ['experiences', 'formations'];

export function useSectionOrder() {
  const [order, setOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('talia_section_order'));
      return Array.isArray(saved) ? saved : DEFAULT_SECTION_ORDER;
    } catch {
      return DEFAULT_SECTION_ORDER;
    }
  });

  const onDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder(prev => {
      const oldIdx = prev.indexOf(active.id);
      const newIdx = prev.indexOf(over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const next = arrayMove(prev, oldIdx, newIdx);
      localStorage.setItem('talia_section_order', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(DEFAULT_SECTION_ORDER);
    localStorage.removeItem('talia_section_order');
  }, []);

  return { order, onDragEnd, resetOrder };
}
