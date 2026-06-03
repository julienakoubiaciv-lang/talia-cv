/**
 * Jobs — « Décrypte les métiers » : module ludique de compréhension des postes.
 *
 * Pour chaque métier : une FICHE (compétences clés + pourquoi, ce que cherche le
 * recruteur, pièges) puis des MINI-JEUX pour ancrer :
 *   - Hard vs Soft     : classer une compétence (savoir-faire vs savoir-être)
 *   - Compétence clé   : repérer LA compétence la plus valorisée pour le poste
 *   - Situation        : associer une situation au savoir-faire qu'elle mobilise
 *
 * Connecté au CV : si un CV récent vise un métier couvert, on le met en avant et
 * on propose, à la fin, d'ajouter ses compétences clés au CV.
 * XP partagé avec le simulateur d'entretien (interviewProgress).
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listJobsBySector, getJob, detectTargetJob } from '@/lib/jobIntel';
import { shuffle } from '@/lib/interviewBank';
import { addXp, getTotalXp } from '@/lib/interviewProgress';
import { track } from '@/lib/monitoring';

const FONT = "'Manrope', system-ui, sans-serif";
const C = {
  ink: '#0B1638', ink2: '#3A4156', mute: '#8390A6',
  line: '#E6EAF1', bg: '#F4F6FA', blue: '#1539B7', blueSoft: '#EEF2FF',
  green: '#0CA678', greenSoft: '#E6F8F1', red: '#E03131', redSoft: '#FFF0F0',
  amber: '#E8A500', hard: '#1539B7', soft: '#7048E8', softBg: '#F3EEFF',
};

const XP_PER_CORRECT = 20;
const PRAISE  = ['Exact !', 'Bien vu !', 'Parfait 👌', 'Tu cernes le métier !'];
const NOPE    = ['Presque !', 'Pas tout à fait.', 'Retiens l\'explication 👇'];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

/** Tire n éléments distincts d'un tableau, en excluant `exclude`. */
function pick(n, arr, exclude = []) {
  const ex = new Set(exclude);
  return shuffle(arr.filter((x) => !ex.has(x))).slice(0, n);
}

/** Construit la série de mini-jeux pour un métier. */
function buildRounds(job) {
  const rounds = [];
  const keyNames = job.keySkills.map((k) => k.name);
  const allSkills = [...new Set([...job.hard, ...job.soft])];

  // 1) Hard vs Soft (3 + 3)
  for (const name of pick(3, job.hard)) rounds.push({ kind: 'hardsoft', skill: name, answer: 'hard' });
  for (const name of pick(3, job.soft)) rounds.push({ kind: 'hardsoft', skill: name, answer: 'soft' });

  // 2) Compétence clé (jusqu'à 3)
  for (const ks of shuffle(job.keySkills).slice(0, 3)) {
    const distract = pick(3, allSkills, keyNames);
    if (distract.length < 3) continue;
    const options = shuffle([{ text: ks.name, correct: true }, ...distract.map((t) => ({ text: t, correct: false }))]);
    rounds.push({
      kind: 'mcq', prompt: 'Pour ce poste, laquelle est une compétence CLÉ aux yeux des recruteurs ?',
      options, explain: ks.why,
    });
  }

  // 3) Situation → compétence (jusqu'à 3)
  for (const s of shuffle(job.situations).slice(0, 3)) {
    const distract = pick(3, [...keyNames, ...allSkills], [s.skill]);
    if (distract.length < 3) continue;
    const options = shuffle([{ text: s.skill, correct: true }, ...distract.map((t) => ({ text: t, correct: false }))]);
    rounds.push({
      kind: 'mcq', context: s.situation,
      prompt: 'Quelle compétence cette situation mobilise-t-elle surtout ?',
      options, explain: `Ici, c'est avant tout « ${s.skill} » qui fait la différence.`,
    });
  }

  return shuffle(rounds);
}

export default function Jobs() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('browse'); // browse | fiche | play | done
  const [jobV, setJobV]   = useState(null);
  const [result, setResult] = useState(null);   // { score, total, xp }

  const bySector = useMemo(() => listJobsBySector(), []);
  const targetV  = useMemo(() => detectTargetJob(), []);
  const job = jobV ? getJob(jobV) : null;

  function openFiche(v) { setJobV(v); setPhase('fiche'); track('jobs_fiche_open', { job: v }); }

  if (phase === 'browse') {
    return <Browse bySector={bySector} targetV={targetV} onOpen={openFiche} onHome={() => navigate('/')} />;
  }
  if (phase === 'fiche' && job) {
    return (
      <Fiche job={job} isTarget={job.v === targetV}
        onBack={() => setPhase('browse')}
        onPlay={() => { setPhase('play'); track('jobs_game_start', { job: job.v }); }}
      />
    );
  }
  if (phase === 'play' && job) {
    return <Game job={job} onQuit={() => setPhase('fiche')}
      onDone={(res) => { setResult(res); setPhase('done'); }} />;
  }
  if (phase === 'done' && job) {
    return (
      <Done job={job} result={result}
        onReplay={() => setPhase('play')}
        onReview={() => setPhase('fiche')}
        onOther={() => setPhase('browse')}
        onCV={() => navigate('/generate')}
      />
    );
  }
  return null;
}

