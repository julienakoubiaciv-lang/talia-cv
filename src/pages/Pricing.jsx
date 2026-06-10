/**
 * Pricing — Tarifs Altio CV.
 *
 * Quatre offres : Gratuit · Personnel (jeunes/B2C) · Cowork (coach + petite
 * équipe) · École (sur devis, parrainage des élèves). Tarifs pensés abordables
 * pour les jeunes — l'essentiel gratuit pour toujours.
 *
 * Le paiement Stripe sera branché plus tard ; les CTA payants redirigent vers
 * la connexion / le contact en attendant (dégradé propre si non configuré).
 */
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { C, FONT } from '@/lib/gameTheme';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useSeo } from '@/lib/seo';
import { track, captureError } from '@/lib/monitoring';

const PRICE_IDS = {
  personal: import.meta.env.VITE_STRIPE_PRICE_PERSONAL || '',
  cowork:   import.meta.env.VITE_STRIPE_PRICE_COWORK || '',
};

const eur = (n) => n.toFixed(2).replace('.', ',').replace(',00', '') + ' €';

/** Offres. priceM = prix mensuel (€) ; annuel = 10× (2 mois offerts). */
const PLANS = [
  {
    id: 'free', label: 'Gratuit', emoji: '🌱', priceM: 0, accent: C.mute,
    desc: 'Pour se lancer — l\'essentiel, gratuit pour toujours.',
    features: [
      '2 CV',
      '5 générations IA par jour ⚡',
      'Tous les entraînements en illimité (entretien, métiers, codes…)',
      'Bilan d\'employabilité',
    ],
    missing: ['CV illimités', 'Multi-appareils'],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'personal', label: 'Personnel', emoji: '⚡', priceM: 4.99, accent: C.blue,
    highlight: true, badge: 'Tarif jeune',
    desc: 'Pour aller au bout de ta recherche, sans te ruiner.',
    features: [
      'CV illimités',
      '40 générations IA par jour ⚡',
      'Tous les modules IA : lettre, test de recrutement, oral, optimisation CV',
      'Sauvegarde multi-appareils',
      'Sans engagement, annulable en 1 clic',
    ],
    missing: [],
    cta: 'Choisir Personnel',
    priceId: PRICE_IDS.personal,
  },
  {
    id: 'cowork', label: 'Cowork', emoji: '🤝', priceM: 19, accent: C.boss,
    desc: 'Pour un coach et sa petite équipe (jusqu\'à 5).',
    sub: '≈ 3,80 € / personne',
    features: [
      'Jusqu\'à 5 personnes',
      'Tout le plan Personnel pour chacun',
      'Espace coach : suivi de l\'équipe',
      'Relance des décrocheurs',
    ],
    missing: [],
    cta: 'Choisir Cowork',
    priceId: PRICE_IDS.cowork,
  },
  {
    id: 'school', label: 'École', emoji: '🎓', priceM: null, accent: C.green,
    desc: 'Pour les écoles & CFA. Sur devis, par sièges.',
    features: [
      'Élèves illimités (par sièges)',
      'Espace conseillers & direction',
      'Suivi de progression des cohortes',
      'Accès offert à tes élèves (lien d\'invitation)',
    ],
    missing: [],
    cta: 'Nous contacter',
    contactSales: true,
  },
];

function Check() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function Cross() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }

