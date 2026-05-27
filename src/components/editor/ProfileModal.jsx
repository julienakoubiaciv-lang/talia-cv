/**
 * ProfileModal.jsx
 * Modale de sélection du profil personnalité dans l'éditeur.
 *
 * Props :
 *   profiles       {array}    — liste des profils (profileData)
 *   activeProfileId{string}   — id du profil actif
 *   onApply(id)               — applique le profil sélectionné
 *   onRegenerate()            — relance la génération IA avec le profil
 *   onManage()                — navigue vers /profils
 *   onClose()                 — ferme la modale
 */
import React, { useState, useEffect } from 'react';

const TON_COLORS = {
  authentique:   '#0891B2',
  professionnel: '#7C3AED',
  percutant:     '#EA580C',
  creatif:       '#16A34A',
};

export function ProfileModal({ profiles, activeProfileId, onApply, onRegenerate, onManage, onClose }) {
  const [selected, setSelected] = useState(activeProfileId || '');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(11,16,32,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn .18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 94vw)', background: '#fff', borderRadius: 18,
          boxShadow: '0 24px 64px rgba(11,16,32,0.22)',
          animation: 'fadeInUp .22s cubic-bezier(.16,.84,.24,1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px', borderBottom: '1px solid #ECEDF1',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1020' }}>
              🧠 Profil IA
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9AA0AE' }}>
              Oriente les reformulations IA vers ta voix et ton contexte
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9AA0AE', fontSize: 20, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Liste des profils */}
        <div style={{ padding: '12px 22px', maxHeight: 280, overflowY: 'auto' }}>
          {/* Option "sans profil" */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            borderRadius: 10, cursor: 'pointer', marginBottom: 6,
            border: `1.5px solid ${!selected ? '#1539B7' : '#ECEDF1'}`,
            background: !selected ? '#EEF2FF' : '#fff', transition: 'all .15s',
          }}>
            <input type="radio" name="profile" checked={!selected}
              onChange={() => setSelected('')}
              style={{ accentColor: '#1539B7', width: 16, height: 16 }} />
            <span style={{ fontSize: 20 }}>🚫</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: !selected ? '#1539B7' : '#0B1020' }}>
                Sans profil
              </div>
              <div style={{ fontSize: 11, color: '#9AA0AE' }}>Reformulations IA génériques</div>
            </div>
          </label>

          {profiles.map(p => {
            const isSel = String(selected) === String(p.id);
            const tonColor = TON_COLORS[p.ton?.style] || '#1539B7';
            return (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                border: `1.5px solid ${isSel ? '#1539B7' : '#ECEDF1'}`,
                background: isSel ? '#EEF2FF' : '#fff', transition: 'all .15s',
              }}>
                <input type="radio" name="profile" checked={isSel}
                  onChange={() => setSelected(String(p.id))}
                  style={{ accentColor: '#1539B7', width: 16, height: 16 }} />
                <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji || '🚀'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? '#1539B7' : '#0B1020' }}>
                    {p.nom}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                    {p.personnalite?.mots?.slice(0, 3).map(m => (
                      <span key={m} style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 8,
                        background: '#F7F8FA', color: '#3A4156', fontWeight: 500,
                      }}>{m}</span>
                    ))}
                    {p.ton?.style && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 8,
                        background: tonColor + '15', color: tonColor, fontWeight: 600,
                      }}>✍️ {p.ton.style}</span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}

          {profiles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9AA0AE', fontSize: 13 }}>
              Aucun profil créé encore.
            </div>
          )}
        </div>

        {/* Lien gérer */}
        <div style={{ padding: '0 22px 12px' }}>
          <button onClick={() => { onClose(); onManage(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#9AA0AE', fontFamily: "'Manrope',sans-serif",
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#1539B7'}
            onMouseLeave={e => e.currentTarget.style.color = '#9AA0AE'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Gérer mes profils
          </button>
        </div>

        {/* Footer — actions */}
        <div style={{
          padding: '14px 22px', borderTop: '1px solid #ECEDF1', display: 'flex', gap: 10,
        }}>
          <button
            onClick={() => { onApply(selected); onRegenerate(); onClose(); }}
            disabled={selected === activeProfileId && !selected}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: '#0B1020', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: "'Manrope',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a2340'}
            onMouseLeave={e => e.currentTarget.style.background = '#0B1020'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Régénérer le CV
          </button>
          <button
            onClick={() => { onApply(selected); onClose(); }}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: '#EEF2FF', color: '#1539B7', border: '1.5px solid #1539B733',
              cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#D4DCFF'}
            onMouseLeave={e => e.currentTarget.style.background = '#EEF2FF'}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}
