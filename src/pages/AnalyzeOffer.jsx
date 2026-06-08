/**
 * AnalyzeOffer — « Analyse d'offre » : score de matching CV ↔ offre + check ATS.
 *
 * Outil employabilité : colle une annonce, l'app calcule le taux de
 * correspondance avec ton CV (mots-clés présents/manquants) ET vérifie la
 * compatibilité ATS (lisibilité par les robots de tri des recruteurs), avec des
 * conseils actionnables et un renvoi vers l'éditeur pour appliquer.
 *
 * 100% local (analyzeMatch + atsCheck purs) → aucun coût/backend.
 */
import React, { useState, useMemo } from 'react';
import { C, FONT } from '@/lib/gameTheme';
import { useNavigate } from 'react-router-dom';
import { analyzeMatch, atsCheck } from '@/lib/smartMatcher';
import { getHist } from '@/lib/cvData';
import { track } from '@/lib/monitoring';

export default function AnalyzeOffer() {
  const navigate = useNavigate();
  const latest = useMemo(() => { try { return getHist()[0] || null; } catch { return null; } }, []);
  const cvData = latest?.data || null;

  const [offer, setOffer] = useState('');
  const [result, setResult] = useState(null);

  const canAnalyze = !!cvData && offer.trim().length >= 30;

  function analyze() {
    if (!canAnalyze) return;
    const match = analyzeMatch(offer, cvData);
    const ats = atsCheck(cvData);
    setResult({ match, ats });
    track('offer_analyzed', { matchScore: match.score, atsScore: ats.score, missing: match.missing.length });
  }

  const matchColor = (s) => (s >= 70 ? C.green : s >= 40 ? C.amber : C.red);

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={() => navigate('/')}>← Accueil</button>
          <span style={S.brandTag}>ALTIO · Analyse</span>
        </div>

        <div style={S.header}>
          <span style={S.eyebrow}>Décroche plus d'entretiens</span>
          <h1 style={S.h1}>Analyse ton CV face à une offre</h1>
          <p style={S.lead}>
            Colle une annonce : on calcule ton taux de correspondance, les mots-clés
            qui manquent, et on vérifie que ton CV passe les filtres automatiques (ATS).
          </p>
        </div>

        {/* CV source */}
        <div style={S.block}>
          <div style={S.blockLabel}>CV ANALYSÉ</div>
          {cvData ? (
            <div style={S.cvRow}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.cvName}>{latest.name || 'Mon CV'}</div>
                <div style={S.cvMeta}>Dernier CV généré{latest.date ? ` · ${latest.date}` : ''}</div>
              </div>
            </div>
          ) : (
            <div style={S.empty}>
              Aucun CV trouvé.
              <button style={S.linkBtn} onClick={() => navigate('/generate')}>Créer un CV</button>
            </div>
          )}
        </div>

        {/* Offre */}
        <div style={S.sectionLabel}>L'offre visée</div>
        <textarea
          style={S.textarea} rows={7} value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="Colle ici le texte de l'annonce (intitulé, missions, compétences attendues)…"
        />

        <button
          style={{ ...S.cta, opacity: canAnalyze ? 1 : 0.6, cursor: canAnalyze ? 'pointer' : 'not-allowed' }}
          onClick={analyze} disabled={!canAnalyze}>
          🔍 Analyser mon CV
        </button>
        {!cvData && <p style={S.hint}>Génère d'abord un CV pour lancer l'analyse.</p>}
        {cvData && offer.trim().length < 30 && <p style={S.hint}>Colle une offre (au moins quelques lignes) pour analyser.</p>}

        {/* Résultats */}
        {result && (
          <div style={S.results}>
            {/* Score de matching */}
            <div style={S.scoreCard}>
              <Ring value={result.match.score} color={matchColor(result.match.score)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.scoreTitle}>Correspondance à l'offre</div>
                <div style={S.scoreSub}>
                  {result.match.present.length}/{result.match.total} mots-clés couverts
                </div>
                <div style={{ ...S.scoreVerdict, color: matchColor(result.match.score) }}>
                  {result.match.score >= 70 ? 'Très bon profil pour cette offre 👍'
                    : result.match.score >= 40 ? 'Correct — quelques ajouts te démarqueraient'
                    : 'Écart important — adapte ton CV à l\'offre'}
                </div>
              </div>
            </div>

            {/* Mots-clés manquants */}
            {result.match.missing.length > 0 && (
              <div style={{ ...S.block, ...S.blockAmber }}>
                <div style={{ ...S.blockTitle, color: C.amber }}>🔑 Mots-clés de l'offre absents de ton CV</div>
                <div style={S.chips}>
                  {result.match.missing.map((k) => <span key={k} style={S.chipAmber}>{k}</span>)}
                </div>
                <div style={S.note}>Intègre ceux qui correspondent vraiment à ton vécu (sans jamais inventer).</div>
              </div>
            )}

            {/* Check ATS */}
            <div style={S.block}>
              <div style={S.atsHead}>
                <div style={{ ...S.blockTitle, margin: 0 }}>🤖 Compatibilité ATS</div>
                <span style={{ ...S.atsScore, color: matchColor(result.ats.score), background: matchColor(result.ats.score) + '18' }}>
                  {result.ats.score}%
                </span>
              </div>
              <div style={S.checks}>
                {result.ats.checks.map((c) => (
                  <div key={c.id} style={S.checkRow}>
                    <span style={{ ...S.checkMark, color: c.ok ? C.green : C.red }}>{c.ok ? '✓' : '✕'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: c.ok ? C.ink : C.ink2 }}>{c.label}</div>
                      {!c.ok && <div style={S.checkHint}>{c.hint}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button style={S.cta} onClick={() => navigate('/editor')}>✏️ Améliorer mon CV</button>
            <button style={S.ghostBtn} onClick={analyze}>↻ Relancer l'analyse</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Petit anneau de score (conic-gradient). */
function Ring({ value, color }) {
  return (
    <div style={{
      width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
      background: `conic-gradient(${color} ${value * 3.6}deg, ${C.line} 0deg)`,
      display: 'grid', placeItems: 'center',
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: '50%', background: '#fff',
        display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color,
      }}>{value}%</div>
    </div>
  );
}

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 600, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },

  header: { marginBottom: 18 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 31, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 12px' },
  lead: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 480 },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '18px 0 10px' },
  block: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 12 },
  blockAmber: { background: C.amberSoft, border: `1px solid ${C.amber}33` },
  blockLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, color: C.mute, marginBottom: 8 },
  blockTitle: { fontSize: 14, fontWeight: 800, marginBottom: 12 },
  cvRow: { display: 'flex', alignItems: 'center', gap: 10 },
  cvName: { fontSize: 14.5, fontWeight: 700, color: C.ink },
  cvMeta: { fontSize: 12, color: C.mute, marginTop: 1 },
  empty: { fontSize: 13, color: C.ink2, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  linkBtn: { background: 'none', border: 'none', color: C.blue, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, padding: 0, textDecoration: 'underline' },

  textarea: { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: FONT, color: C.ink, lineHeight: 1.5, resize: 'vertical', marginBottom: 14, outline: 'none' },
  cta: { width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.22)' },
  ghostBtn: { width: '100%', background: '#fff', color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, marginTop: 10 },
  hint: { fontSize: 12, color: C.mute, textAlign: 'center', marginTop: 10 },

  results: { marginTop: 22 },
  scoreCard: { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: '16px 18px', marginBottom: 12, boxShadow: '0 4px 18px rgba(11,22,56,.05)' },
  scoreTitle: { fontSize: 15, fontWeight: 800, color: C.ink },
  scoreSub: { fontSize: 12.5, color: C.mute, marginTop: 2 },
  scoreVerdict: { fontSize: 13, fontWeight: 700, marginTop: 6, lineHeight: 1.4 },

  chips: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  chipAmber: { fontSize: 12, fontWeight: 700, color: '#8a6400', background: '#fff', border: `1px solid ${C.amber}55`, borderRadius: 99, padding: '5px 11px' },
  note: { fontSize: 12, color: C.ink2, marginTop: 10, lineHeight: 1.45 },

  atsHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  atsScore: { fontSize: 14, fontWeight: 800, padding: '3px 10px', borderRadius: 99 },
  checks: { display: 'grid', gap: 9 },
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  checkMark: { fontSize: 15, fontWeight: 800, width: 16, flexShrink: 0, lineHeight: 1.4 },
  checkHint: { fontSize: 12, color: C.ink2, marginTop: 2, lineHeight: 1.45 },
};
