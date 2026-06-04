/**
 * Journey — « Ton chemin vers l'emploi » : parcours gamifié unifié.
 *
 * Agrège la progression de toutes les briques (CV, métiers, entretien) en un
 * niveau global, des étapes à franchir et des badges. Colonne vertébrale qui
 * relie le générateur de CV, le décrypteur de métiers et le simulateur.
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJourney } from '@/lib/journey';

const FONT = "'Manrope', system-ui, sans-serif";
const C = {
  ink: '#0B1638', ink2: '#3A4156', mute: '#8390A6',
  line: '#E6EAF1', bg: '#F4F6FA', blue: '#1539B7', blueSoft: '#EEF2FF',
  green: '#0CA678', greenSoft: '#E6F8F1', amber: '#E8A500',
};

export default function Journey() {
  const navigate = useNavigate();
  const j = useMemo(() => getJourney(), []);
  const { level, xp, streak, steps, completed, totalSteps, badges, earnedBadges } = j;
  const pathPct = totalSteps ? Math.round((completed / totalSteps) * 100) : 0;

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={() => navigate('/')}>← Accueil</button>
          <span style={S.brandTag}>ALTIO · Parcours</span>
        </div>

        <div style={S.header}>
          <span style={S.eyebrow}>Ta progression</span>
          <h1 style={S.h1}>Ton chemin vers l'emploi</h1>
          <p style={S.lead}>
            Chaque action — CV, métier décrypté, entretien validé — te fait avancer.
            Suis ta progression et débloque des badges.
          </p>
        </div>

        {/* Carte niveau */}
        <div style={S.levelCard}>
          <div style={S.levelTopRow}>
            <span style={S.levelEmoji}>{level.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.levelName}>Niveau · {level.label}</div>
              <div style={S.levelXp}>⚡ {xp} XP{streak > 0 ? ` · 🔥 ${streak} j` : ''}</div>
            </div>
            <div style={S.levelStepsBadge}>{completed}/{totalSteps} étapes</div>
          </div>
          <div style={S.levelBar}>
            <div style={{ ...S.levelFill, width: `${level.progress}%` }} />
          </div>
          <div style={S.levelHint}>
            {level.next
              ? `Plus que ${level.toNext} XP pour le niveau « ${level.next.label} » ${level.next.emoji}`
              : 'Niveau maximum atteint — bravo ! 👑'}
          </div>
        </div>

        {/* Chemin (étapes) */}
        <div style={S.sectionLabel}>Les étapes ({pathPct}%)</div>
        <div style={S.path}>
          {steps.map((st, i) => {
            const last = i === steps.length - 1;
            const tone = st.locked ? 'locked' : st.done ? 'done' : 'todo';
            return (
              <div key={st.id} style={S.stepRow}>
                {/* Rail + pastille */}
                <div style={S.rail}>
                  <div style={{
                    ...S.dot,
                    background: tone === 'done' ? C.green : tone === 'locked' ? '#E3E8F2' : '#fff',
                    borderColor: tone === 'done' ? C.green : tone === 'todo' ? C.blue : C.line,
                    color: tone === 'done' ? '#fff' : tone === 'locked' ? C.mute : C.blue,
                  }}>
                    {tone === 'done' ? '✓' : tone === 'locked' ? '🔒' : st.emoji}
                  </div>
                  {!last && <div style={{ ...S.line, background: st.done ? C.green : C.line }} />}
                </div>

                {/* Carte étape */}
                <div style={{ ...S.stepCard, ...(st.locked ? S.stepCardLocked : {}) }}>
                  <div style={S.stepHead}>
                    <span style={S.stepTitle}>{st.title}</span>
                    {tone === 'done' && <span style={S.stepDoneTag}>Validé</span>}
                    {tone === 'locked' && <span style={S.stepSoonTag}>Bientôt</span>}
                  </div>
                  <div style={S.stepDesc}>{st.desc}</div>
                  {!st.locked && (
                    <button
                      style={st.done ? S.stepBtnGhost : S.stepBtn}
                      onClick={() => navigate(st.cta)}
                    >
                      {st.ctaLabel} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div style={S.sectionLabel}>Badges ({earnedBadges}/{badges.length})</div>
        <div style={S.badgeGrid}>
          {badges.map((b) => (
            <div key={b.id} style={{ ...S.badge, ...(b.earned ? {} : S.badgeLocked) }}>
              <span style={{ ...S.badgeEmoji, filter: b.earned ? 'none' : 'grayscale(1)', opacity: b.earned ? 1 : 0.45 }}>
                {b.emoji}
              </span>
              <span style={{ ...S.badgeLabel, color: b.earned ? C.ink : C.mute }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 600, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },

  header: { marginBottom: 18 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 12px' },
  lead: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 480 },

  levelCard: { background: C.ink, color: '#fff', borderRadius: 18, padding: '18px 20px', marginBottom: 8, boxShadow: '0 10px 30px rgba(11,22,56,.18)' },
  levelTopRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  levelEmoji: { fontSize: 34 },
  levelName: { fontSize: 16, fontWeight: 800 },
  levelXp: { fontSize: 13, color: '#9AA6C4', marginTop: 2, fontWeight: 600 },
  levelStepsBadge: { fontSize: 11.5, fontWeight: 800, background: 'rgba(255,255,255,.12)', padding: '5px 10px', borderRadius: 99, whiteSpace: 'nowrap' },
  levelBar: { height: 9, background: 'rgba(255,255,255,.16)', borderRadius: 99, overflow: 'hidden' },
  levelFill: { height: '100%', background: 'linear-gradient(90deg,#6E8BFF,#2ED3A8)', borderRadius: 99, transition: 'width .5s ease' },
  levelHint: { fontSize: 12, color: '#9AA6C4', marginTop: 9 },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '24px 0 12px' },

  path: { },
  stepRow: { display: 'flex', gap: 14, alignItems: 'stretch' },
  rail: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 },
  dot: { width: 36, height: 36, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 },
  line: { width: 2, flex: 1, minHeight: 18, margin: '2px 0' },
  stepCard: { flex: 1, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '13px 15px', marginBottom: 12 },
  stepCardLocked: { background: '#F7F9FC', borderStyle: 'dashed' },
  stepHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  stepTitle: { fontSize: 14.5, fontWeight: 800, color: C.ink, flex: 1 },
  stepDoneTag: { fontSize: 10.5, fontWeight: 800, color: C.green, background: C.greenSoft, padding: '3px 8px', borderRadius: 99 },
  stepSoonTag: { fontSize: 10.5, fontWeight: 800, color: C.mute, background: '#EEF1F6', padding: '3px 8px', borderRadius: 99 },
  stepDesc: { fontSize: 13, color: C.ink2, lineHeight: 1.45, marginBottom: 10 },
  stepBtn: { background: C.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  stepBtnGhost: { background: '#fff', color: C.blue, border: `1.5px solid ${C.blue}33`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  badge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 6px', textAlign: 'center' },
  badgeLocked: { background: '#F7F9FC' },
  badgeEmoji: { fontSize: 26 },
  badgeLabel: { fontSize: 10.5, fontWeight: 700, lineHeight: 1.25 },
};
