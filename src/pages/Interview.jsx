/**
 * Interview — Jeu de simulation d'entretien (esprit Duolingo).
 *
 * 3 modes :
 *   - training : sans pression, feedback détaillé (pédagogie)
 *   - survival : 3 vies, une erreur coûte un cœur, fin anticipée à 0 ❤️
 *   - chrono   : 15 s par question, le temps écoulé = réponse manquée
 *
 * 3 typologies d'exercices (champ `kind` de la question) :
 *   - mcq        : scénario à choix multiples (Type A)
 *   - translator : « Traducteur Pro » — ordonner des blocs (Type B)
 *   - boss       : mise en situation à fort enjeu, XP majoré (Type C)
 *
 * Gamification : vies (cœurs), séries (streak 🔥), XP (+50/75/150 + combo),
 * barre de progression, série quotidienne (revenir demain). Le coach « Sam »
 * commente chaque réponse. Jeu gratuit (banque statique, zéro coût API).
 */
import React, { useState, useMemo, useEffect } from 'react';
import { C, FONT } from '@/lib/gameTheme';
import { useNavigate } from 'react-router-dom';
import {
  listSectors, listGroups, buildSession, buildDemoSession,
  groupOf, metaOf, groupMeta, xpFor, shuffle,
} from '@/lib/interviewBank';
import {
  getBest, saveResult, getOverallCompletion,
  addXp, getTotalXp, bumpDailyStreak, getDailyStreak,
} from '@/lib/interviewProgress';
import { generateInterviewSession } from '@/lib/interviewAI';
import { QuotaError } from '@/lib/claudeClient';
import { getHist } from '@/lib/cvData';
import { useEntitlements } from '@/hooks/useEntitlements';
import SamFeedback from '@/components/game/SamFeedback';
import { track } from '@/lib/monitoring';
// Mascotte (loup) retirée temporairement — sera rebranchée plus tard (asset Rive).

const SESSION_SIZE = 8;
const START_HEARTS  = 3;
const CHRONO_SECONDS = 15;
const COMBO_BONUS = 20; // XP bonus à partir d'une série de 3
const PASS_MARK = 12;   // note minimale (/20) pour valider la session

const MODES = {
  training: { label: 'Entraînement', emoji: '📚', desc: 'Sans pression — feedback détaillé pour apprendre.' },
  survival: { label: 'Survie',       emoji: '❤️', desc: '3 vies. Chaque erreur coûte un cœur. Jusqu\'où iras-tu ?' },
  chrono:   { label: 'Chrono',       emoji: '⏱️', desc: `${CHRONO_SECONDS} s par question. Réflexe et sang-froid !` },
};

const PRAISE  = ['Bravo !', 'En plein dans le mille !', 'Excellent !', 'Parfait 👌', 'Bien joué !'];
const CONSOLE = ['Pas grave, on apprend !', 'Aïe, presque !', 'Retiens le conseil 👇', 'La prochaine est pour toi !'];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

// Sentinelles de `picked` : null = en attente · -1 = temps écoulé · -2 = exercice Traducteur · 0..n = choix QCM.
const PICK_TIMEOUT = -1;
const PICK_TRANSLATOR = -2;

