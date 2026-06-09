/**
 * WorkCodes — « Codes de l'entreprise » : tests de jugement situationnel (SJT).
 *
 * Prépare le savoir-être EN POSTE (après l'embauche). Pour chaque situation,
 * l'utilisateur choisit la meilleure réaction parmi des options notées 0/1/2
 * (à éviter / acceptable / idéal). Le coach Sam explique chaque choix.
 * XP partagé avec le reste de l'app ; note /20 « maîtrise des codes ».
 */
import React, { useState, useMemo } from 'react';
import { C, FONT } from '@/lib/gameTheme';
import { useNavigate } from 'react-router-dom';
import {
  CODE_THEMES, listCodeThemes, buildCodesSession,
  xpForScore, computeNote, saveCodesResult, SCORE_META, PASS_MARK,
} from '@/lib/workCodes';
import { addXp, getTotalXp } from '@/lib/interviewProgress';
import SamFeedback from '@/components/game/SamFeedback';
import { track } from '@/lib/monitoring';

const SESSION_SIZE = 8;
const toneColor = { good: C.green, mid: C.amber, bad: C.red };
const toneSoft  = { good: C.greenSoft, mid: C.amberSoft, bad: C.redSoft };
const scoreTone = (sc) => SCORE_META[sc].tone;

