/**
 * CheckoutSuccessBanner — Bandeau post-paiement Stripe.
 *
 * Affiché quand l'URL contient ?checkout=success.
 * S'adapte à 3 états :
 *   activating → spinner "activation en cours…"
 *   activated  → confettis + nom du plan
 *   pending    → message "activation dans quelques minutes"
 */
import React from 'react';

const C = {
  green:     '#15803D',
  greenBg:   '#F0FDF4',
  greenBord: '#BBF7D0',
  purple:    '#7C3AED',
  purpleBg:  '#F5F3FF',
  purpleBord:'#C4B5FD',
  orange:    '#C2410C',
  orangeBg:  '#FFF7ED',
  orangeBord:'#FED7AA',
};

const TIER_LABELS = {
  personal: 'Personnel',
  business: 'Business',
};

export function CheckoutSuccessBanner({ checkoutState, activatedTier, onDismiss }) {
  if (!checkoutState) return null;

  const isActivating = checkoutState === 'activating';
  const isActivated  = checkoutState === 'activated';
  const isPending    = checkoutState === 'pending';

  const scheme = isActivated  ? { bg: C.greenBg,  border: C.greenBord,  text: C.green  }
    :            isPending    ? { bg: C.orangeBg,  border: C.orangeBord, text: C.orange }
    :            /* activating*/{ bg: C.purpleBg,  border: C.purpleBord, text: C.purple };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: scheme.bg,
      borderBottom: `2px solid ${scheme.border}`,
      padding: '12px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontFamily: "'Manrope', system-ui, sans-serif",
      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
      animation: 'slideDown .3s ease',
    }}>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isActivating && (
          <span style={{
            display: 'inline-block', width: 16, height: 16,
            border: `2px solid ${scheme.border}`, borderTopColor: scheme.text,
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
        )}
        {isActivated && <span style={{ fontSize: 18 }}>🎉</span>}
        {isPending   && <span style={{ fontSize: 18 }}>⏳</span>}

        <div>
          {isActivating && (
            <>
              <span style={{ fontWeight: 700, fontSize: 13, color: scheme.text }}>
                Paiement reçu — activation en cours…
              </span>
              <span style={{ fontSize: 12, color: scheme.text, opacity: .7, marginLeft: 8 }}>
                Mise à jour de votre plan dans quelques secondes.
              </span>
            </>
          )}
          {isActivated && (
            <>
              <span style={{ fontWeight: 700, fontSize: 13, color: scheme.text }}>
                Bienvenue sur le plan {TIER_LABELS[activatedTier] || activatedTier} !
              </span>
              <span style={{ fontSize: 12, color: scheme.text, opacity: .75, marginLeft: 8 }}>
                Votre abonnement est actif. Toutes les fonctionnalités sont débloquées.
              </span>
            </>
          )}
          {isPending && (
            <>
              <span style={{ fontWeight: 700, fontSize: 13, color: scheme.text }}>
                Paiement confirmé — activation en attente
              </span>
              <span style={{ fontSize: 12, color: scheme.text, opacity: .75, marginLeft: 8 }}>
                Votre abonnement sera actif dans quelques minutes. Rafraîchissez la page si nécessaire.
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Fermer"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: scheme.text, opacity: .6, fontSize: 18, lineHeight: 1,
          padding: '2px 6px', borderRadius: 6,
          transition: 'opacity .15s', flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '.6'}
      >×</button>
    </div>
  );
}
