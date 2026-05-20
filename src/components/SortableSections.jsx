import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '@/hooks/useTheme';

const SECTION_META = {
  experiences: { icon: '💼', label: 'Expériences professionnelles' },
  formations:  { icon: '🎓', label: 'Formations' },
};

function SortableItem({ id }) {
  const { t } = useTheme();
  const meta = SECTION_META[id] || { icon: '📄', label: id };

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px',
        background: isDragging ? t.dragOver : t.surfaceAlt,
        border: `1.5px solid ${isDragging ? t.navy : t.border}`,
        borderRadius: 8,
        marginBottom: 6,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        boxShadow: isDragging ? `0 4px 16px rgba(0,0,0,0.12)` : 'none',
      }}
      {...attributes}
      {...listeners}
    >
      {/* Icone drag */}
      <span style={{ color: t.dragHandle, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>⠿</span>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, flex: 1 }}>
        {meta.label}
      </span>
      <span style={{ fontSize: 10, color: t.textMuted }}>↕</span>
    </div>
  );
}

export function SortableSections({ order, onDragEnd, onReset }) {
  const { t } = useTheme();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: t.textMuted,
        textTransform: 'uppercase', letterSpacing: '.07em',
        marginBottom: 10,
      }}>
        Glisse pour réorganiser les sections du CV
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map(id => <SortableItem key={id} id={id} />)}
        </SortableContext>
      </DndContext>

      <button
        onClick={onReset}
        style={{
          width: '100%', marginTop: 4, padding: '6px',
          border: `1.5px dashed ${t.border}`,
          borderRadius: 7, background: 'none',
          fontSize: 11, color: t.textMuted, cursor: 'pointer',
          transition: 'all .15s',
        }}
        onMouseEnter={e => { e.target.style.borderColor = t.navy; e.target.style.color = t.navy; }}
        onMouseLeave={e => { e.target.style.borderColor = t.border; e.target.style.color = t.textMuted; }}
      >
        ↺ Ordre par défaut
      </button>
    </div>
  );
}
