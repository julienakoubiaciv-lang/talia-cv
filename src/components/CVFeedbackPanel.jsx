/**
 * CVFeedbackPanel — Avis recruteur IA (feature d'upgrade).
 *
 * - Free  : CTA verrouillé → ouvre l'UpgradeModal sans appel réseau.
 * - Payant: appelle getRecruiterFeedback (action 'coach') et affiche le retour.
 * - Staff (owner/admin) : accès total (bypass).
 *
 * Le serveur (check_quota) reste la source de vérité : même si le gate client
 * était contourné, le proxy renverrait une QuotaError.
 *
 * Props :
 *   cvData       (object)  - données structurées du CV en cours d'édition
 *   offerText    (string)  - offre d'emploi optionnelle (pré-remplie)
 */
import React, { useState } from 'react';
import { useUpgradeModal } from '@/components/UpgradeModal.jsx';
import { useRole } from '@/hooks/useRole';
import { getCurrentTier } from '@/lib/planConfig';
import { QuotaError } from '@/lib/claudeClient';
import { track, captureError } from '@/lib/monitoring';

const PRIORITY_STYLE = {
  haute:   { bg: '#FEE2E2', fg: '#B91C1C', label: 'Priorité haute' },
  moyenne: { bg: '#FEF3C7', fg: '#B45309', label: 'Priorité moyenne' },
  basse:   { bg: '#E0F2FE', fg: '#0369A1', label: 'Priorité basse' },
};

function scoreColor(s) {
  if (s >= 80) return '#16A34A';
  if (s >= 65) return '#84CC16';
  if (s >= 50) return '#EAB308';
  return '#DC2626';
}

