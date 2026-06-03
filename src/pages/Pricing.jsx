/**
 * Pricing — Page de tarifs Altio CV
 *
 * Affiche les 3 plans : Gratuit / Personnel / Business
 * Déclenche Stripe Checkout via la Edge Function create-checkout.
 * Redirige vers / après paiement réussi (?checkout=success).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { supabase, supabaseReady } from '@/lib/supabase';
import { track, captureError } from '@/lib/monitoring';

/* ─── Config Stripe (prix IDs à remplir dans .env.local) ───────────────── */
const PRICE_IDS = {
  personal: import.meta.env.VITE_STRIPE_PRICE_PERSONAL || '',
  business: import.meta.env.VITE_STRIPE_PRICE_BUSINESS || '',
};

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  ink:     '#0B1020', ink2: '#3A4156', mute: '#9AA0AE',
  rule:    '#ECEDF1', bg: '#FFFFFF', surface: '#F7F8FA',
  blue:    '#1539B7', blueSoft: '#EEF2FF',
  ok:      '#16A34A', okSoft: '#F0FDF4',
  star:    '#F5B400',
};
const FONT = "'Manrope', system-ui, sans-serif";

/* ─── Plans à afficher ────────────────────────────────────────────────────  */
const PLANS_UI = [
  {
    id: 'free',
    label: 'Gratuit',
    emoji: '🌱',
    price: '0€',
    period: null,
    desc: 'Pour découvrir et tester.',
    color: C.mute,
    bg: C.surface,
    features: [
      '5 CV au total',
      '1 profil personnalité',
      '2 templates (Classic, Minimal)',
      'Sauvegarde locale',
      'Génération IA incluse',
    ],
    missing: [
      'Génération en masse',
      'Synchronisation cloud',
      'Tous les templates',
    ],
    cta: 'Plan actuel',
    ctaDisabled: true,
  },
  {
    id: 'personal',
    label: 'Personnel',
    emoji: '⚡',
    price: '9€',
    period: '/ mois',
    desc: 'Pour les professionnels qui créent souvent.',
    color: C.blue,
    bg: C.blueSoft,
    highlight: true,
    badge: 'Populaire',
    features: [
      'CV illimités',
      '3 profils personnalité',
      '4 templates (dont Impact)',
      'Sauvegarde cloud (multi-appareils)',
      'Génération en masse (10/session)',
      'Génération IA illimitée',
    ],
    missing: [
      'Synchronisation CRM',
    ],
    cta: 'Commencer',
    priceId: PRICE_IDS.personal,
  },
  {
    id: 'business',
    label: 'Business',
    emoji: '🏆',
    price: '29€',
    period: '/ mois',
    desc: 'Pour les équipes et les écoles.',
    color: '#7C3AED',
    bg: '#F5F3FF',
    features: [
      'CV illimités',
      'Profils illimités',
      '4 templates',
      'Sauvegarde cloud',
      'Génération en masse illimitée',
      'Synchronisation CRM Talia',
      'Support prioritaire',
    ],
    missing: [],
    cta: 'Contacter l\'équipe',
    priceId: PRICE_IDS.business,
    contactSales: true,
  },
];

/* ─── Icône check / cross ─────────────────────────────────────────────────── */
function IconCheck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconX() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