export default function Interview() {
  const navigate = useNavigate();
  const { proLocked } = useEntitlements();
  const [phase, setPhase]   = useState('intro'); // intro | ai | play | result
  const [mode, setMode]     = useState('training');
  const [session, setSession] = useState([]);
  const [idx, setIdx]       = useState(0);
  const [picked, setPicked] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [answers, setAnswers] = useState([]);    // { id, group, correct, kind }
  const [sector, setSector]   = useState('general');
  const [lastGroup, setLastGroup] = useState('all');
  const [isDemo, setIsDemo]   = useState(false);
  const [isAI, setIsAI]       = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState(null);

  const [hearts, setHearts] = useState(START_HEARTS);
  const [streak, setStreak] = useState(0);
  const [xp, setXp]         = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dead, setDead]     = useState(false);
  const [timeLeft, setTimeLeft] = useState(CHRONO_SECONDS);

  const [mood, setMood]     = useState('idle');
  const [msg, setMsg]       = useState(null);

  const sectors = useMemo(() => listSectors(), []);

  // Clé de progression : 'group' pour le tronc commun, 'secteur:group' sinon.
  const progKey = (sec, grp) => (sec === 'general' ? grp : `${sec}:${grp}`);

  function resetRun() {
    setIdx(0); setPicked(null); setWasCorrect(false); setAnswers([]);
    setHearts(START_HEARTS); setStreak(0); setXp(0); setDead(false);
    setTimeLeft(CHRONO_SECONDS); setMood('idle'); setMsg(null);
  }

  function start(group) {
    const s = buildSession({ sector, group, size: SESSION_SIZE });
    setSession(s); setLastGroup(group); setIsDemo(false); setIsAI(false);
    resetRun();
    setPhase('play');
    track('interview_session_start', { sector, group, size: s.length, mode });
  }

  /** Parcours guidé « Ton 1er entretien » — 3 étapes, en mode Survie (3 vies). */
  function startDemo() {
    const s = buildDemoSession();
    setSession(s); setLastGroup('demo'); setIsDemo(true); setIsAI(false);
    setMode('survival');
    resetRun();
    setPhase('play');
    track('interview_session_start', { sector: 'commerce', group: 'demo', size: s.length, mode: 'survival', demo: true });
  }

  /** Session personnalisée (PRO) : génère des questions via Claude depuis le CV + l'offre. */
  async function runAISession({ cvData, offerText }) {
    setAiLoading(true); setAiError(null);
    try {
      const s = await generateInterviewSession({ cvData, offerText, count: SESSION_SIZE });
      setSession(s); setLastGroup('ai'); setIsDemo(false); setIsAI(true);
      setSector('general'); setMode('training');
      resetRun();
      setPhase('play');
      track('interview_session_start', { sector: 'general', group: 'ai', size: s.length, mode: 'training', ai: true });
    } catch (err) {
      if (err instanceof QuotaError) {
        setAiError({ type: 'quota', message: 'Tu as atteint ton quota de sessions IA. Reviens plus tard ou passe à un plan supérieur.' });
      } else {
        setAiError({ type: 'error', message: err?.message || 'La génération a échoué. Réessaie dans un instant.' });
      }
      track('interview_ai_error', { message: err?.message, quota: err instanceof QuotaError });
    } finally {
      setAiLoading(false);
    }
  }

  /** Résout une réponse (commune QCM / Boss / Traducteur) : score, vies, XP, série. */
  function resolve(correct, pickedVal) {
    const q = session[idx];
    setPicked(pickedVal);
    setWasCorrect(correct);
    setAnswers((a) => [...a, { id: q.id, group: groupOf(q), correct, kind: q.kind || 'mcq' }]);

    if (correct) {
      const ns = streak + 1;
      setStreak(ns);
      const gain = xpFor(q) + (ns >= 3 ? COMBO_BONUS : 0);
      setXp((x) => x + gain);
      setMood(ns >= 3 ? 'fire' : 'happy');
      setMsg(ns >= 3 ? `Série de ${ns} 🔥  +${gain} XP` : `+${gain} XP — ${rand(PRAISE)}`);
    } else {
      setStreak(0);
      let ko = false;
      if (mode === 'survival') {
        const nh = Math.max(0, hearts - 1);
        setHearts(nh);
        if (nh === 0) { setDead(true); ko = true; }
      }
      setMood(ko ? 'ko' : 'sad');
      setMsg(ko ? '💥 Plus de vies !' : pickedVal === PICK_TIMEOUT ? '⏱️ Temps écoulé !' : rand(CONSOLE));
    }
  }

  function answer(optIdx) {
    if (picked !== null) return;
    const q = session[idx];
    const correct = optIdx >= 0 && !!q.options[optIdx].correct;
    resolve(correct, optIdx);
  }

  function next() {
    const finished = dead || idx + 1 >= session.length;
    if (!finished) {
      setIdx(idx + 1); setPicked(null); setWasCorrect(false);
      setTimeLeft(CHRONO_SECONDS); setMood('idle'); setMsg(null);
    } else {
      const score = answers.filter((a) => a.correct).length;
      const pct = Math.round((score / session.length) * 100);
      if (!isDemo && !isAI) saveResult(progKey(sector, lastGroup), pct);
      addXp(xp);
      const dayStreak = bumpDailyStreak();
      setDailyStreak(dayStreak);
      setPhase('result');
      track('interview_session_done', { score, total: session.length, sector, group: lastGroup, mode, dead, xp, demo: isDemo, ai: isAI });
    }
  }

  // ── Chrono : décrément 1s, déclenche un timeout (réponse manquée) à 0 ────────
  useEffect(() => {
    if (phase !== 'play' || mode !== 'chrono' || picked !== null) return;
    if (timeLeft <= 0) { resolve(false, PICK_TIMEOUT); return; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, mode, picked, timeLeft]);

  if (phase === 'intro') {
    return (
      <Intro
        sectors={sectors} sector={sector} setSector={setSector}
        mode={mode} setMode={setMode} progKey={progKey}
        onStart={start} onStartDemo={startDemo}
        onAISession={() => { setAiError(null); setPhase('ai'); }}
        onHome={() => navigate('/')}
      />
    );
  }
  if (phase === 'ai') {
    return (
      <AISetup
        isFree={proLocked} loading={aiLoading} error={aiError}
        onGenerate={runAISession}
        onUpsell={() => navigate('/pricing')}
        onBack={() => setPhase('intro')}
      />
    );
  }
  if (phase === 'result') {
    return (
      <Result
        answers={answers} total={session.length} mode={mode} dead={dead} sector={sector}
        xp={xp} hearts={hearts} dailyStreak={dailyStreak} isDemo={isDemo} isAI={isAI}
        onReplaySame={() => (isDemo ? startDemo() : isAI ? setPhase('ai') : start(lastGroup))}
        onReplay={() => setPhase('intro')}
        onHome={() => navigate('/')}
        onUpsell={() => (proLocked ? navigate('/pricing') : setPhase('ai'))}
      />
    );
  }

  // ── PHASE JEU ──────────────────────────────────────────────────────────────
  const q = session[idx];
  const isBoss = q.kind === 'boss';
  const isTranslator = q.kind === 'translator';
  const cat = metaOf(q);
  const correctIdx = q.options ? q.options.findIndex((o) => o.correct) : -1;
  const answered = picked !== null;
  const progress = ((idx + (answered ? 1 : 0)) / session.length) * 100;
  const timePct = (timeLeft / CHRONO_SECONDS) * 100;
  const positive = ['happy', 'fire', 'cheer'].includes(mood);

  return (
    <div style={S.shell}>
      <style>{`@keyframes scenarioIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.playWrap}>
        {/* HUD : quitter · vies/série/XP · n° question */}
        <div style={S.topRow}>
          <button style={S.quitBtn} onClick={() => setPhase('intro')}>← Quitter</button>
          <div style={S.hud}>
            {mode === 'survival' && (
              <span style={S.hearts}>
                {Array.from({ length: START_HEARTS }).map((_, i) => (
                  <span key={i} style={{ opacity: i < hearts ? 1 : 0.3 }}>{i < hearts ? '❤️' : '🤍'}</span>
                ))}
              </span>
            )}
            {streak >= 2 && <span style={S.streak}>🔥 {streak}</span>}
            <span style={S.xpPill}>⚡ {xp}</span>
            <span style={S.progText}>{idx + 1}/{session.length}</span>
          </div>
        </div>

        <div style={S.progBar}><div style={{ ...S.progFill, width: `${progress}%` }} /></div>

        {/* Chrono */}
        {mode === 'chrono' && !answered && (
          <div style={S.timerWrap}>
            <div style={S.timerBar}>
              <div style={{
                ...S.timerFill, width: `${timePct}%`,
                background: timeLeft <= 5 ? C.red : C.blue,
              }} />
            </div>
            <span style={{ ...S.timerNum, color: timeLeft <= 5 ? C.red : C.ink2 }}>{timeLeft}s</span>
          </div>
        )}

        {/* Pastille de réaction (encouragement / série / +XP) */}
        {answered && msg && (
          <div style={{
            ...S.reaction,
            background: positive ? C.greenSoft : C.redSoft,
            color: positive ? C.green : C.red,
          }}>
            {msg}
          </div>
        )}

        {/* Carte scénario */}
        <div style={{ ...S.card, ...(isBoss ? S.cardBoss : {}) }}>
          {isBoss ? (
            <div style={S.bossChip}>🔥 BOSS FINAL · {xpFor(q)} XP</div>
          ) : (
            <div style={{ ...S.catChip, background: cat.color + '18', color: cat.color }}>
              <span style={{ fontSize: 15 }}>{cat.emoji}</span> {cat.label}
              {isTranslator && <span style={S.kindTag}>Traducteur Pro</span>}
            </div>
          )}

          {/* Le scénario — réanimé à chaque question pour signaler clairement le nouveau texte */}
          <div key={idx} style={S.scenario}>
            <div style={S.scenarioHead}>
              <span style={S.scenarioLine} />
              <span style={S.scenarioLabel}>🎬 La mise en situation</span>
              <span style={S.scenarioLine} />
            </div>
            {q.context && <div style={S.context}>{q.context}</div>}
            <div style={S.situation}>{q.situation}</div>
          </div>

          <div style={S.questionRow}>
            <span style={S.questionLabel}>❓ À toi de jouer</span>
          </div>
          <div style={S.question}>{q.question}</div>

          {/* Corps de l'exercice : Traducteur Pro ou choix multiples */}
          {isTranslator ? (
            <Translator
              key={q.id} q={q} answered={answered} wasCorrect={wasCorrect}
              onSubmit={(ok) => resolve(ok, PICK_TRANSLATOR)}
            />
          ) : (
            <div style={S.options}>
              {q.options.map((opt, i) => {
                const isCorrect = i === correctIdx;
                const isPicked  = i === picked;
                let st = S.opt;
                if (answered && isCorrect)      st = { ...S.opt, ...S.optCorrect };
                else if (answered && isPicked)  st = { ...S.opt, ...S.optWrong };
                else if (answered)              st = { ...S.opt, opacity: 0.55 };
                return (
                  <button key={i} style={st} onClick={() => answer(i)} disabled={answered}>
                    <span style={S.optBullet}>{String.fromCharCode(65 + i)}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{opt.text}</span>
                    {answered && isCorrect && <span style={S.mark}>✓</span>}
                    {answered && isPicked && !isCorrect && <span style={S.markWrong}>✕</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback du coach Sam */}
          {answered && (
            <SamFeedback
              tone={wasCorrect ? 'good' : 'bad'}
              verdict={picked === PICK_TIMEOUT ? '⏱️ Trop tard' : wasCorrect ? 'Bonne réponse' : 'Pas tout à fait'}
              tip={q.tip}
            >
              {q.explanation}
            </SamFeedback>
          )}
        </div>

        {answered && (
          <button style={S.nextBtn} onClick={next}>
            {dead || idx + 1 >= session.length ? 'Voir mon résultat →' : 'Question suivante →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── EXERCICE « TRADUCTEUR PRO » (Type B) ──────────────────────────────────────
// Tap-to-order : on tape les blocs pour les placer dans la zone de réponse,
// re-tap pour les retirer. Bonne réponse = blocs dans l'ordre d'origine.
function Translator({ q, answered, wasCorrect, onSubmit }) {
  const order = useMemo(() => shuffle(q.blocks.map((_, i) => i)), [q.id]);
  const [placed, setPlaced] = useState([]);
  const remaining = order.filter((i) => !placed.includes(i));
  const allPlaced = placed.length === q.blocks.length;

  function submit() {
    const correct = allPlaced && placed.every((bi, pos) => bi === pos);
    onSubmit(correct);
  }

  return (
    <div>
      {/* Phrase familière à reformuler */}
      <div style={S.tCasual}>
        <span style={S.tCasualLabel}>À REFORMULER</span>
        « {q.casual} »
      </div>

      {/* Zone de réponse (blocs placés) */}
      <div style={{
        ...S.tZone,
        borderColor: answered ? (wasCorrect ? C.green : C.red) : C.line,
        background: answered ? (wasCorrect ? C.greenSoft : C.redSoft) : '#FBFCFE',
      }}>
        {placed.length === 0 && <span style={S.tPlaceholder}>Tape les blocs dans l'ordre…</span>}
        {placed.map((bi) => (
          <button key={bi} style={S.tBlockPlaced} onClick={() => !answered && setPlaced((p) => p.filter((x) => x !== bi))} disabled={answered}>
            {q.blocks[bi]}
          </button>
        ))}
      </div>

      {/* Réserve de blocs */}
      {!answered && (
        <div style={S.tPool}>
          {remaining.map((bi) => (
            <button key={bi} style={S.tBlock} onClick={() => setPlaced((p) => [...p, bi])}>
              {q.blocks[bi]}
            </button>
          ))}
        </div>
      )}

      {/* Bonne réponse révélée après validation */}
      {answered && (
        <div style={S.tTarget}>
          <span style={S.tTargetLabel}>VERSION PRO</span>
          {q.target}
        </div>
      )}

      {!answered && (
        <button
          style={{ ...S.tSubmit, opacity: allPlaced ? 1 : 0.5, cursor: allPlaced ? 'pointer' : 'not-allowed' }}
          onClick={submit} disabled={!allPlaced}
        >
          Valider ma reformulation
        </button>
      )}
    </div>
  );
}

// ── ÉCRAN INTRO ───────────────────────────────────────────────────────────────
function Intro({ sectors, sector, setSector, mode, setMode, progKey, onStart, onStartDemo, onAISession, onHome }) {
  const overall = getOverallCompletion();
  const totalXp = getTotalXp();
  const dayStreak = getDailyStreak();
  const groups = listGroups(sector);
  const isSectorView = sector !== 'general';
  const sectorMeta = sectors.find((s) => s.id === sector) || sectors[0];
  const hasProgress = overall > 0 || totalXp > 0;

  return (
    <div style={S.shell}>
      <div style={S.introWrapL}>
        {/* Barre du haut */}
        <div style={S.introTop}>
          <button style={S.backBtn} onClick={onHome}>← Accueil</button>
          <span style={S.brandTag}>ALTIO · Entraînement</span>
        </div>

        {/* En-tête éditorial (aligné à gauche) */}
        <div style={S.introHeader}>
          <span style={S.eyebrow}>Préparation aux entretiens</span>
          <h1 style={S.h1b}>Le simulateur d'entretien</h1>
          <p style={S.leadb}>
            Des situations réelles d'entretien, corrigées une par une par Sam, ton coach.
            Travaille tes réflexes — posture, langage, négociation — au fil des sessions.
          </p>
        </div>

        {/* Tableau de bord */}
        {hasProgress && (
          <div style={S.dash}>
            <div style={S.dashItem}>
              <div style={S.dashVal}>{overall}<span style={S.dashUnit}>%</span></div>
              <div style={S.dashLbl}>Progression</div>
            </div>
            <div style={S.dashDiv} />
            <div style={S.dashItem}>
              <div style={S.dashVal}>{totalXp}</div>
              <div style={S.dashLbl}>XP cumulés</div>
            </div>
            <div style={S.dashDiv} />
            <div style={S.dashItem}>
              <div style={S.dashVal}>{dayStreak}<span style={S.dashUnit}>{dayStreak > 0 ? ' 🔥' : ' j'}</span></div>
              <div style={S.dashLbl}>Série</div>
            </div>
          </div>
        )}

        {/* Démo guidée — carte premium sombre */}
        <button style={S.demoCta} onClick={onStartDemo}>
          <span style={S.demoBadge}>NOUVEAU</span>
          <div style={S.demoTextWrap}>
            <span style={S.demoTitle}>Parcours guidé — Ton premier entretien</span>
            <span style={S.demoSub}>3 étapes : l'arrivée · le Traducteur Pro · le test du stylo</span>
          </div>
          <span style={S.demoArrow}>→</span>
        </button>

        {/* Session personnalisée IA (PRO) */}
        <button style={S.aiCta} onClick={onAISession}>
          <span style={S.aiBadge}>PRO ✨</span>
          <div style={S.demoTextWrap}>
            <span style={S.aiTitle}>Session personnalisée par IA</span>
            <span style={S.aiSub}>Des questions générées depuis ton CV et l'offre visée</span>
          </div>
          <span style={S.aiArrow}>→</span>
        </button>

        {/* Secteur */}
        <div style={S.sectionLabel}>Choisis un domaine</div>
        <div style={S.sectorRow}>
          {sectors.map((s) => {
            const active = sector === s.id;
            return (
              <button key={s.id} onClick={() => setSector(s.id)}
                style={{ ...S.sectorChip, ...(active ? { borderColor: s.color, background: s.color + '14', color: s.color } : {}) }}>
                <span style={{ fontSize: 15 }}>{s.emoji}</span> {s.label}
              </button>
            );
          })}
        </div>

        {/* Mode de jeu */}
        <div style={S.sectionLabel}>Mode de jeu</div>
        <div style={S.modeRow}>
          {Object.entries(MODES).map(([id, m]) => {
            const active = mode === id;
            return (
              <button key={id} onClick={() => setMode(id)}
                style={{ ...S.modeCard, ...(active ? S.modeCardActive : {}) }}>
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{m.label}</span>
              </button>
            );
          })}
        </div>
        <p style={S.modeDesc}>{MODES[mode].desc}</p>

        {/* CTA principal */}
        <button style={S.bigStart} onClick={() => onStart('all')}>
          Lancer une session mixte
          <span style={S.bigStartSub}>{sectorMeta.emoji} {sectorMeta.label} · {SESSION_SIZE} questions</span>
        </button>

        {/* Thèmes */}
        <div style={S.sectionLabel}>
          {isSectorView ? 'Ou cible une couche' : 'Ou cible un thème'}
        </div>
        <div style={S.catGrid}>
          {groups.map((g) => {
            const best = getBest(progKey(sector, g.id));
            return (
              <button key={g.id} style={S.catCard} onClick={() => onStart(g.id)}>
                <span style={S.catEmoji}>{g.emoji}</span>
                <span style={S.catTextWrap}>
                  <span style={S.catName}>{g.label}</span>
                  <span style={S.catCount}>{g.count} question{g.count > 1 ? 's' : ''}</span>
                </span>
                {best > 0 && (
                  <span style={{ ...S.bestBadge, color: best >= 80 ? C.green : C.mute }}>
                    {best >= 80 ? '★' : ''} {best}%
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

// ── ÉCRAN CONFIG SESSION IA (PRO) ────────────────────────────────────────────
function AISetup({ isFree, loading, error, onGenerate, onUpsell, onBack }) {
  const hist = useMemo(() => { try { return getHist(); } catch { return []; } }, []);
  const latest = hist[0] || null;
  const cvData = latest?.data || null;
  const [offer, setOffer] = useState('');
  const canGenerate = !!cvData && !loading;

  return (
    <div style={S.shell}>
      <div style={S.introWrapL}>
        <div style={S.introTop}>
          <button style={S.backBtn} onClick={onBack}>← Retour</button>
          <span style={S.brandTag}>ALTIO · Session IA</span>
        </div>

        <div style={S.introHeader}>
          <span style={S.eyebrow}>Personnalisé · PRO ✨</span>
          <h1 style={S.h1b}>Ta session sur-mesure</h1>
          <p style={S.leadb}>
            L'IA génère des questions d'entretien à partir de ton CV et de l'offre visée :
            les questions probables pour CE poste, avec corrigés et pièges à éviter.
          </p>
        </div>

        {isFree ? (
          <div style={S.upsell}>
            <div style={S.upsellBadge}>PRO</div>
            <div style={S.upsellTitle}>🔓 Réservé aux plans Personnel & Business</div>
            <div style={S.upsellText}>
              Les sessions personnalisées par IA s'appuient sur ton propre CV.
              Passe à une offre supérieure pour t'entraîner sur TON entretien.
            </div>
            <button style={S.upsellBtn} onClick={onUpsell}>Voir les offres</button>
          </div>
        ) : (
          <>
            <div style={S.aiBlock}>
              <div style={S.aiBlockLabel}>CV UTILISÉ</div>
              {cvData ? (
                <div style={S.aiCvRow}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.aiCvName}>{latest.name || 'Mon CV'}</div>
                    <div style={S.aiCvMeta}>Dernier CV généré{latest.date ? ` · ${latest.date}` : ''}</div>
                  </div>
                </div>
              ) : (
                <div style={S.aiEmpty}>
                  Aucun CV trouvé. Génère d'abord un CV pour personnaliser ta session.
                </div>
              )}
            </div>

            <div style={S.sectionLabel}>Offre visée (optionnel)</div>
            <textarea
              style={S.aiTextarea}
              placeholder="Colle ici l'offre d'emploi (intitulé du poste, missions, compétences attendues)…"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              rows={6}
              disabled={loading}
            />

            {error && (
              <div style={{ ...S.aiError, background: error.type === 'quota' ? C.blueSoft : C.redSoft, color: error.type === 'quota' ? C.blue : C.red }}>
                <span>{error.type === 'quota' ? '⏳ ' : '⚠️ '}{error.message}</span>
                {error.type === 'quota' && <button style={S.aiErrorBtn} onClick={onUpsell}>Voir les offres</button>}
              </div>
            )}

            <button
              style={{ ...S.bigStart, opacity: canGenerate ? 1 : 0.6, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
              onClick={() => canGenerate && onGenerate({ cvData, cvName: latest?.name, offerText: offer })}
              disabled={!canGenerate}
            >
              {loading ? '✨ Génération en cours…' : `✨ Générer ma session (${SESSION_SIZE} questions)`}
            </button>
            <p style={S.aiHint}>Plus l'offre est détaillée, plus les questions seront ciblées.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── ÉCRAN RÉSULTATS ─────────────────────────────────────────────────────────
function Result({ answers, total, mode, dead, sector, xp, hearts, dailyStreak, isDemo, isAI, onReplaySame, onReplay, onHome, onUpsell }) {
  const score = answers.filter((a) => a.correct).length;
  const answered = answers.length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const note = total ? Math.round((score / total) * 20) : 0;
  const passed = !dead && note >= PASS_MARK;
  const showHearts = mode === 'survival';

  // Meilleure série de bonnes réponses
  let bestStreak = 0, cur = 0;
  answers.forEach((a) => { if (a.correct) { cur++; bestStreak = Math.max(bestStreak, cur); } else cur = 0; });

  const byCat = {};
  answers.forEach((a) => {
    byCat[a.group] = byCat[a.group] || { ok: 0, n: 0 };
    byCat[a.group].n++; if (a.correct) byCat[a.group].ok++;
  });

  let verdict, vColor, vEmoji;
  if (dead)            { verdict = `Entretien échoué ! Tu as tenu ${answered} question${answered > 1 ? 's' : ''}.`; vColor = C.red; vEmoji = '💥'; }
  else if (note >= 16) { verdict = 'Excellent — tu es prêt à convaincre !'; vColor = C.green; vEmoji = '🏆'; }
  else if (passed)     { verdict = 'Validé — de bons réflexes, continue comme ça !'; vColor = C.green; vEmoji = '👍'; }
  else                 { verdict = `Pas encore validé — il faut au moins ${PASS_MARK}/20.`; vColor = C.red; vEmoji = '💪'; }

  return (
    <div style={S.shell}>
      <div style={S.introWrap}>
        <div style={S.heroIcon}>{vEmoji}</div>
        <div style={S.noteBig}>
          <span style={{ color: vColor }}>{note}</span>
          <span style={S.noteOutOf}>/20</span>
        </div>
        <div style={S.resultSub}>{score}/{total} bonnes réponses</div>
        <div style={{ ...S.validBadge, background: passed ? C.greenSoft : C.redSoft, color: passed ? C.green : C.red }}>
          {passed ? '✅ Test validé' : `❌ Non validé · ${PASS_MARK}/20 requis`}
        </div>
        <div style={{ ...S.resultVerdict, color: vColor }}>{verdict}</div>

        <div style={S.scoreBarOuter}>
          <div style={{ ...S.scoreBarInner, width: `${pct}%`, background: vColor }} />
        </div>

        {/* Stats de partie */}
        <div style={S.statRow}>
          <div style={S.statBox}><div style={{ ...S.statVal, color: C.blue }}>⚡ {xp}</div><div style={S.statLbl}>XP gagnés</div></div>
          {showHearts
            ? <div style={S.statBox}><div style={S.statVal}>{'❤️'.repeat(hearts) || '💔'}</div><div style={S.statLbl}>vies restantes</div></div>
            : <div style={S.statBox}><div style={S.statVal}>{pct}%</div><div style={S.statLbl}>score</div></div>}
          <div style={S.statBox}><div style={S.statVal}>🔥 {bestStreak}</div><div style={S.statLbl}>meilleure série</div></div>
        </div>

        {/* Bilan par thème (une seule ligne agrégée en mode démo) */}
        <div style={S.catResults}>
          {isDemo ? (
            <div style={S.catResultRow}>
              <span style={{ fontSize: 16 }}>🛒</span>
              <span style={{ flex: 1, fontSize: 13, color: C.ink2 }}>Démo Commerce — 3 typologies</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: score === total ? C.green : C.ink }}>{score}/{total}</span>
            </div>
          ) : (
            Object.entries(byCat).map(([gid, r]) => {
              const meta = groupMeta(sector, gid) || { emoji: '•', label: gid };
              return (
                <div key={gid} style={S.catResultRow}>
                  <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, color: C.ink2 }}>{meta.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.ok === r.n ? C.green : C.ink }}>{r.ok}/{r.n}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Série quotidienne — incite à revenir demain */}
        <div style={S.streakCard}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={S.streakTitle}>Série du jour : {dailyStreak} jour{dailyStreak > 1 ? 's' : ''}</div>
            <div style={S.streakSub}>Reviens demain pour la garder en vie et gagner plus d'XP !</div>
          </div>
        </div>

        <div style={S.resultBtns}>
          <button
            style={passed ? S.bigStart : { ...S.bigStart, background: C.red, boxShadow: 'none' }}
            onClick={onReplaySame}
          >
            ↻ {passed ? `Rejouer${isDemo ? ' la démo' : isAI ? ' (nouvelle session IA)' : ''}` : 'Recommencer le test'}
          </button>
          <button style={S.ghostBtn} onClick={onReplay}>Changer de mode / thème</button>
          <button style={S.ghostBtn} onClick={onHome}>Retour à l'accueil</button>
        </div>

        {/* Upsell IA — masqué si la session jouée était déjà personnalisée */}
        {!isAI && (
          <div style={S.upsell}>
            <div style={S.upsellBadge}>PRO</div>
            <div style={S.upsellTitle}>🎯 Entraîne-toi sur TON entretien</div>
            <div style={S.upsellText}>
              Génère une session personnalisée à partir de ton CV et de l'offre visée :
              questions probables pour CE poste, réponses idéales, pièges à éviter.
            </div>
            <button style={S.upsellBtn} onClick={onUpsell}>Lancer une session personnalisée</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  introWrap: { maxWidth: 560, margin: '0 auto', textAlign: 'center' },
  introWrapL: { maxWidth: 600, margin: '0 auto', textAlign: 'left' },
  playWrap: { maxWidth: 600, margin: '0 auto' },

  // En-tête de l'accueil
  introTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },
  introHeader: { marginBottom: 22 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1b: { fontSize: 33, fontWeight: 800, letterSpacing: -1, lineHeight: 1.08, margin: '0 0 12px' },
  leadb: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 480 },

  // Tableau de bord
  dash: { display: 'flex', alignItems: 'stretch', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 8px', marginBottom: 20, boxShadow: '0 2px 12px rgba(11,22,56,.04)' },
  dashItem: { flex: 1, textAlign: 'center', padding: '0 6px' },
  dashVal: { fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.5 },
  dashUnit: { fontSize: 13, fontWeight: 700, color: C.mute },
  dashLbl: { fontSize: 11, color: C.mute, marginTop: 3, fontWeight: 600 },
  dashDiv: { width: 1, background: C.line, margin: '2px 0' },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '22px 0 11px' },

  // CTA Session IA (intro)
  aiCta: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: '#fff', border: `1.5px solid ${C.blue}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', fontFamily: FONT, marginBottom: 4, boxShadow: '0 6px 22px rgba(21,57,183,.1)' },
  aiBadge: { position: 'absolute', top: 14, right: 16, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, background: C.blue, color: '#fff', padding: '3px 8px', borderRadius: 6 },
  aiTitle: { fontSize: 15.5, fontWeight: 800, color: C.ink, paddingRight: 60 },
  aiSub: { fontSize: 12.5, color: C.ink2, marginTop: 4 },
  aiArrow: { fontSize: 18, color: C.blue, flexShrink: 0 },

  // Écran AISetup
  aiBlock: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 6 },
  aiBlockLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, color: C.mute, marginBottom: 8 },
  aiCvRow: { display: 'flex', alignItems: 'center', gap: 10 },
  aiCvName: { fontSize: 14.5, fontWeight: 700, color: C.ink },
  aiCvMeta: { fontSize: 12, color: C.mute, marginTop: 1 },
  aiEmpty: { fontSize: 13, color: C.ink2, lineHeight: 1.5 },
  aiTextarea: { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: FONT, color: C.ink, lineHeight: 1.5, resize: 'vertical', marginBottom: 14, outline: 'none' },
  aiError: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', fontSize: 13, fontWeight: 600, borderRadius: 12, padding: '11px 14px', marginBottom: 12, lineHeight: 1.45 },
  aiErrorBtn: { flexShrink: 0, background: C.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  aiHint: { fontSize: 12, color: C.mute, textAlign: 'center', marginTop: 10 },

  heroIcon: { fontSize: 56, marginTop: 24 },
  reaction: { textAlign: 'center', fontSize: 14, fontWeight: 800, padding: '8px 14px', borderRadius: 99, margin: '0 auto 14px', width: 'fit-content' },

  h1: { fontSize: 34, fontWeight: 800, letterSpacing: -0.8, margin: '8px 0 6px' },

  bigStart: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.25)' },
  bigStartSub: { fontSize: 12, fontWeight: 600, color: '#C9D4F5' },
  ghostBtn: { background: '#fff', color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },

  // Démo guidée (carte premium sombre)
  demoCta: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: C.ink, color: '#fff', border: 'none', borderRadius: 16, padding: '18px 18px', cursor: 'pointer', fontFamily: FONT, boxShadow: '0 10px 30px rgba(11,22,56,.18)' },
  demoBadge: { position: 'absolute', top: 14, right: 16, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, background: C.amber, color: C.ink, padding: '3px 8px', borderRadius: 6 },
  demoTextWrap: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  demoTitle: { fontSize: 15.5, fontWeight: 800, paddingRight: 70 },
  demoSub: { fontSize: 12.5, color: '#9AA6C4', marginTop: 4 },
  demoArrow: { fontSize: 18, color: '#9AA6C4', flexShrink: 0 },

  sectorRow: { display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 4 },
  sectorChip: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `1.5px solid ${C.line}`, borderRadius: 99, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, color: C.ink2, cursor: 'pointer', fontFamily: FONT, transition: 'all .12s' },

  modeRow: { display: 'flex', gap: 8, marginBottom: 8 },
  modeCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: '#fff', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '13px 8px', cursor: 'pointer', fontFamily: FONT, color: C.ink, transition: 'all .12s' },
  modeCardActive: { borderColor: C.blue, background: C.blueSoft, boxShadow: '0 0 0 3px rgba(21,57,183,.08)' },
  modeDesc: { fontSize: 12.5, color: C.ink2, minHeight: 18, margin: '0 0 20px' },

  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  catCard: { display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 13, padding: '13px 13px', cursor: 'pointer', fontFamily: FONT, textAlign: 'left', transition: 'border-color .15s, transform .1s' },
  catEmoji: { fontSize: 22, flexShrink: 0 },
  catTextWrap: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  catName: { fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.2 },
  catCount: { fontSize: 11, color: C.mute, marginTop: 2 },
  bestBadge: { fontSize: 11, fontWeight: 800, flexShrink: 0 },

  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  quitBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  hud: { display: 'flex', alignItems: 'center', gap: 10 },
  hearts: { fontSize: 15, letterSpacing: 1 },
  streak: { fontSize: 13, fontWeight: 800, color: C.amber },
  xpPill: { fontSize: 12, fontWeight: 800, color: C.blue, background: C.blueSoft, padding: '3px 9px', borderRadius: 99 },
  progText: { fontSize: 12.5, fontWeight: 700, color: C.mute },

  progBar: { height: 8, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden', marginBottom: 10 },
  progFill: { height: '100%', background: C.blue, borderRadius: 99, transition: 'width .35s cubic-bezier(.16,.84,.24,1)' },

  timerWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  timerBar: { flex: 1, height: 6, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 99, transition: 'width 1s linear' },
  timerNum: { fontSize: 13, fontWeight: 800, minWidth: 34, textAlign: 'right' },

  card: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, padding: '20px 22px 24px', boxShadow: '0 4px 20px rgba(11,22,56,.05)' },
  cardBoss: { border: `2px solid ${C.boss}`, boxShadow: '0 8px 30px rgba(112,72,232,.18)' },
  catChip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 99 },
  kindTag: { marginLeft: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.4, background: C.boss + '1A', color: C.boss, padding: '2px 7px', borderRadius: 6 },
  bossChip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, padding: '6px 13px', borderRadius: 99, background: C.bossSoft, color: C.boss },
  // Scénario / mise en situation — mis en avant + transition claire
  scenario: { animation: 'scenarioIn .4s cubic-bezier(.16,.84,.24,1) both' },
  scenarioHead: { display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' },
  scenarioLine: { flex: 1, height: 1, background: C.line },
  scenarioLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: C.blue, whiteSpace: 'nowrap' },
  context: { background: '#F1F5FE', borderLeft: `4px solid ${C.blue}`, borderRadius: '0 12px 12px 0', padding: '14px 16px', fontSize: 15.5, color: C.ink, lineHeight: 1.6, textAlign: 'left', marginBottom: 14 },
  situation: { fontSize: 20, fontWeight: 800, color: C.ink, lineHeight: 1.32, textAlign: 'center', letterSpacing: -0.3, margin: '4px 0 2px' },
  questionRow: { display: 'flex', justifyContent: 'center', margin: '18px 0 10px' },
  questionLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: C.mute },
  question: { fontSize: 15, fontWeight: 600, color: C.ink2, textAlign: 'center', marginBottom: 18 },

  options: { display: 'grid', gap: 10 },
  opt: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: '#fff', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 14, fontWeight: 500, color: C.ink, cursor: 'pointer', fontFamily: FONT, transition: 'all .12s' },
  optCorrect: { borderColor: C.green, background: C.greenSoft, fontWeight: 700 },
  optWrong: { borderColor: C.red, background: C.redSoft },
  optBullet: { width: 24, height: 24, borderRadius: 7, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.ink2, flexShrink: 0 },
  mark: { color: C.green, fontWeight: 800, fontSize: 16 },
  markWrong: { color: C.red, fontWeight: 800, fontSize: 16 },

  // Traducteur Pro
  tCasual: { position: 'relative', background: C.redSoft, border: `1px solid ${C.red}33`, borderRadius: 12, padding: '14px 14px 12px', fontSize: 14.5, fontStyle: 'italic', color: C.ink, lineHeight: 1.5, textAlign: 'left', marginBottom: 14 },
  tCasualLabel: { display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: C.red, marginBottom: 5, fontStyle: 'normal' },
  tZone: { display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 56, alignItems: 'center', border: '1.5px dashed', borderRadius: 12, padding: '12px', marginBottom: 12, transition: 'all .15s' },
  tPlaceholder: { fontSize: 13, color: C.mute, fontStyle: 'italic' },
  tPool: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, justifyContent: 'center' },
  tBlock: { background: '#fff', border: `1.5px solid ${C.blue}`, color: C.blue, borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 2px 6px rgba(21,57,183,.1)' },
  tBlockPlaced: { background: C.blue, border: `1.5px solid ${C.blue}`, color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  tTarget: { background: C.greenSoft, border: `1px solid ${C.green}33`, borderRadius: 12, padding: '12px 14px', fontSize: 14.5, fontWeight: 600, color: C.ink, textAlign: 'left', marginBottom: 4 },
  tTargetLabel: { display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: C.green, marginBottom: 5 },
  tSubmit: { width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, fontFamily: FONT },

  // Feedback coach Sam

  nextBtn: { width: '100%', marginTop: 16, background: C.ink, color: '#fff', border: 'none', borderRadius: 13, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  noteBig: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, margin: '6px 0 2px', fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1 },
  noteOutOf: { fontSize: 22, fontWeight: 700, color: C.mute, marginLeft: 2 },
  resultSub: { fontSize: 14, color: C.ink2, fontWeight: 600, marginBottom: 10 },
  validBadge: { display: 'inline-block', fontSize: 13, fontWeight: 800, padding: '6px 14px', borderRadius: 99, marginBottom: 12 },
  resultVerdict: { fontSize: 15.5, fontWeight: 700, marginBottom: 18 },
  scoreBarOuter: { height: 12, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden', maxWidth: 420, margin: '0 auto 20px' },
  scoreBarInner: { height: '100%', borderRadius: 99, transition: 'width .6s ease' },
  statRow: { display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 420, margin: '0 auto 18px' },
  statBox: { flex: 1, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 8px' },
  statVal: { fontSize: 18, fontWeight: 800, color: C.ink },
  statLbl: { fontSize: 11, color: C.mute, marginTop: 2 },
  catResults: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '8px 14px', maxWidth: 420, margin: '0 auto 14px' },
  catResultRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.bg}` },

  streakCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#FFF7E6', border: `1px solid ${C.amber}33`, borderRadius: 14, padding: '12px 16px', maxWidth: 420, margin: '0 auto 22px' },
  streakTitle: { fontSize: 14, fontWeight: 800, color: C.ink },
  streakSub: { fontSize: 12, color: C.ink2, marginTop: 1 },

  resultBtns: { display: 'grid', gap: 10, maxWidth: 420, margin: '0 auto 26px', justifyItems: 'center' },


  upsell: { position: 'relative', background: '#0B1638', color: '#fff', borderRadius: 16, padding: '22px 20px', maxWidth: 460, margin: '0 auto', textAlign: 'left' },
  upsellBadge: { position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, background: '#EEF2FF', color: C.blue, padding: '3px 9px', borderRadius: 6 },
  upsellTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  upsellText: { fontSize: 13, color: '#B9C2DA', lineHeight: 1.55, marginBottom: 16 },
  upsellBtn: { width: '100%', background: '#fff', color: C.ink, border: 'none', borderRadius: 11, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
};