export default function CVFeedbackPanel({ cvData, offerText = '' }) {
  const { open: openUpgrade } = useUpgradeModal();
  const { isStaff } = useRole();

  const [offer, setOffer]       = useState(offerText);
  const [showOffer, setShowOffer] = useState(false);
  const [status, setStatus]     = useState('idle'); // idle | loading | done | error
  const [feedback, setFeedback] = useState(null);
  const [errMsg, setErrMsg]     = useState('');

  const tier   = getCurrentTier();
  const locked = !isStaff && tier === 'free';

  async function handleRequest() {
    if (locked) {
      track('feedback_locked_click', { tier });
      openUpgrade({ action: 'coach', used: 0, limit: 0, tier: 'free' });
      return;
    }
    setStatus('loading'); setErrMsg('');
    track('feedback_requested', { hasOffer: !!offer.trim(), tier });
    try {
      const { getRecruiterFeedback } = await import('@/lib/cvFeedback');
      const fb = await getRecruiterFeedback({ cvData, offerText: offer });
      setFeedback(fb);
      setStatus('done');
      track('feedback_received', { score: fb.score, hasOffer: !!offer.trim() });
    } catch (err) {
      if (err instanceof QuotaError) {
        setStatus('idle');
        openUpgrade({ action: 'coach', used: err.used, limit: err.limit, tier: err.tier });
        return;
      }
      captureError(err, { feature: 'cv_feedback' });
      setErrMsg(err.message || 'Une erreur est survenue. Réessaie.');
      setStatus('error');
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.icon}>🎯</span>
        <div>
          <div style={S.title}>Avis recruteur</div>
          <div style={S.subtitle}>Ce qu'un RH pense de ton CV en 30 secondes</div>
        </div>
        {locked && <span style={S.proBadge}>PRO</span>}
      </div>

      {/* Offre optionnelle */}
      {status !== 'done' && (
        <>
          {!showOffer ? (
            <button style={S.linkBtn} onClick={() => setShowOffer(true)}>
              + Coller une offre d'emploi (analyse d'adéquation)
            </button>
          ) : (
            <textarea
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="Colle ici l'offre d'emploi visée pour un retour ciblé (mots-clés manquants, adéquation…)"
              style={S.textarea}
              rows={4}
            />
          )}
        </>
      )}

      {/* CTA principal */}
      {status !== 'done' && (
        <button
          style={{ ...S.cta, opacity: status === 'loading' ? 0.6 : 1 }}
          onClick={handleRequest}
          disabled={status === 'loading'}
        >
          {status === 'loading'
            ? 'Analyse en cours…'
            : locked
              ? '🔒 Débloquer mon avis recruteur'
              : '🎯 Obtenir mon avis recruteur'}
        </button>
      )}

      {locked && status === 'idle' && (
        <p style={S.teaser}>
          Score détaillé, points forts/faibles, mots-clés manquants et 3 actions
          prioritaires pour décrocher l'entretien. Inclus dès le plan Personnel.
        </p>
      )}

      {status === 'error' && <p style={S.error}>{errMsg}</p>}

      {/* Résultat */}
      {status === 'done' && feedback && (
        <div style={S.result}>
          <div style={S.scoreRow}>
            <div style={{ ...S.scoreCircle, borderColor: scoreColor(feedback.score), color: scoreColor(feedback.score) }}>
              {feedback.score}
            </div>
            <p style={S.verdict}>{feedback.verdict}</p>
          </div>

          {feedback.strengths.length > 0 && (
            <Section title="✅ Points forts" items={feedback.strengths} />
          )}
          {feedback.weaknesses.length > 0 && (
            <Section title="⚠️ À améliorer" items={feedback.weaknesses} />
          )}
          {feedback.keywordsMissing.length > 0 && (
            <div style={S.block}>
              <div style={S.blockTitle}>🔑 Mots-clés manquants</div>
              <div style={S.chips}>
                {feedback.keywordsMissing.map((k, i) => (
                  <span key={i} style={S.chip}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div style={S.block}>
              <div style={S.blockTitle}>🚀 Actions prioritaires</div>
              {feedback.improvements.map((imp, i) => {
                const ps = PRIORITY_STYLE[imp.priority] || PRIORITY_STYLE.moyenne;
                return (
                  <div key={i} style={S.improvement}>
                    <span style={{ ...S.priorityTag, background: ps.bg, color: ps.fg }}>{ps.label}</span>
                    <div style={S.impAction}>{imp.action}</div>
                    {imp.why && <div style={S.impWhy}>{imp.why}</div>}
                  </div>
                );
              })}
            </div>
          )}

          <button style={S.againBtn} onClick={() => { setStatus('idle'); setFeedback(null); }}>
            ↻ Refaire une analyse
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div style={S.block}>
      <div style={S.blockTitle}>{title}</div>
      <ul style={S.list}>
        {items.map((t, i) => <li key={i} style={S.li}>{t}</li>)}
      </ul>
    </div>
  );
}

const S = {
  wrap: { background: '#fff', border: '1px solid #ECEDF1', borderRadius: 14, padding: 16, fontFamily: "'Manrope', sans-serif" },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  icon: { fontSize: 22 },
  title: { fontWeight: 700, fontSize: 15, color: '#0B1B33' },
  subtitle: { fontSize: 12, color: '#6B7280' },
  proBadge: { marginLeft: 'auto', fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: '#1539B7', background: '#EEF2FF', padding: '3px 8px', borderRadius: 6 },
  linkBtn: { background: 'none', border: 'none', color: '#1539B7', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 10, textAlign: 'left' },
  textarea: { width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' },
  cta: { width: '100%', background: '#1539B7', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  teaser: { fontSize: 12, color: '#6B7280', lineHeight: 1.5, marginTop: 10, marginBottom: 0 },
  error: { fontSize: 13, color: '#DC2626', marginTop: 10 },
  result: { marginTop: 4 },
  scoreRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 },
  scoreCircle: { width: 56, height: 56, borderRadius: '50%', border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 },
  verdict: { fontSize: 13.5, color: '#0B1B33', lineHeight: 1.45, margin: 0, fontStyle: 'italic' },
  block: { marginBottom: 14 },
  blockTitle: { fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 },
  list: { margin: 0, paddingLeft: 18 },
  li: { fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 3 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: { fontSize: 12, fontWeight: 600, color: '#B45309', background: '#FEF3C7', padding: '4px 9px', borderRadius: 6 },
  improvement: { borderLeft: '3px solid #E5E7EB', paddingLeft: 10, marginBottom: 10 },
  priorityTag: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, display: 'inline-block', marginBottom: 4 },
  impAction: { fontSize: 13, fontWeight: 600, color: '#0B1B33', lineHeight: 1.4 },
  impWhy: { fontSize: 12, color: '#6B7280', lineHeight: 1.45, marginTop: 2 },
  againBtn: { width: '100%', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
};