// ── PARCOURIR LES MÉTIERS ─────────────────────────────────────────────────────
function Browse({ bySector, targetV, onOpen, onHome }) {
  const totalXp = getTotalXp();
  const targetJob = targetV ? getJob(targetV) : null;
  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={onHome}>← Accueil</button>
          <span style={S.brandTag}>ALTIO · Métiers</span>
        </div>

        <div style={S.header}>
          <span style={S.eyebrow}>Comprendre les postes</span>
          <h1 style={S.h1}>Décrypte les métiers</h1>
          <p style={S.lead}>
            Chaque poste a ses codes. Découvre les compétences clés que les recruteurs
            recherchent vraiment — puis teste-toi de façon ludique.
          </p>
        </div>

        {totalXp > 0 && <div style={S.xpRow}><span style={S.xpPill}>⚡ {totalXp} XP</span></div>}

        {targetJob && (
          <button style={S.targetCard} onClick={() => onOpen(targetJob.v)}>
            <span style={S.targetEmoji}>{targetJob.emoji}</span>
            <div style={S.targetText}>
              <span style={S.targetKicker}>🎯 D'après ton CV, tu vises</span>
              <span style={S.targetLabel}>{targetJob.label}</span>
            </div>
            <span style={S.targetArrow}>→</span>
          </button>
        )}

        {Object.entries(bySector).map(([sector, jobs]) => (
          <div key={sector}>
            <div style={S.sectionLabel}>{sector}</div>
            <div style={S.grid}>
              {jobs.map((j) => (
                <button key={j.v} style={S.jobCard} onClick={() => onOpen(j.v)}>
                  <span style={S.jobEmoji}>{j.emoji}</span>
                  <span style={S.jobText}>
                    <span style={S.jobName}>{j.label}</span>
                    <span style={S.jobMeta}>{j.postes.length} débouché{j.postes.length > 1 ? 's' : ''} · {j.keySkills.length} compétences clés</span>
                  </span>
                  <span style={S.jobArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FICHE MÉTIER ──────────────────────────────────────────────────────────────
function Fiche({ job, isTarget, onBack, onPlay }) {
  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={onBack}>← Les métiers</button>
          {isTarget && <span style={S.targetBadge}>🎯 Ton poste visé</span>}
        </div>

        <div style={S.ficheHead}>
          <span style={S.ficheEmoji}>{job.emoji}</span>
          <div>
            <h1 style={S.ficheTitle}>{job.label}</h1>
            <span style={S.ficheSector}>{job.sector}{job.duration ? ` · ${job.duration}` : ''}</span>
          </div>
        </div>
        <p style={S.fichePitch}>{job.pitch}</p>

        {/* Compétences clés */}
        <div style={S.block}>
          <div style={S.blockTitle}>🔑 Compétences clés</div>
          {job.keySkills.map((k) => (
            <div key={k.name} style={S.keyRow}>
              <span style={S.keyName}>{k.name}</span>
              <span style={S.keyWhy}>{k.why}</span>
            </div>
          ))}
        </div>

        {/* Ce que le recruteur regarde */}
        <div style={{ ...S.block, ...S.blockGreen }}>
          <div style={{ ...S.blockTitle, color: C.green }}>👀 Ce que le recruteur regarde</div>
          <ul style={S.ul}>
            {job.recruiterLooksFor.map((r, i) => <li key={i} style={S.li}>{r}</li>)}
          </ul>
        </div>

        {/* Pièges */}
        <div style={{ ...S.block, ...S.blockRed }}>
          <div style={{ ...S.blockTitle, color: C.red }}>⚠️ Pièges à éviter</div>
          <ul style={S.ul}>
            {job.pitfalls.map((p, i) => <li key={i} style={S.li}>{p}</li>)}
          </ul>
        </div>

        {/* Débouchés */}
        <div style={S.block}>
          <div style={S.blockTitle}>💼 Postes débouchés</div>
          <div style={S.chips}>
            {job.postes.map((p) => <span key={p} style={S.chip}>{p}</span>)}
          </div>
        </div>

        <button style={S.cta} onClick={onPlay}>🎮 S'entraîner sur ce métier</button>
      </div>
    </div>
  );
}

// ── MINI-JEUX ─────────────────────────────────────────────────────────────────
function Game({ job, onQuit, onDone }) {
  const rounds = useMemo(() => buildRounds(job), [job.v]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null); // 'hard'|'soft' | option index | null
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);

  const r = rounds[idx];
  const answered = picked !== null;
  const progress = ((idx + (answered ? 1 : 0)) / rounds.length) * 100;

  function resolve(ok, pickVal) {
    setPicked(pickVal); setCorrect(ok);
    if (ok) { setScore((s) => s + 1); setXp((x) => x + XP_PER_CORRECT); addXp(XP_PER_CORRECT); }
  }
  function answerHardSoft(choice) { if (!answered) resolve(choice === r.answer, choice); }
  function answerMcq(i) { if (!answered) resolve(!!r.options[i].correct, i); }

  function next() {
    if (idx + 1 >= rounds.length) {
      track('jobs_game_done', { job: job.v, score, total: rounds.length, xp });
      onDone({ score, total: rounds.length, xp });
    } else { setIdx(idx + 1); setPicked(null); setCorrect(false); }
  }

  const explain = r.kind === 'hardsoft'
    ? (r.answer === 'hard'
        ? `« ${r.skill} » est un savoir-faire technique → Hard skill.`
        : `« ${r.skill} » est un trait comportemental → Soft skill.`)
    : r.explain;

  return (
    <div style={S.shell}>
      <style>{`@keyframes scenarioIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={onQuit}>← Quitter</button>
          <div style={S.hud}>
            <span style={S.xpPill}>⚡ {xp}</span>
            <span style={S.progText}>{idx + 1}/{rounds.length}</span>
          </div>
        </div>
        <div style={S.progBar}><div style={{ ...S.progFill, width: `${progress}%` }} /></div>

        <div key={idx} style={S.gameCard}>
          {r.kind === 'hardsoft' ? (
            <>
              <div style={S.gameKicker}>HARD SKILL ou SOFT SKILL ?</div>
              <div style={S.gameSkill}>{r.skill}</div>
              <div style={S.legend}>
                🧠 Hard = savoir-faire technique · 💬 Soft = savoir-être / comportement
              </div>
              <div style={S.hsRow}>
                {['hard', 'soft'].map((c) => {
                  let st = { ...S.hsBtn, ...(c === 'hard' ? S.hsHard : S.hsSoft) };
                  if (answered && c === r.answer) st = { ...st, ...S.optCorrect };
                  else if (answered && c === picked) st = { ...st, ...S.optWrong };
                  else if (answered) st = { ...st, opacity: 0.55 };
                  return (
                    <button key={c} style={st} onClick={() => answerHardSoft(c)} disabled={answered}>
                      <span style={{ fontSize: 22 }}>{c === 'hard' ? '🧠' : '💬'}</span>
                      {c === 'hard' ? 'Hard skill' : 'Soft skill'}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {r.context && (
                <>
                  <div style={S.scenarioHead}>
                    <span style={S.scenarioLine} />
                    <span style={S.scenarioLabel}>🎬 La situation</span>
                    <span style={S.scenarioLine} />
                  </div>
                  <div style={S.context}>{r.context}</div>
                </>
              )}
              <div style={S.gamePrompt}>{r.prompt}</div>
              <div style={S.options}>
                {r.options.map((o, i) => {
                  let st = S.opt;
                  if (answered && o.correct) st = { ...S.opt, ...S.optCorrect };
                  else if (answered && i === picked) st = { ...S.opt, ...S.optWrong };
                  else if (answered) st = { ...S.opt, opacity: 0.55 };
                  return (
                    <button key={i} style={st} onClick={() => answerMcq(i)} disabled={answered}>
                      <span style={{ flex: 1, textAlign: 'left' }}>{o.text}</span>
                      {answered && o.correct && <span style={S.mark}>✓</span>}
                      {answered && i === picked && !o.correct && <span style={S.markWrong}>✕</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {answered && (
            <div style={{ ...S.feedback, background: correct ? C.greenSoft : C.redSoft, borderColor: correct ? C.green : C.red }}>
              <div style={S.fbHead}>
                <span style={S.samAvatar}>🐺</span>
                <span style={S.samName}>Sam</span>
                <span style={{ ...S.fbVerdict, background: correct ? C.green : C.red }}>
                  {correct ? rand(PRAISE) : rand(NOPE)}
                </span>
              </div>
              <div style={S.fbText}>{explain}</div>
            </div>
          )}
        </div>

        {answered && (
          <button style={S.nextBtn} onClick={next}>
            {idx + 1 >= rounds.length ? 'Voir mon bilan →' : 'Suivant →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── BILAN ─────────────────────────────────────────────────────────────────────
const PASS_MARK = 12; // note minimale (/20) pour valider le métier

function Done({ job, result, onReplay, onReview, onOther, onCV }) {
  const { score = 0, total = 0, xp = 0 } = result || {};
  const note = total ? Math.round((score / total) * 20) : 0;
  const passed = note >= PASS_MARK;
  const accent = passed ? C.green : C.red;

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.doneHead}>
          <span style={S.ficheEmoji}>{passed ? '🏆' : '💪'}</span>
          <h1 style={S.ficheTitle}>{passed ? 'Métier validé !' : 'Pas encore validé'}</h1>
          <div style={S.noteBig}>
            <span style={{ color: accent }}>{note}</span>
            <span style={S.noteOutOf}>/20</span>
          </div>
          <p style={S.fichePitch}>{score}/{total} bonnes réponses · ⚡ {xp} XP gagnés</p>
          <div style={{ ...S.noteVerdict, background: passed ? C.greenSoft : C.redSoft, color: accent }}>
            {passed
              ? '✅ Bravo ! Tu maîtrises les compétences clés de ce poste.'
              : `Il faut au moins ${PASS_MARK}/20 pour valider ce métier. Retente le test pour débloquer la mise à jour du CV !`}
          </div>
        </div>

        {passed ? (
          <div style={{ ...S.block, ...S.blockBlue }}>
            <div style={{ ...S.blockTitle, color: C.blue }}>📝 À valoriser dans ton CV</div>
            <div style={S.chips}>
              {job.keySkills.map((k) => <span key={k.name} style={S.chipBlue}>{k.name}</span>)}
            </div>
            <button style={S.cta} onClick={onCV}>Mettre à jour mon CV →</button>
          </div>
        ) : (
          <button style={{ ...S.cta, background: accent, boxShadow: 'none' }} onClick={onReplay}>
            ↻ Recommencer le test
          </button>
        )}

        <div style={S.doneBtns}>
          {passed && <button style={S.ghostBtn} onClick={onReplay}>↻ Rejouer ce métier</button>}
          <button style={S.ghostBtn} onClick={onReview}>Revoir la fiche</button>
          <button style={S.ghostBtn} onClick={onOther}>Découvrir un autre métier</button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
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

  xpRow: { marginBottom: 18 },
  xpPill: { fontSize: 12, fontWeight: 800, color: C.blue, background: C.blueSoft, padding: '4px 10px', borderRadius: 99 },

  targetCard: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: C.ink, color: '#fff', border: 'none', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', fontFamily: FONT, marginBottom: 24, boxShadow: '0 10px 30px rgba(11,22,56,.18)' },
  targetEmoji: { fontSize: 28 },
  targetText: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  targetKicker: { fontSize: 11.5, color: '#9AA6C4', fontWeight: 700 },
  targetLabel: { fontSize: 15.5, fontWeight: 800, marginTop: 2 },
  targetArrow: { fontSize: 18, color: '#9AA6C4' },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '20px 0 11px' },
  grid: { display: 'grid', gap: 10 },
  jobCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 15px', cursor: 'pointer', fontFamily: FONT, textAlign: 'left' },
  jobEmoji: { fontSize: 24, flexShrink: 0 },
  jobText: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  jobName: { fontSize: 14.5, fontWeight: 700, color: C.ink, lineHeight: 1.2 },
  jobMeta: { fontSize: 11.5, color: C.mute, marginTop: 3 },
  jobArrow: { fontSize: 16, color: C.mute },

  // Fiche
  ficheHead: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 },
  ficheEmoji: { fontSize: 44 },
  ficheTitle: { fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: 0, lineHeight: 1.15 },
  ficheSector: { fontSize: 12.5, color: C.mute, fontWeight: 600 },
  fichePitch: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: '0 0 20px' },

  block: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: '16px 18px', marginBottom: 14 },
  blockGreen: { background: C.greenSoft, border: `1px solid ${C.green}22` },
  blockRed: { background: C.redSoft, border: `1px solid ${C.red}22` },
  blockBlue: { background: C.blueSoft, border: `1px solid ${C.blue}22` },
  blockTitle: { fontSize: 14, fontWeight: 800, marginBottom: 12 },
  keyRow: { display: 'flex', flexDirection: 'column', padding: '9px 0', borderBottom: `1px solid ${C.bg}` },
  keyName: { fontSize: 14, fontWeight: 700, color: C.ink },
  keyWhy: { fontSize: 12.5, color: C.ink2, marginTop: 2, lineHeight: 1.45 },
  ul: { margin: 0, paddingLeft: 18 },
  li: { fontSize: 13.5, color: C.ink2, lineHeight: 1.6, marginBottom: 4 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  chip: { fontSize: 12, fontWeight: 600, color: C.ink2, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 99, padding: '5px 11px' },
  chipBlue: { fontSize: 12, fontWeight: 700, color: C.blue, background: '#fff', border: `1px solid ${C.blue}33`, borderRadius: 99, padding: '5px 11px' },

  targetBadge: { fontSize: 11, fontWeight: 800, color: C.amber, background: '#FFF7E6', border: `1px solid ${C.amber}33`, borderRadius: 99, padding: '4px 10px' },

  cta: { width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, marginTop: 8, boxShadow: '0 8px 24px rgba(21,57,183,.22)' },

  // Jeu
  hud: { display: 'flex', alignItems: 'center', gap: 10 },
  progText: { fontSize: 12.5, fontWeight: 700, color: C.mute },
  progBar: { height: 8, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden', marginBottom: 14 },
  progFill: { height: '100%', background: C.blue, borderRadius: 99, transition: 'width .35s cubic-bezier(.16,.84,.24,1)' },
  gameCard: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, padding: '22px', boxShadow: '0 4px 20px rgba(11,22,56,.05)', animation: 'scenarioIn .4s cubic-bezier(.16,.84,.24,1) both' },
  scenarioHead: { display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0 14px' },
  scenarioLine: { flex: 1, height: 1, background: C.line },
  scenarioLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: C.blue, whiteSpace: 'nowrap' },
  gameKicker: { fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: C.mute, textAlign: 'center', marginBottom: 10 },
  gameSkill: { fontSize: 20, fontWeight: 800, color: C.ink, textAlign: 'center', lineHeight: 1.3, margin: '6px 0 14px' },
  legend: { fontSize: 11.5, color: C.mute, textAlign: 'center', marginBottom: 18, lineHeight: 1.5 },
  hsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  hsBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 12px', borderRadius: 14, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, border: '1.5px solid' },
  hsHard: { background: C.blueSoft, borderColor: C.blue + '44', color: C.hard },
  hsSoft: { background: C.softBg, borderColor: C.soft + '44', color: C.soft },

  gamePrompt: { fontSize: 16, fontWeight: 700, color: C.ink, textAlign: 'center', lineHeight: 1.35, margin: '4px 0 16px' },
  context: { background: '#F1F5FE', borderLeft: `4px solid ${C.blue}`, borderRadius: '0 12px 12px 0', padding: '15px 16px', fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.45, marginBottom: 16 },
  options: { display: 'grid', gap: 10 },
  opt: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: '#fff', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 14, fontWeight: 500, color: C.ink, cursor: 'pointer', fontFamily: FONT, transition: 'all .12s' },
  optCorrect: { borderColor: C.green, background: C.greenSoft, fontWeight: 700 },
  optWrong: { borderColor: C.red, background: C.redSoft },
  mark: { color: C.green, fontWeight: 800, fontSize: 16 },
  markWrong: { color: C.red, fontWeight: 800, fontSize: 16 },

  feedback: { marginTop: 16, border: '1.5px solid', borderRadius: 12, padding: '13px 15px' },
  fbHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 },
  samAvatar: { fontSize: 18, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 99, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  samName: { fontSize: 13, fontWeight: 800, color: C.ink, flex: 1 },
  fbVerdict: { fontSize: 10.5, fontWeight: 800, color: '#fff', padding: '3px 9px', borderRadius: 99 },
  fbText: { fontSize: 13.5, color: C.ink2, lineHeight: 1.5 },
  nextBtn: { width: '100%', marginTop: 16, background: C.ink, color: '#fff', border: 'none', borderRadius: 13, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  // Bilan
  doneHead: { textAlign: 'center', margin: '20px 0 24px' },
  noteBig: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, margin: '6px 0 4px', fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1 },
  noteOutOf: { fontSize: 22, fontWeight: 700, color: C.mute, marginLeft: 2 },
  noteVerdict: { fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, borderRadius: 12, padding: '12px 16px', maxWidth: 460, margin: '12px auto 0' },
  doneBtns: { display: 'grid', gap: 10, marginTop: 8 },
  ghostBtn: { background: '#fff', color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },
};