export default function WorkCodes() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro'); // intro | play | done
  const [theme, setTheme] = useState('all');
  const [session, setSession] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [scores, setScores] = useState([]);
  const [xp, setXp] = useState(0);

  const themes = useMemo(() => listCodeThemes(), []);

  function start(themeId) {
    const s = buildCodesSession({ theme: themeId, size: SESSION_SIZE });
    setSession(s); setTheme(themeId); setIdx(0); setPicked(null); setScores([]); setXp(0);
    setPhase('play');
    track('codes_session_start', { theme: themeId, size: s.length });
  }

  function answer(optIdx) {
    if (picked !== null) return;
    const sc = session[idx].options[optIdx].score;
    setPicked(optIdx);
    setScores((a) => [...a, sc]);
    const gain = xpForScore(sc);
    if (gain) { setXp((x) => x + gain); addXp(gain); }
  }

  function next() {
    if (idx + 1 >= session.length) {
      const note = computeNote(scores);
      saveCodesResult(note);
      track('codes_session_done', { theme, total: session.length, note, xp });
      setPhase('done');
    } else { setIdx(idx + 1); setPicked(null); }
  }

  if (phase === 'intro') return <Intro themes={themes} onStart={start} onHome={() => navigate('/')} />;
  if (phase === 'done') {
    return <Done scores={scores} xp={xp} onReplay={() => start(theme)} onOther={() => setPhase('intro')} onHome={() => navigate('/')} />;
  }

  // ── PLAY ────────────────────────────────────────────────────────────────────
  const q = session[idx];
  const meta = CODE_THEMES[q.theme];
  const answered = picked !== null;
  const idealIdx = q.options.findIndex((o) => o.score === 2);
  const progress = ((idx + (answered ? 1 : 0)) / session.length) * 100;
  const chosen = answered ? q.options[picked] : null;

  return (
    <div style={S.shell}>
      <style>{`@keyframes sjtIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={() => setPhase('intro')}>← Quitter</button>
          <div style={S.hud}>
            <span style={S.xpPill}>⚡ {xp}</span>
            <span style={S.progText}>{idx + 1}/{session.length}</span>
          </div>
        </div>
        <div style={S.progBar}><div style={{ ...S.progFill, width: `${progress}%` }} /></div>

        <div key={idx} style={S.card}>
          <div style={{ ...S.chip, background: meta.color + '18', color: meta.color }}>
            <span style={{ fontSize: 15 }}>{meta.emoji}</span> {meta.label}
          </div>

          <div style={S.scenarioHead}>
            <span style={S.scenarioLine} /><span style={S.scenarioLabel}>🏢 La situation</span><span style={S.scenarioLine} />
          </div>
          {q.context && <div style={S.context}>{q.context}</div>}
          <div style={S.situation}>{q.situation}</div>
          <div style={S.prompt}>Quelle est la meilleure réaction ?</div>

          <div style={S.options}>
            {q.options.map((o, i) => {
              const isPicked = i === picked;
              const isIdeal = i === idealIdx;
              let st = S.opt;
              if (answered && isIdeal) st = { ...S.opt, borderColor: C.green, background: C.greenSoft, fontWeight: 700 };
              else if (answered && isPicked) st = { ...S.opt, borderColor: toneColor[scoreTone(o.score)], background: toneSoft[scoreTone(o.score)] };
              else if (answered) st = { ...S.opt, opacity: 0.5 };
              return (
                <button key={i} style={st} onClick={() => answer(i)} disabled={answered}>
                  <span style={{ flex: 1, textAlign: 'left' }}>{o.text}</span>
                  {answered && isIdeal && <span style={S.markGood}>★</span>}
                  {answered && isPicked && !isIdeal && <span style={{ ...S.markTone, color: toneColor[scoreTone(o.score)] }}>
                    {o.score === 1 ? '≈' : '✕'}
                  </span>}
                </button>
              );
            })}
          </div>

          {answered && (
            <SamFeedback
              tone={scoreTone(chosen.score)}
              verdict={`${SCORE_META[chosen.score].label} · +${xpForScore(chosen.score)} XP`}
              tip={q.tip}
            >
              {chosen.feedback}
              {chosen.score !== 2 && (
                <div style={S.fbIdeal}>★ Réflexe idéal : {q.options[idealIdx].text}</div>
              )}
            </SamFeedback>
          )}
        </div>

        {answered && (
          <button style={S.nextBtn} onClick={next}>
            {idx + 1 >= session.length ? 'Voir mon bilan →' : 'Situation suivante →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── INTRO ─────────────────────────────────────────────────────────────────────
function Intro({ themes, onStart, onHome }) {
  const totalXp = getTotalXp();
  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={onHome}>← Accueil</button>
          <span style={S.brandTag}>ALTIO · Codes</span>
        </div>
        <div style={S.header}>
          <span style={S.eyebrow}>Savoir-être en entreprise</span>
          <h1 style={S.h1}>Les codes de l'entreprise</h1>
          <p style={S.lead}>
            Décrocher le poste, c'est une étape ; bien s'intégrer en est une autre.
            Entraîne-toi sur des situations réelles : choisis la meilleure réaction.
          </p>
        </div>

        {totalXp > 0 && <div style={S.xpRow}><span style={S.xpPill}>⚡ {totalXp} XP</span></div>}

        <button style={S.bigStart} onClick={() => onStart('all')}>
          ▶ Session mixte — {SESSION_SIZE} situations
        </button>

        <div style={S.sectionLabel}>Ou choisis un thème</div>
        <div style={S.grid}>
          {themes.map((t) => (
            <button key={t.id} style={S.themeCard} onClick={() => onStart(t.id)}>
              <span style={{ fontSize: 24 }}>{t.emoji}</span>
              <span style={S.themeName}>{t.label}</span>
              <span style={S.themeCount}>{t.count} situations</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BILAN ─────────────────────────────────────────────────────────────────────
function Done({ scores, xp, onReplay, onOther, onHome }) {
  const note = computeNote(scores);
  const passed = note >= PASS_MARK;
  const accent = passed ? C.green : C.red;
  const ideals = scores.filter((s) => s === 2).length;
  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', margin: '20px 0 24px' }}>
          <div style={{ fontSize: 52 }}>{passed ? '🤝' : '💪'}</div>
          <div style={S.noteBig}><span style={{ color: accent }}>{note}</span><span style={S.noteOutOf}>/20</span></div>
          <p style={S.doneSub}>{ideals}/{scores.length} réflexes idéaux · ⚡ {xp} XP</p>
          <div style={{ ...S.verdict, background: passed ? C.greenSoft : C.redSoft, color: accent }}>
            {passed
              ? '✅ Tu maîtrises les codes du monde du travail !'
              : `Il faut au moins ${PASS_MARK}/20 — rejoue pour ancrer les bons réflexes.`}
          </div>
        </div>
        <div style={S.doneBtns}>
          <button style={{ ...S.bigStart, ...(passed ? {} : { background: accent, boxShadow: 'none' }) }} onClick={onReplay}>
            ↻ {passed ? 'Rejouer' : 'Recommencer'}
          </button>
          <button style={S.ghostBtn} onClick={onOther}>Changer de thème</button>
          <button style={S.ghostBtn} onClick={onHome}>Retour à l'accueil</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 600, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },
  hud: { display: 'flex', alignItems: 'center', gap: 10 },
  xpPill: { fontSize: 12, fontWeight: 800, color: C.blue, background: C.blueSoft, padding: '4px 10px', borderRadius: 99 },
  xpRow: { marginBottom: 16 },
  progText: { fontSize: 12.5, fontWeight: 700, color: C.mute },
  progBar: { height: 8, background: C.track, borderRadius: 99, overflow: 'hidden', marginBottom: 12 },
  progFill: { height: '100%', background: C.blue, borderRadius: 99, transition: 'width .35s cubic-bezier(.16,.84,.24,1)' },

  header: { marginBottom: 18 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 12px' },
  lead: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 480 },

  bigStart: { width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.25)' },
  ghostBtn: { width: '100%', background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },
  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '24px 0 12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  themeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 10px', cursor: 'pointer', fontFamily: FONT, textAlign: 'center' },
  themeName: { fontSize: 13.5, fontWeight: 700, color: C.ink, marginTop: 2 },
  themeCount: { fontSize: 11, color: C.mute },

  card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '20px 22px 24px', boxShadow: '0 4px 20px rgba(11,22,56,.05)', animation: 'sjtIn .35s ease both' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 99 },
  scenarioHead: { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' },
  scenarioLine: { flex: 1, height: 1, background: C.line },
  scenarioLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: C.blue, whiteSpace: 'nowrap' },
  context: { background: C.card2, borderLeft: `4px solid ${C.blue}`, borderRadius: '0 12px 12px 0', padding: '12px 14px', fontSize: 14, color: C.ink, lineHeight: 1.55, marginBottom: 12 },
  situation: { fontSize: 18.5, fontWeight: 800, color: C.ink, lineHeight: 1.35, letterSpacing: -0.3 },
  prompt: { fontSize: 13.5, color: C.ink2, fontWeight: 600, margin: '10px 0 16px' },

  options: { display: 'grid', gap: 10 },
  opt: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 14, fontWeight: 500, color: C.ink, cursor: 'pointer', fontFamily: FONT, transition: 'all .12s' },
  markGood: { color: C.green, fontWeight: 800, fontSize: 16 },
  markTone: { fontWeight: 800, fontSize: 16 },

  fbIdeal: { fontSize: 13, color: C.ink, fontWeight: 600, marginTop: 8, background: C.greenSoft, borderRadius: 8, padding: '8px 10px' },
  nextBtn: { width: '100%', marginTop: 16, background: C.ink, color: '#fff', border: 'none', borderRadius: 13, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  noteBig: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, margin: '6px 0 2px', fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1 },
  noteOutOf: { fontSize: 22, fontWeight: 700, color: C.mute, marginLeft: 2 },
  doneSub: { fontSize: 14, color: C.ink2, fontWeight: 600, margin: '8px 0 12px' },
  verdict: { fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, borderRadius: 12, padding: '12px 16px', maxWidth: 460, margin: '0 auto' },
  doneBtns: { display: 'grid', gap: 10, maxWidth: 420, margin: '0 auto' },
};
