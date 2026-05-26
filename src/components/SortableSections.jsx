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

/* ── Métadonnées des sections ──────────────────────────────────────────────── */
const MAIN_META = {
  experiences:  { icon: '💼', label: 'Expériences professionnelles' },
  formations:   { icon: '🎓', label: 'Formations' },
  competences:  { icon: '🛠️', label: 'Compétences' },
};
const SIDEBAR_META = {
  competences:  { icon: '🛠️', label: 'Compétences' },
  langues:      { icon: '🌐', label: 'Langues' },
  interets:     { icon: '⭐', label: 'Centres d\'intérêt' },
};

/* ── Item drag générique ───────────────────────────────────────────────────── */
function SortableItem({ id, meta, accent }) {
  const { t } = useTheme();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

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
        border: `1.5px solid ${isDragging ? (accent || t.navy) : t.border}`,
        borderRadius: 8,
        marginBottom: 6,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <span style={{ color: t.dragHandle, fontSize: 14, flexShrink: 0 }}>⠿</span>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, flex: 1 }}>{meta.label}</span>
      <span style={{ fontSize: 10, color: t.textMuted }}>↕</span>
    </div>
  );
}

/* ── Zone de drag générique ────────────────────────────────────────────────── */
function DragZone({ items, onDragEnd, metaMap, accent, sensors }) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(id => (
          <SortableItem key={id} id={id} meta={metaMap[id] || { icon: '📄', label: id }} accent={accent} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

/* ── Composant principal ───────────────────────────────────────────────────── */
export function SortableSections({
  order, onDragEnd, addSection, removeSection, onReset,
  sidebarOrder, onSidebarDragEnd, onResetSidebar,
}) {
  const { t } = useTheme();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const competencesInMain = order.includes('competences');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── SECTIONS PRINCIPALES ──────────────────────────────────────────── */}
      <div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: t.textMuted,
          textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10,
        }}>
          Contenu principal
        </div>

        <DragZone items={order} onDragEnd={onDragEnd} metaMap={MAIN_META} sensors={sensors} />

        {/* Toggle compétences dans le contenu principal */}
        <button
          onClick={() => competencesInMain ? removeSection('competences') : addSection('competences')}
          style={{
            width: '100%', marginTop: 4, padding: '8px 12px',
            border: `1.5px dashed ${competencesInMain ? '#dc2626' : t.border}`,
            borderRadius: 7, background: competencesInMain ? 'rgba(220,38,38,.06)' : 'none',
            fontSize: 12, fontWeight: 600,
            color: competencesInMain ? '#dc2626' : t.textMuted,
            cursor: 'pointer', transition: 'all .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
          onMouseEnter={e => { if (!competencesInMain) { e.currentTarget.style.borderColor = t.navy; e.currentTarget.style.color = t.navy; } }}
          onMouseLeave={e => { if (!competencesInMain) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; } }}
        >
          {competencesInMain ? '✕ Retirer les compétences du contenu' : '＋ Ajouter les compétences ici'}
        </button>

        <button
          onClick={onReset}
          style={{
            width: '100%', marginTop: 6, padding: '6px',
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

      {/* Séparateur */}
      <div style={{ height: 1, background: t.border }} />

      {/* ── BARRE LATÉRALE ────────────────────────────────────────────────── */}
      <div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: t.textMuted,
          textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10,
        }}>
          Barre latérale
        </div>

        {/* Coordonnées : bloc fixe (non draggable) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', marginBottom: 6,
          background: t.surfaceAlt,
          border: `1.5px solid ${t.border}`,
          borderRadius: 8, opacity: 0.55,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>☰</span>
          <span style={{ fontSize: 15, flexShrink: 0 }}>📞</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, flex: 1 }}>Coordonnées</span>
          <span style={{ fontSize: 10, color: t.textMuted }}>fixe</span>
        </div>

        {/* Blocs ordonnés */}
        <DragZone
          items={sidebarOrder}
          onDragEnd={onSidebarDragEnd}
          metaMap={SIDEBAR_META}
          accent="#7c3aed"
          sensors={sensors}
        />

        {/* Note contextuelle */}
        {competencesInMain && (
          <div style={{
            padding: '8px 10px', marginTop: 4,
            background: 'rgba(124,58,237,.07)',
            border: '1px solid rgba(124,58,237,.2)',
            borderRadius: 7, fontSize: 11, color: '#7c3aed', lineHeight: 1.5,
          }}>
            🛠️ Les compétences sont dans le contenu principal — elles n'apparaissent pas dans la sidebar.
          </div>
        )}

        <button
          onClick={onResetSidebar}
          style={{
            width: '100%', marginTop: 6, padding: '6px',
            border: `1.5px dashed ${t.border}`,
            borderRadius: 7, background: 'none',
            fontSize: 11, color: t.textMuted, cursor: 'pointer',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.color = '#7c3aed'; }}
          onMouseLeave={e => { e.target.style.borderColor = t.border; e.target.style.color = t.textMuted; }}
        >
          ↺ Ordre sidebar par défaut
        </button>
      </div>
    </div>
  );
}
