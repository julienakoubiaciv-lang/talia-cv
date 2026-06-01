/**
 * SectorPicker — Sélecteur de secteur (Tech / Commercial / Création / Marketing)
 *
 * Affichage : grille de cards cliquables avec emoji + label + description.
 * Utilisé dans Generate.jsx (avant le bouton "Générer").
 */
import React from 'react';
import { getSectorOptions } from '@/lib/cvSectors';

const C = {
  bluePrimary: '#1539B7',
  blueSoft:    '#EEF2FF',
  ink:         '#0B1020',
  ink2:        '#3A4156',
  mute:        '#9AA0AE',
  rule:        '#ECEDF1',
  bg:          '#FFFFFF',
  surface:     '#F7F8FA',
};

export function SectorPicker({ value, onChange }) {
  const options = getSectorOptions();

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.mute,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 5,
      }}>
        Secteur du CV
      </div>
      <div style={{ fontSize: 12, color: C.mute, marginBottom: 12, lineHeight: 1.5 }}>
        Le secteur réorganise les sections du CV (ex : Tech = Projets en haut) et
        active des sections spécialisées (KPIs commerciaux, portfolio créatif, etc.).
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 10,
      }}>
        {options.map(opt => {
          const isSelected = value === opt.id || (!value && opt.id === 'general');
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              style={{
                background: isSelected ? C.blueSoft : C.bg,
                border: '1.5px solid ' + (isSelected ? C.bluePrimary : C.rule),
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .15s',
                position: 'relative',
                outline: 'none',
              }}
              onMouseEnter={e => {
                if (!isSelected) e.currentTarget.style.borderColor = C.mute;
              }}
              onMouseLeave={e => {
                if (!isSelected) e.currentTarget.style.borderColor = C.rule;
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 16, height: 16, borderRadius: '50%',
                  background: C.bluePrimary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSelected ? C.bluePrimary : C.ink,
                }}>
                  {opt.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.mute, lineHeight: 1.45 }}>
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
