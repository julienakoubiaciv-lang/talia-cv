/**
 * PlanGate — Overlay de verrouillage de fonctionnalité payante.
 *
 * Usage :
 *   <PlanGate locked={isFree} feature="Génération en masse" next="Personnel">
 *     <BulkPage />   ← rendu mais recouvert si locked
 *   </PlanGate>
 *
 * Ou en mode modal pleine page :
 *   <PlanGate locked modal feature="..." next="..." onDismiss={...} />
 */
import React from 'react';

const C = {
  ink:     '#0B1020',
  ink2:    '#3A4156',
  mute:    '#9AA0AE',
  rule:    '#ECEDF1',
  blue:    '#1539B7',
  blueSoft:'#EEF2FF',
  surface: '#F7F8FA',
};
const FONT = "'Manrope', system-ui, sans-serif";

// Icône cadenas
function IconLock({ s = 20 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

/**
 * Overlay inline — recouvre les enfants d'un fond flouté + CTA.
 * Passe transparente si locked=false.
 */
export function PlanGate({
  locked       = false,
  feature      = 'Cette fonctionnalité',
  next         = 'Personnel',
  description  = null,
  onUpgrade    = null,
  children,
}) {
  if (!locked) return children;

  return (
    <div style={{ position: 'relative', fontFamily: FONT }}>
      {/* Contenu flouté */}
      <div style={{ pointerEvents: 'none', userSelect: 'none', filter: 'blur(3px)', opacity: 0.4 }}>
        {children}
      </div>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(2px)',
        borderRadius: 12,
        zIndex: 10,
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '28px 32px',
          border: `1px solid ${C.rule}`, boxShadow: '0 8px 40px rgba(11,16,32,.12)',
          textAlign: 'center', maxWidth: 360,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: C.blueSoft, color: C.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <IconLock s={22} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
            {feature}
          </div>
          <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginBottom: 20 }}>
            {description || `Disponible à partir du plan ${next}.`}
          </div>
          {onUpgrade ? (
            <button onClick={onUpgrade}
              style={{
                padding: '10px 24px', borderRadius: 99, border: 'none',
                background: C.blue, color: '#fff', fontSize: 13,
                fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Passer au plan {next} →
            </button>
          ) : (
            <div style={{ fontSize: 12, color: C.mute }}>
              Contactez votre administrateur pour activer ce plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Bannière compacte inline (pour CVs restants, limite de profils, etc.)
 */
export function PlanBanner({
  message,
  next    = 'Personnel',
  onUpgrade = null,
  variant = 'warning',   // 'warning' | 'info' | 'limit'
}) {
  const colors = {
    warning: { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', icon: '⚠️' },
    info:    { bg: C.blueSoft, border: `${C.blue}44`, text: C.blue, icon: 'ℹ️' },
    limit:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', icon: '🔒' },
  };
  const col = colors[variant] || colors.warning;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10,
      background: col.bg, border: `1px solid ${col.border}`,
      fontFamily: FONT,
    }}>
      <span style={{ fontSize: 16 }}>{col.icon}</span>
      <div style={{ flex: 1, fontSize: 12.5, color: col.text, lineHeight: 1.5 }}>
        {message}
      </div>
      {onUpgrade && (
        <button onClick={onUpgrade}
          style={{
            padding: '5px 12px', borderRadius: 99,
            background: C.blue, color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: FONT, whiteSpace: 'nowrap',
          }}>
          Passer au {next}
        </button>
      )}
    </div>
  );
}
