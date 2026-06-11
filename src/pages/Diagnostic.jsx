/**
 * Diagnostic — « Bilan d'employabilité ».
 *
 * Synthèse personnalisée de toute l'activité (CV, entretien, métiers, codes,
 * candidature) : score global, piliers, forces, axes de progression et plan
 * d'action avec liens directs vers les modules. Effet « bilan de compétences ».
 */
import React, { useState, useCallback } from 'react';
import { C, FONT, alpha } from '@/lib/gameTheme';
import ModuleTopBar from '@/components/ModuleTopBar';
import { useNavigate } from 'react-router-dom';
import { getDiagnostic } from '@/lib/employability';

const barColor = (s) => (s >= 70 ? C.green : s >= 40 ? C.amber : C.red);

export default function Diagnostic() {
  const navigate = useNavigate();
  const [diag, setDiag] = useState(() => getDiagnostic());
  const refresh = useCallback(() => setDiag(getDiagnostic()), []);
  const { global, tier, pillars, strengths, gaps } = diag;

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ModuleTopBar label="Bilan" />

        <div style={S.header}>
          <span style={S.eyebrow}>Où en es-tu ?</span>
          <h1 style={S.h1}>Ton bilan d'employabilité</h1>
          <p style={S.lead}>
            Une photo de ta préparation au monde du travail, et les prochaines étapes
            les plus utiles pour décrocher ton poste.
          </p>
        </div>

        {/* Score global */}
        <div style={S.scoreCard}>
          <Ring value={global} color={tier.color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.scoreEmoji}>{tier.emoji}</div>
            <div style={S.scoreLabel}>{tier.label}</div>
            <div style={S.scoreSub}>Score global d'employabilité</div>
          </div>
        </div>

        {/* Piliers */}
        <div style={S.sectionLabel}>Tes piliers</div>
        <div style={S.block}>
          {pillars.map((p) => (
            <div key={p.id} style={S.pillarRow}>
              <span style={{ fontSize: 18, width: 24, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.pillarTop}>
                  <span style={S.pillarLabel}>{p.label}</span>
                  <span style={{ ...S.pillarScore, color: barColor(p.score) }}>{p.score}%</span>
                </div>
                <div style={S.pillarBar}><div style={{ ...S.pillarFill, width: `${p.score}%`, background: barColor(p.score) }} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Forces */}
        {strengths.length > 0 && (
          <>
            <div style={S.sectionLabel}>Tes forces 💪</div>
            <div style={{ ...S.block, ...S.blockGreen }}>
              {strengths.map((p) => (
                <div key={p.id} style={S.strengthRow}>
                  <span style={{ fontSize: 16 }}>{p.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: C.ink }}>{p.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{p.score}%</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Axes de progression */}
        <div style={S.sectionLabel}>{gaps.length ? 'À travailler en priorité' : 'Prochaine étape'}</div>
        {(gaps.length ? gaps : pillars.filter((p) => p.score < 100).slice(0, 1)).map((p) => (
          <div key={p.id} style={S.gapCard}>
            <div style={S.gapHead}>
              <span style={{ fontSize: 18 }}>{p.emoji}</span>
              <span style={S.gapTitle}>{p.label}</span>
              <span style={{ ...S.gapScore, color: barColor(p.score) }}>{p.score}%</span>
            </div>
            <div style={S.gapReco}>{p.reco}</div>
            <button style={S.gapBtn} onClick={() => navigate(p.cta)}>{p.ctaLabel} →</button>
          </div>
        ))}
        {!gaps.length && (
          <div style={S.allGood}>🎉 Excellent — tous tes piliers sont solides ! Continue à t'entraîner pour garder le niveau.</div>
        )}

        <div style={S.footerBtns}>
          <button style={S.ghostBtn} onClick={() => navigate('/parcours')}>🧗 Voir mon parcours</button>
          <button style={S.ghostBtn} onClick={refresh}>↻ Recalculer</button>
        </div>
      </div>
    </div>
  );
}

function Ring({ value, color }) {
  return (
    <div style={{
      width: 84, height: 84, borderRadius: '50%', flexShrink: 0,
      background: `conic-gradient(${color} ${value * 3.6}deg, ${C.line} 0deg)`,
      display: 'grid', placeItems: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: C.card,
        display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, color,
      }}>{value}</div>
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

  scoreCard: { display: 'flex', alignItems: 'center', gap: 18, background: C.ink, color: '#fff', borderRadius: 18, padding: '18px 20px', marginBottom: 8, boxShadow: '0 10px 30px rgba(11,22,56,.18)' },
  scoreEmoji: { fontSize: 24 },
  scoreLabel: { fontSize: 18, fontWeight: 800, marginTop: 2 },
  scoreSub: { fontSize: 12.5, color: '#9AA6C4', marginTop: 2 },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '22px 0 11px' },
  block: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px' },
  blockGreen: { background: C.greenSoft, border: `1px solid ${alpha(C.green, 13)}` },

  pillarRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' },
  pillarTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  pillarLabel: { fontSize: 13.5, fontWeight: 600, color: C.ink },
  pillarScore: { fontSize: 12.5, fontWeight: 800 },
  pillarBar: { height: 7, background: C.track, borderRadius: 99, overflow: 'hidden' },
  pillarFill: { height: '100%', borderRadius: 99, transition: 'width .5s ease' },

  strengthRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' },

  gapCard: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  gapHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  gapTitle: { fontSize: 14.5, fontWeight: 800, color: C.ink, flex: 1 },
  gapScore: { fontSize: 13, fontWeight: 800 },
  gapReco: { fontSize: 13, color: C.ink2, lineHeight: 1.5, marginBottom: 12 },
  gapBtn: { background: C.blue, color: '#fff', border: 'none', borderRadius: 11, padding: '11px 16px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  allGood: { background: C.greenSoft, border: `1px solid ${alpha(C.green, 20)}`, borderRadius: 14, padding: '14px 16px', fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.5 },

  footerBtns: { display: 'grid', gap: 10, marginTop: 22 },
  ghostBtn: { background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },
};