export default function Pricing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { tier, isSchool, orgName } = useEntitlements();
  const [annual, setAnnual] = useState(true);
  useSeo({ title: 'Tarifs : gratuit, Personnel, Cowork, École', description: 'Des tarifs pensés pour les jeunes : l\'essentiel gratuit pour toujours, Personnel à 4,99 €/mois. Offres Cowork (coach) et École (parrainage des élèves).' });
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const checkout = params.get('checkout');

  const priceLabel = (p) => {
    if (p.priceM === null) return { big: 'Sur devis', small: '' };
    if (p.priceM === 0) return { big: '0 €', small: '' };
    if (annual) return { big: eur(p.priceM * 10), small: `/ an · ≈ ${eur(p.priceM * 10 / 12)}/mois` };
    return { big: eur(p.priceM), small: '/ mois' };
  };

  async function subscribe(p) {
    if (p.id === 'free') { navigate(user ? '/' : '/auth'); return; }
    track('upgrade_clicked', { targetTier: p.id, annual, contactSales: !!p.contactSales });
    if (p.contactSales) { window.location.href = 'mailto:hello@talia.fr?subject=Altio CV — Offre École'; return; }
    if (!user) { navigate('/auth?tab=inscription&redirect=/pricing'); return; }
    if (!supabaseReady || !supabase || !p.priceId) {
      setError('Le paiement en ligne arrive bientôt. Laisse-nous ton email à hello@talia.fr pour être prévenu.');
      return;
    }
    setLoading(p.id); setError('');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: p.priceId, interval: annual ? 'year' : 'month', successUrl: `${window.location.origin}/?checkout=success`, cancelUrl: `${window.location.origin}/pricing?checkout=cancelled` },
      });
      if (fnErr || !data?.url) throw new Error(fnErr?.message || 'Impossible de créer la session de paiement.');
      window.location.href = data.url;
    } catch (err) { captureError(err, { context: 'stripe_checkout', tier: p.id }); setError(err.message); }
    finally { setLoading(null); }
  }

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={() => navigate(-1)}>← Retour</button>
          <span style={S.brandTag}>ALTIO · Tarifs</span>
        </div>

        {checkout === 'success' && <div style={{ ...S.banner, background: C.greenSoft, color: C.green }}>🎉 Abonnement activé — bienvenue dans ton nouveau plan !</div>}
        {checkout === 'cancelled' && <div style={{ ...S.banner, background: C.amberSoft, color: C.amber }}>Paiement annulé — tu n'as pas été débité.</div>}
        {error && <div style={{ ...S.banner, background: C.redSoft, color: C.red }}>{error}</div>}

        <div style={S.header}>
          <h1 style={S.h1}>Des tarifs pensés pour les jeunes</h1>
          <p style={S.lead}>
            L'essentiel est <b>gratuit, pour toujours</b>. Et si tu veux tout débloquer,
            ça reste le prix d'un café par mois.
          </p>
        </div>

        {/* Parrainage école */}
        <div style={S.sponsor}>
          <span style={{ fontSize: 22 }}>🎓</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isSchool ? (
              <><b>Ton accès est offert par {orgName || 'ton école'} 🎉</b> — tu profites déjà de toutes les fonctionnalités.</>
            ) : (
              <><b>Tu es dans une école partenaire ?</b> Ton accès peut être <b>offert</b> : demande ton lien d'invitation à ton conseiller.</>
            )}
          </div>
        </div>

        {/* Toggle mensuel / annuel */}
        <div style={S.toggleRow}>
          <div style={S.toggle}>
            <button style={{ ...S.toggleBtn, ...(!annual ? S.toggleOn : {}) }} onClick={() => setAnnual(false)}>Mensuel</button>
            <button style={{ ...S.toggleBtn, ...(annual ? S.toggleOn : {}) }} onClick={() => setAnnual(true)}>
              Annuel <span style={S.save}>2 mois offerts</span>
            </button>
          </div>
        </div>

        {/* Cartes */}
        <div style={S.grid}>
          {PLANS.map((p) => {
            const pl = priceLabel(p);
            const isCurrent = p.id === tier;
            const hl = p.highlight;
            return (
              <div key={p.id} style={{ ...S.card, ...(hl ? S.cardHL : {}) }}>
                {p.badge && <div style={S.badge}>✦ {p.badge}</div>}
                <div style={{ fontSize: 24 }}>{p.emoji}</div>
                <div style={{ ...S.planName, color: hl ? '#fff' : C.ink }}>{p.label}</div>
                <div style={{ ...S.planDesc, color: hl ? 'rgba(255,255,255,.8)' : C.mute }}>{p.desc}</div>

                <div style={S.priceRow}>
                  <span style={{ ...S.price, color: hl ? '#fff' : C.ink }}>{pl.big}</span>
                  {pl.small && <span style={{ ...S.pricePer, color: hl ? 'rgba(255,255,255,.7)' : C.mute }}>{pl.small}</span>}
                </div>
                {p.sub && <div style={{ ...S.priceSub, color: hl ? 'rgba(255,255,255,.7)' : C.mute }}>{p.sub}</div>}

                <div style={S.features}>
                  {p.features.map((f, i) => (
                    <div key={i} style={S.featRow}>
                      <span style={{ color: hl ? '#7CF2C0' : C.green, flexShrink: 0, marginTop: 2 }}><Check /></span>
                      <span style={{ fontSize: 12.5, color: hl ? 'rgba(255,255,255,.92)' : C.ink2, lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                  {p.missing.map((f, i) => (
                    <div key={i} style={{ ...S.featRow, opacity: 0.55 }}>
                      <span style={{ color: hl ? 'rgba(255,255,255,.5)' : C.mute, flexShrink: 0, marginTop: 2 }}><Cross /></span>
                      <span style={{ fontSize: 12.5, color: hl ? 'rgba(255,255,255,.6)' : C.mute, textDecoration: 'line-through', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={isCurrent || loading === p.id}
                  onClick={() => subscribe(p)}
                  style={{
                    ...S.cta,
                    background: isCurrent ? C.line : hl ? '#fff' : p.accent,
                    color: isCurrent ? C.mute : hl ? C.blue : '#fff',
                    cursor: isCurrent ? 'default' : 'pointer',
                  }}>
                  {loading === p.id ? 'Redirection…' : isCurrent ? '✓ Plan actuel' : p.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p style={S.foot}>
          Paiement sécurisé · sans engagement · annulation à tout moment.
          Une question ? <a href="mailto:hello@talia.fr" style={{ color: C.blue, fontWeight: 700, textDecoration: 'none' }}>hello@talia.fr</a>
        </p>
      </div>
    </div>
  );
}

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 1100, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },

  banner: { borderRadius: 12, padding: '12px 16px', fontSize: 13.5, fontWeight: 700, marginBottom: 16, lineHeight: 1.5 },

  header: { textAlign: 'center', marginBottom: 18, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' },
  h1: { fontSize: 34, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.1, margin: '6px 0 12px' },
  lead: { fontSize: 15.5, color: C.ink2, lineHeight: 1.6, margin: 0 },

  sponsor: { display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '13px 18px', maxWidth: 720, margin: '0 auto 20px', fontSize: 13.5, color: C.ink2, lineHeight: 1.45 },

  toggleRow: { display: 'flex', justifyContent: 'center', marginBottom: 22 },
  toggle: { display: 'inline-flex', background: C.card, border: `1px solid ${C.line}`, borderRadius: 99, padding: 4 },
  toggleBtn: { display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', color: C.ink2, fontFamily: FONT, fontSize: 13.5, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer' },
  toggleOn: { background: C.blue, color: '#fff' },
  save: { fontSize: 10.5, fontWeight: 800, background: C.greenSoft, color: C.green, padding: '2px 7px', borderRadius: 99 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, alignItems: 'stretch' },
  card: { position: 'relative', display: 'flex', flexDirection: 'column', background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '22px 20px', boxShadow: '0 4px 20px rgba(11,22,56,.05)' },
  cardHL: { background: C.blue, border: `1px solid ${C.blue}`, boxShadow: '0 18px 50px -16px rgba(21,57,183,.45)', transform: 'translateY(-4px)' },
  badge: { position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: C.star, color: '#3A2D00', fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 99, whiteSpace: 'nowrap' },
  planName: { fontSize: 18, fontWeight: 800, marginTop: 8 },
  planDesc: { fontSize: 12.5, lineHeight: 1.45, marginTop: 4, minHeight: 36 },

  priceRow: { display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  price: { fontSize: 32, fontWeight: 800, letterSpacing: -1 },
  pricePer: { fontSize: 12.5, fontWeight: 600 },
  priceSub: { fontSize: 11.5, marginTop: 2 },

  features: { flex: 1, display: 'grid', gap: 9, margin: '18px 0' },
  featRow: { display: 'flex', alignItems: 'flex-start', gap: 9 },

  cta: { width: '100%', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13.5, fontWeight: 800, fontFamily: FONT },

  foot: { textAlign: 'center', fontSize: 12.5, color: C.mute, marginTop: 30, lineHeight: 1.7 },
};
