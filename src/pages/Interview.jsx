/**
 * Interview — Jeu de simulation d'entretien (type "code de la route").
 *
 * Flux : ÉCRAN INTRO (choix de session) → QUESTIONS (scénario + options +
 * feedback immédiat) → RÉSULTATS (score, debrief, rejouer, upsell IA).
 *
 * Le jeu de base est GRATUIT (banque statique, zéro coût API) → sert d'accroche
 * depuis l'accueil. La session personnalisée par IA est proposée en upsell.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCategories, buildSession, CATEGORIES } from '@/lib/interviewBank';
import { getBest, saveResult, getOverallCompletion, getThemesPlayed } from '@/lib/interviewProgress';
import { track } from '@/lib/monitoring';

const FONT = "'Manrope', system-ui, sans-serif";
const C = {
  ink: '#0B1638', ink2: '#3A4156', mute: '#8390A6',
  line: '#E6EAF1', bg: '#F4F6FA', blue: '#1539B7', blueSoft: '#EEF2FF',
  green: '#0CA678', greenSoft: '#E6F8F1', red: '#E03131', redSoft: '#FFF0F0',
};

const SESSION_SIZE = 8;

export default function Interview() {
  const navigate = useNavigate();
  const [phase, setPhase]       = useState('intro'); // intro | play | result
  const [session, setSession]   = useState([]);
  const [idx, setIdx]           = useState(0);
  const [picked, setPicked]     = useState(null);  // index option choisie (révèle le feedback)
  const [answers, setAnswers]   = useState([]);    // { id, category, correct }
  const [lastCat, setLastCat]   = useState('all'); // thème de la session en cours (pour rejouer)

  const cats = useMemo(() => listCategories(), []);

  function start(category) {
    const s = buildSession({ category, size: SESSION_SIZE });
    setSession(s); setIdx(0); setPicked(null); setAnswers([]);
    setLastCat(category);
    setPhase('play');
    track('interview_session_start', { category, size: s.length });
  }

  function choose(optIdx) {
    if (picked !== null) return; // déjà répondu
    setPicked(optIdx);
    const q = session[idx];
    const correct = !!q.options[optIdx].correct;
    setAnswers((a) => [...a, { id: q.id, category: q.category, correct }]);
  }

  function next() {
    if (idx + 1 < session.length) {
      setIdx(idx + 1); setPicked(null);
    } else {
      const score = answers.filter((a) => a.correct).length;
      const pct = Math.round((score / session.length) * 100);
      saveResult(lastCat, pct); // mémorise le meilleur score du thème (% complétion)
      setPhase('result');
      track('interview_session_done', { score, total: session.length, category: lastCat });
    }
  }

  if (phase === 'intro') return <Intro cats={cats} onStart={start} onHome={() => navigate('/')} />;
  if (phase === 'result') return (
    <Result
      answers={answers} total={session.length}
      onReplaySame={() => start(lastCat)}
      onReplay={() => setPhase('intro')}
      onHome={() => navigate('/')}
      onUpsell={() => navigate('/pricing')}
    />
  );

  // ── PHASE JEU ──────────────────────────────────────────────────────────────
  const q = session[idx];
  const cat = CATEGORIES[q.category];
  const correctIdx = q.options.findIndex((o) => o.correct);
  const answered = picked !== null;
  const progress = ((idx + (answered ? 1 : 0)) / session.length) * 100;

  return (
    <div style={S.shell}>
      <div style={S.playWrap}>
        {/* Barre de progression */}
        <div style={S.topRow}>
          <button style={S.quitBtn} onClick={() => setPhase('intro')}>← Quitter</button>
          <div style={S.progText}>Question {idx + 1} / {session.length}</div>
        </div>
        <div style={S.progBar}>
          <div style={{ ...S.progFill, width: `${progress}%` }} />
        </div>
        <div style={S.progPct}>{Math.round(progress)}% complété</div>

        {/* Carte scénario */}
        <div style={S.card}>
          <div style={{ ...S.catChip, background: cat.color + '18', color: cat.color }}>
            <span style={{ fontSize: 15 }}>{cat.emoji}</span> {cat.label}
          </div>

          <div style={S.illu} aria-hidden>{cat.emoji}</div>
          {q.context && (
            <div style={S.context}>
              <span style={S.contextLabel}>MISE EN SITUATION</span>
              {q.context}
            </div>
          )}
          <div style={S.situation}>{q.situation}</div>
          <div style={S.question}>{q.question}</div>

          <div style={S.options}>
            {q.options.map((opt, i) => {
              const isCorrect = i === correctIdx;
              const isPicked  = i === picked;
              let st = S.opt;
              if (answered && isCorrect)        st = { ...S.opt, ...S.optCorrect };
              else if (answered && isPicked)    st = { ...S.opt, ...S.optWrong };
              else if (answered)                st = { ...S.opt, opacity: 0.55 };
              return (
                <button key={i} style={st} onClick={() => choose(i)} disabled={answered}>
                  <span style={S.optBullet}>{String.fromCharCode(65 + i)}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{opt.text}</span>
                  {answered && isCorrect && <span style={S.mark}>✓</span>}
                  {answered && isPicked && !isCorrect && <span style={S.markWrong}>✕</span>}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <div style={{
              ...S.feedback,
              background: q.options[picked].correct ? C.greenSoft : C.redSoft,
              borderColor: q.options[picked].correct ? C.green : C.red,
            }}>
              <div style={S.fbTitle}>
                {q.options[picked].correct ? '✅ Bonne réponse !' : '❌ Pas tout à fait'}
              </div>
              <div style={S.fbText}>{q.explanation}</div>
              <div style={S.fbTip}>💡 {q.tip}</div>
            </div>
          )}
        </div>

        {answered && (
          <button style={S.nextBtn} onClick={next}>
            {idx + 1 < session.length ? 'Question suivante →' : 'Voir mon résultat →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ÉCRAN INTRO ───────────────────────────────────────────────────────────────
function Intro({ cats, onStart, onHome }) {
  const overall = getOverallCompletion();
  const played = getThemesPlayed();
  return (
    <div style={S.shell}>
      <div style={S.introWrap}>
        <button style={S.quitBtn} onClick={onHome}>← Accueil</button>
        <div style={S.heroIcon}>🎤</div>
        <h1 style={S.h1}>Simulateur d'entretien</h1>
        <p style={S.lead}>
          Des mises en situation réelles, comme à l'examen. Choisis ta réponse,
          reçois un feedback immédiat et progresse session après session.
        </p>

        {overall > 0 && (
          <div style={S.overall}>
            <span style={{ fontSize: 13, color: C.ink2, fontWeight: 600 }}>
              Progression globale
              <span style={{ color: C.mute, fontWeight: 500 }}> · {played}/{cats.length} thèmes</span>
            </span>
            <div style={S.overallBar}><div style={{ ...S.overallFill, width: `${overall}%` }} /></div>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.blue }}>{overall}%</span>
          </div>
        )}

        <button style={S.bigStart} onClick={() => onStart('all')}>
          ▶ Session mixte — {SESSION_SIZE} questions
        </button>

        <div style={S.orRow}><span style={S.orLine} /><span style={S.orText}>ou choisis un thème</span><span style={S.orLine} /></div>

        <div style={S.catGrid}>
          {cats.map((c) => {
            const best = getBest(c.id);
            return (
              <button key={c.id} style={S.catCard} onClick={() => onStart(c.id)}>
                <span style={{ fontSize: 26 }}>{c.emoji}</span>
                <span style={S.catName}>{c.label}</span>
                <span style={S.catCount}>{c.count} question{c.count > 1 ? 's' : ''}</span>
                {best > 0 && (
                  <span style={{ ...S.bestBadge, color: best >= 80 ? C.green : C.ink2 }}>
                    {best >= 80 ? '★ ' : ''}Record {best}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── ÉCRAN RÉSULTATS ─────────────────────────────────────────────────────────
function Result({ answers, total, onReplaySame, onReplay, onHome, onUpsell }) {
  const score = answers.filter((a) => a.correct).length;
  const pct = Math.round((score / total) * 100);

  // Bilan par catégorie
  const byCat = {};
  answers.forEach((a) => {
    byCat[a.category] = byCat[a.category] || { ok: 0, n: 0 };
    byCat[a.category].n++; if (a.correct) byCat[a.category].ok++;
  });

  let verdict, vColor, vEmoji;
  if (pct >= 80)      { verdict = 'Excellent — tu es prêt à convaincre !'; vColor = C.green; vEmoji = '🏆'; }
  else if (pct >= 50) { verdict = 'Bien — quelques réflexes à affiner.';   vColor = '#E8A500'; vEmoji = '👍'; }
  else                { verdict = 'À travailler — révise les bonnes pratiques.'; vColor = C.red; vEmoji = '💪'; }

  return (
    <div style={S.shell}>
      <div style={S.introWrap}>
        <div style={S.heroIcon}>{vEmoji}</div>
        <h1 style={S.h1}>{score} / {total}</h1>
        <div style={{ ...S.resultVerdict, color: vColor }}>{verdict}</div>

        <div style={S.scoreBarOuter}>
          <div style={{ ...S.scoreBarInner, width: `${pct}%`, background: vColor }} />
        </div>

        {/* Bilan par thème */}
        <div style={S.catResults}>
          {Object.entries(byCat).map(([cid, r]) => {
            const cat = CATEGORIES[cid];
            return (
              <div key={cid} style={S.catResultRow}>
                <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, color: C.ink2 }}>{cat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.ok === r.n ? C.green : C.ink }}>
                  {r.ok}/{r.n}
                </span>
              </div>
            );
          })}
        </div>

        <div style={S.resultBtns}>
          <button style={S.bigStart} onClick={onReplaySame}>↻ Repasser ce test</button>
          <button style={S.ghostBtn} onClick={onReplay}>Choisir un autre thème</button>
          <button style={S.ghostBtn} onClick={onHome}>Retour à l'accueil</button>
        </div>

        {/* Upsell IA */}
        <div style={S.upsell}>
          <div style={S.upsellBadge}>PRO</div>
          <div style={S.upsellTitle}>🎯 Entraîne-toi sur TON entretien</div>
          <div style={S.upsellText}>
            Génère une session personnalisée à partir de ton CV et de l'offre visée :
            questions probables pour CE poste, réponses idéales, pièges à éviter.
          </div>
          <button style={S.upsellBtn} onClick={onUpsell}>Débloquer les sessions personnalisées</button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  introWrap: { maxWidth: 560, margin: '0 auto', textAlign: 'center' },
  playWrap: { maxWidth: 600, margin: '0 auto' },

  heroIcon: { fontSize: 56, marginTop: 24 },
  h1: { fontSize: 34, fontWeight: 800, letterSpacing: -0.8, margin: '8px 0 6px' },
  lead: { fontSize: 15, color: C.ink2, lineHeight: 1.55, margin: '0 auto 28px', maxWidth: 460 },

  bigStart: { width: '100%', maxWidth: 420, background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.25)' },
  ghostBtn: { background: '#fff', color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },

  orRow: { display: 'flex', alignItems: 'center', gap: 12, margin: '26px 0 18px' },
  orLine: { flex: 1, height: 1, background: C.line },
  orText: { fontSize: 12, color: C.mute, fontWeight: 600 },

  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  catCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 10px', cursor: 'pointer', fontFamily: FONT, transition: 'border-color .15s, transform .1s' },
  catName: { fontSize: 13.5, fontWeight: 700, color: C.ink, marginTop: 2 },
  catCount: { fontSize: 11, color: C.mute },

  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  quitBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  progText: { fontSize: 12.5, fontWeight: 700, color: C.mute },
  progBar: { height: 8, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden', marginBottom: 5 },
  progFill: { height: '100%', background: C.blue, borderRadius: 99, transition: 'width .35s cubic-bezier(.16,.84,.24,1)' },
  progPct: { fontSize: 11.5, fontWeight: 700, color: C.blue, textAlign: 'right', marginBottom: 16 },

  context: { background: '#F0F3FB', border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, color: C.ink2, lineHeight: 1.55, textAlign: 'left', marginBottom: 14 },
  contextLabel: { display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: C.blue, marginBottom: 5 },

  overall: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, padding: '10px 14px', maxWidth: 420, margin: '0 auto 18px' },
  overallBar: { flex: 1, height: 8, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden' },
  overallFill: { height: '100%', background: C.blue, borderRadius: 99 },
  bestBadge: { fontSize: 10.5, fontWeight: 700, marginTop: 3 },

  card: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, padding: '22px 22px 24px', boxShadow: '0 4px 20px rgba(11,22,56,.05)' },
  catChip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 99 },
  illu: { fontSize: 46, textAlign: 'center', margin: '14px 0 6px' },
  situation: { fontSize: 16.5, fontWeight: 700, color: C.ink, lineHeight: 1.4, textAlign: 'center', marginBottom: 6 },
  question: { fontSize: 14, color: C.ink2, textAlign: 'center', marginBottom: 18 },

  options: { display: 'grid', gap: 10 },
  opt: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: '#fff', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 14, fontWeight: 500, color: C.ink, cursor: 'pointer', fontFamily: FONT, transition: 'all .12s' },
  optCorrect: { borderColor: C.green, background: C.greenSoft, fontWeight: 700 },
  optWrong: { borderColor: C.red, background: C.redSoft },
  optBullet: { width: 24, height: 24, borderRadius: 7, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.ink2, flexShrink: 0 },
  mark: { color: C.green, fontWeight: 800, fontSize: 16 },
  markWrong: { color: C.red, fontWeight: 800, fontSize: 16 },

  feedback: { marginTop: 16, border: '1.5px solid', borderRadius: 12, padding: '13px 15px', textAlign: 'left' },
  fbTitle: { fontSize: 14, fontWeight: 800, marginBottom: 5 },
  fbText: { fontSize: 13.5, color: C.ink2, lineHeight: 1.5 },
  fbTip: { fontSize: 12.5, color: C.ink, marginTop: 8, fontWeight: 600 },

  nextBtn: { width: '100%', marginTop: 16, background: C.ink, color: '#fff', border: 'none', borderRadius: 13, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  resultVerdict: { fontSize: 15.5, fontWeight: 700, marginBottom: 18 },
  scoreBarOuter: { height: 12, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden', maxWidth: 420, margin: '0 auto 24px' },
  scoreBarInner: { height: '100%', borderRadius: 99, transition: 'width .6s ease' },
  catResults: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '8px 14px', maxWidth: 420, margin: '0 auto 22px' },
  catResultRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.bg}` },
  resultBtns: { display: 'grid', gap: 10, maxWidth: 420, margin: '0 auto 26px', justifyItems: 'center' },

  upsell: { position: 'relative', background: '#0B1638', color: '#fff', borderRadius: 16, padding: '22px 20px', maxWidth: 460, margin: '0 auto', textAlign: 'left' },
  upsellBadge: { position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, background: '#EEF2FF', color: C.blue, padding: '3px 9px', borderRadius: 6 },
  upsellTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  upsellText: { fontSize: 13, color: '#B9C2DA', lineHeight: 1.55, marginBottom: 16 },
  upsellBtn: { width: '100%', background: '#fff', color: C.ink, border: 'none', borderRadius: 11, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
};