/* ─── Composant PlanCard ─────────────────────────────────────────────────── */
function PlanCard({ plan, currentTier, onSubscribe, loading }) {
  const isCurrent = plan.id === currentTier;
  return (
    <div style={{
      background: plan.highlight ? C.blue : '#fff',
      border: `2px solid ${plan.highlight ? C.blue : C.rule}`,
      borderRadius: 20, padding: '32px 28px', flex: '1 1 280px',
      display: 'flex', flexDirection: 'column', gap: 0,
      boxShadow: plan.highlight ? '0 20px 60px rgba(21,57,183,.25)' : '0 2px 8px rgba(0,0,0,.04)',
      position: 'relative', transition: 'transform .2s',
    }}
    onMouseEnter={e => { if (!plan.highlight) e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>

      {/* Badge Populaire */}
      {plan.badge && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: C.star, color: C.ink, padding: '3px 14px',
          borderRadius: 99, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(245,180,0,.35)',
        }}>
          ✦ {plan.badge}
        </div>
      )}

      {/* En-tête */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{plan.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: plan.highlight ? '#fff' : C.ink, marginBottom: 4 }}>
          {plan.label}
        </div>
        <div style={{ fontSize: 12.5, color: plan.highlight ? 'rgba(255,255,255,.7)' : C.mute, lineHeight: 1.5 }}>
          {plan.desc}
        </div>
      </div>

      {/* Prix */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 40, fontWeight: 800, color: plan.highlight ? '#fff' : C.ink, letterSpacing: '-1.5px' }}>
          {plan.price}
        </span>
        {plan.period && (
          <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,.65)' : C.mute, marginLeft: 4 }}>
            {plan.period}
          </span>
        )}
      </div>

      {/* Features */}
      <div style={{ flex: 1, marginBottom: 24 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <span style={{ color: plan.highlight ? '#4ADE80' : C.ok, flexShrink: 0 }}><IconCheck /></span>
            <span style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,.9)' : C.ink2 }}>{f}</span>
          </div>
        ))}
        {plan.missing.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, opacity: 0.5 }}>
            <span style={{ color: plan.highlight ? 'rgba(255,255,255,.5)' : C.mute, flexShrink: 0 }}><IconX /></span>
            <span style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,.6)' : C.mute, textDecoration: 'line-through' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        disabled={plan.ctaDisabled || isCurrent || loading === plan.id}
        onClick={() => onSubscribe(plan)}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 14,
          fontWeight: 700, fontFamily: FONT, cursor: (plan.ctaDisabled || isCurrent) ? 'default' : 'pointer',
          border: plan.highlight ? '2px solid rgba(255,255,255,.25)' : `2px solid ${plan.id === 'free' ? C.rule : plan.color}`,
          background: plan.highlight ? 'rgba(255,255,255,.15)' : (plan.ctaDisabled || isCurrent ? C.surface : plan.color),
          color: plan.highlight ? '#fff' : (plan.ctaDisabled || isCurrent ? C.mute : '#fff'),
          transition: 'opacity .15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => { if (!plan.ctaDisabled && !isCurrent) e.currentTarget.style.opacity = '.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
        {loading === plan.id ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: 'spin .7s linear infinite' }}>
              <path d="M21 12A9 9 0 1112 3" strokeLinecap="round"/>
            </svg>
            Redirection…
          </>
        ) : isCurrent ? (
          '✓ Plan actuel'
        ) : plan.cta}
      </button>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function Pricing() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const { user }        = useAuth();
  const { tier }        = usePlan();
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState('');
  const checkoutStatus  = params.get('checkout');

  const handleSubscribe = async (plan) => {
    if (plan.ctaDisabled || plan.id === 'free') return;

    track('upgrade_clicked', {
      targetTier: plan.id,
      contactSales: !!plan.contactSales,
    });

    if (plan.contactSales) {
      // Business → email commercial
      window.location.href = 'mailto:hello@talia.fr?subject=Plan Business Altio CV';
      return;
    }

    if (!user) {
      // Doit être connecté pour s'abonner
      navigate('/auth?tab=inscription&redirect=/pricing');
      return;
    }

    if (!supabaseReady || !supabase) {
      setError('Supabase non configuré — impossible de lancer le paiement.');
      return;
    }

    if (!plan.priceId) {
      setError('Price ID Stripe non configuré (VITE_STRIPE_PRICE_*).');
      return;
    }

    setLoading(plan.id);
    setError('');

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId:    plan.priceId,
          successUrl: `${window.location.origin}/?checkout=success`,
          cancelUrl:  `${window.location.origin}/pricing?checkout=cancelled`,
        },
      });

      if (fnErr || !data?.url) {
        throw new Error(fnErr?.message || 'Impossible de créer la session de paiement.');
      }

      window.location.href = data.url;
    } catch (err) {
      captureError(err, { context: 'stripe_checkout', tier: plan.id });
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header */}
      <header style={{ background: C.bg, borderBottom: `1px solid ${C.rule}`, height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.ink2, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5 }}>
          ← Retour
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
          Talia<span style={{ color: C.blue }}>CV</span> — Tarifs
        </div>
      </header>

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '56px 24px 80px', animation: 'fadeInUp .4s ease both' }}>

        {/* Bannière checkout résultat */}
        {checkoutStatus === 'success' && (
          <div style={{ background: C.okSoft, border: `1px solid #86EFAC`, borderRadius: 12, padding: '14px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, color: C.ok }}>Abonnement activé !</div>
              <div style={{ fontSize: 13, color: '#15803D', marginTop: 2 }}>Bienvenue dans votre nouveau plan. Vos fonctionnalités sont déjà disponibles.</div>
            </div>
          </div>
        )}
        {checkoutStatus === 'cancelled' && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 20px', marginBottom: 32, fontSize: 13, color: '#991B1B' }}>
            ℹ️ Paiement annulé — vous n'avez pas été débité.
          </div>
        )}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 20px', marginBottom: 32, fontSize: 13, color: '#991B1B' }}>
            ❌ {error}
          </div>
        )}

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: C.ink, letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.1 }}>
            Le plan qui vous correspond
          </h1>
          <p style={{ fontSize: 16, color: C.ink2, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            Commencez gratuitement. Passez à un plan payant quand vous êtes prêt — sans engagement, annulation en un clic.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
          {PLANS_UI.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentTier={tier}
              onSubscribe={handleSubscribe}
              loading={loading}
            />
          ))}
        </div>

        {/* Note bas de page */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.mute, marginTop: 40, lineHeight: 1.7 }}>
          Paiement sécurisé via Stripe · TVA incluse · Annulation à tout moment depuis votre espace client<br />
          Des questions ? <a href="mailto:hello@talia.fr" style={{ color: C.blue, textDecoration: 'none', fontWeight: 600 }}>hello@talia.fr</a>
        </p>
      </main>
    </div>
  );
}
