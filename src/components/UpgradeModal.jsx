/**
 * UpgradeModal — Modal contextuelle d'upgrade affichée quand un quota est dépassé.
 *
 * Utilisée via le hook useUpgradeModal() (voir UpgradeModalProvider).
 *
 * Affichage adaptatif selon l'action :
 *   - generate_cv  → CTA "Passer Personnel"
 *   - smart_match  → CTA "Passer Personnel"
 *   - photo_ai     → CTA "Passer Business"
 *   - coach        → CTA selon tier actuel
 *   - multilingual → CTA "Passer Business"
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/monitoring';

// ─── Tokens visuels ────────────────────────────────────────────────────────
const C = {
  ink:        '#0B1020',
  ink2:       '#3A4156',
  mute:       '#9AA0AE',
  rule:       '#ECEDF1',
  primary:    '#1539B7',
  primaryDk:  '#1F4FE0',
  primarySoft:'#EEF2FF',
  purple:     '#7C3AED',
  purpleSoft: '#F5F3FF',
  green:      '#15803D',
  greenSoft:  '#F0FDF4',
  amber:      '#92400E',
};

const FONT = "'Manrope', system-ui, sans-serif";

// ─── Mapping action → recommandation ───────────────────────────────────────
const ACTION_LABELS = {
  generate_cv:  { title: 'Quota CV atteint',          icon: '📄', actionLabel: 'générer un CV' },
  smart_match:  { title: 'Quota analyses atteint',    icon: '🎯', actionLabel: 'analyser une offre' },
  coach:        { title: 'Quota coach IA atteint',    icon: '🧠', actionLabel: 'recevoir un conseil' },
  photo_ai:     { title: 'Quota photo IA atteint',    icon: '✨', actionLabel: 'retoucher une photo' },
  multilingual: { title: 'Quota multilingue atteint', icon: '🌐', actionLabel: 'adapter à une autre langue' },
};

const TIER_TO_UPGRADE = {
  free:     'personal',
  personal: 'business',
  business: 'business', // pas d'upgrade au-delà
};

const TIER_PRICING = {
  personal: { price: '9€', label: 'Personnel', emoji: '⚡', perks: [
    '50 CV par mois (vs 3 en gratuit)',
    'Analyse sémantique d\'offres incluse',
    'Templates premium (Impact, Compact)',
    'Pas de watermark',
    'Sync cloud multi-appareils',
  ]},
  business: { price: '29€', label: 'Business', emoji: '🏆', perks: [
    'CV illimités',
    'Génération en masse (bulk)',
    'Photo IA premium (5/mois)',
    'Coach carrière personnalisé',
    'Adaptation multilingue (FR/EN/DE/ES)',
    'Sync CRM Talia',
  ]},
};

// ─── Contexte ──────────────────────────────────────────────────────────────
const UpgradeModalContext = createContext(null);

export function UpgradeModalProvider({ children }) {
  const [modalState, setModalState] = useState(null); // null | { action, used, limit, tier }

  const open = useCallback((details) => {
    setModalState(details);
  }, []);

  const close = useCallback(() => {
    setModalState(null);
  }, []);

  return (
    <UpgradeModalContext.Provider value={{ open, close, isOpen: !!modalState }}>
      {children}
      {modalState && <UpgradeModal {...modalState} onClose={close} />}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) throw new Error('useUpgradeModal must be used inside UpgradeModalProvider');
  return ctx;
}

// ─── Composant Modal ───────────────────────────────────────────────────────
function UpgradeModal({ action, used, limit, tier, onClose }) {
  const navigate = useNavigate();
  const cfg = ACTION_LABELS[action] || { title: 'Limite atteinte', icon: '⚠️', actionLabel: 'continuer' };
  const targetTier = TIER_TO_UPGRADE[tier || 'free'];
  const targetCfg  = TIER_PRICING[targetTier] || TIER_PRICING.personal;

  const goPricing = () => {
    track('upgrade_clicked', {
      fromTier: tier,
      targetTier,
      ctaLocation: 'quota_modal',
      action,
    });
    onClose();
    navigate('/pricing');
  };

  // Fermeture sur Escape
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(11, 16, 32, 0.55)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn .2s ease',
        fontFamily: FONT,
        padding: 16,
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          maxWidth: 520, width: '100%',
          padding: 0,
          boxShadow: '0 40px 100px rgba(11, 16, 32, 0.45)',
          animation: 'slideUp .3s cubic-bezier(.16,.84,.24,1)',
          overflow: 'hidden',
        }}
      >
        {/* Header coloré */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDk})`,
          padding: '28px 28px 22px',
          color: '#fff',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              width: 30, height: 30, borderRadius: '50%',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>

          <div style={{ fontSize: 38, marginBottom: 10 }}>{cfg.icon}</div>
          <h2 style={{
            fontSize: 22, fontWeight: 800, margin: 0,
            letterSpacing: '-0.4px', lineHeight: 1.2,
          }}>
            {cfg.title}
          </h2>
          <p style={{ fontSize: 13.5, opacity: 0.9, margin: '6px 0 0', lineHeight: 1.5 }}>
            Tu as utilisé <strong>{used}/{limit}</strong> {cfg.actionLabel}s ce mois sur le plan{' '}
            <strong style={{ textTransform: 'capitalize' }}>{tier || 'gratuit'}</strong>.
          </p>
        </div>

        {/* Corps : avantages plan supérieur */}
        <div style={{ padding: '24px 28px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <span style={{ fontSize: 24 }}>{targetCfg.emoji}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.mute,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Passe au plan
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: '-0.3px' }}>
                {targetCfg.label}
                <span style={{
                  fontSize: 13, fontWeight: 600, color: C.primary,
                  marginLeft: 8,
                }}>
                  {targetCfg.price}/mois
                </span>
              </div>
            </div>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {targetCfg.perks.map((perk, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '7px 0',
                fontSize: 13, color: C.ink2, lineHeight: 1.4,
              }}>
                <span style={{
                  flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                  background: C.greenSoft, color: C.green,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, marginTop: 1,
                }}>✓</span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer : CTAs */}
        <div style={{
          padding: '18px 28px 24px',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '11px 18px',
              background: 'none',
              color: C.mute,
              border: '1px solid ' + C.rule,
              borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >Plus tard</button>
          <button
            onClick={goPricing}
            style={{
              flex: 1,
              padding: '11px 20px',
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDk})`,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: `0 6px 18px ${C.primary}55`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            ✨ Découvrir les plans
          </button>
        </div>
      </div>
    </div>
  );
}
