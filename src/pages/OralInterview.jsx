/**
 * OralInterview — « Entretien à l'oral » (PRO).
 *
 * Le candidat répond À VOIX HAUTE à des questions ouvertes générées sur-mesure ;
 * la reconnaissance vocale transcrit, l'IA évalue le fond et la forme (structure,
 * pertinence, clarté) et une analyse locale mesure les tics de langage. Repli
 * clavier si la reconnaissance vocale n'est pas disponible.
 */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { C, FONT } from '@/lib/gameTheme';
import { useNavigate } from 'react-router-dom';
import {
  generateOralQuestions, evaluateOralAnswer, analyzeDelivery,
  computeOralNote, saveOralResult, PASS_MARK, DEFAULT_COUNT,
} from '@/lib/oralInterview';
import { CATEGORIES } from '@/lib/interviewCategories';
import { createRecognizer, isRecognitionSupported, speak, stopSpeaking, isSpeechSupported } from '@/lib/speech';
import { QuotaError } from '@/lib/claudeClient';
import { getHist } from '@/lib/cvData';
import { addXp, getTotalXp } from '@/lib/interviewProgress';
import { useEntitlements } from '@/hooks/useEntitlements';
import SamFeedback from '@/components/game/SamFeedback';
import { track } from '@/lib/monitoring';

const recSupported = isRecognitionSupported();
const ttsSupported = isSpeechSupported();

export default function OralInterview() {
  const navigate = useNavigate();
  const { proLocked: isFree } = useEntitlements();
  const latest = useMemo(() => { try { return getHist()[0] || null; } catch { return null; } }, []);
  const cvData = latest?.data || null;

  const [phase, setPhase] = useState('setup'); // setup | loading | play | done
  const [offer, setOffer] = useState('');
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [results, setResults] = useState([]); // {category, score}
  const [xp, setXp] = useState(0);
  const [error, setError] = useState(null);

  const recognizerRef = useRef(null);

  // Nettoyage : coupe micro + voix en quittant
  useEffect(() => () => {
    try { recognizerRef.current?.abort(); } catch { /* */ }
    stopSpeaking();
  }, []);

  const stopRecording = useCallback(() => {
    try { recognizerRef.current?.stop(); } catch { /* */ }
    setRecording(false);
  }, []);

  async function start() {
    if (!cvData || phase === 'loading') return;
    setPhase('loading'); setError(null);
    try {
      const qs = await generateOralQuestions({ cvData, offerText: offer, count: DEFAULT_COUNT });
      setQuestions(qs); setIdx(0); resetTurn(); setResults([]); setXp(0);
      setPhase('play');
      track('oral_start', { count: qs.length, hasOffer: !!offer.trim(), recSupported });
    } catch (e) {
      const type = e instanceof QuotaError ? 'quota' : 'error';
      setError({ type, message: e?.message || 'Une erreur est survenue. Réessaie.' });
      setPhase('setup');
    }
  }

  function resetTurn() {
    setTranscript(''); setEvalResult(null); setRecording(false);
  }

  function toggleRecording() {
    if (recording) { stopRecording(); return; }
    stopSpeaking();
    const rec = createRecognizer({
      onResult: (text) => setTranscript(text),
      onError: (err) => { setRecording(false); if (err === 'not-allowed') setError({ type: 'error', message: 'Micro refusé. Autorise le micro ou réponds au clavier.' }); },
    });
    recognizerRef.current = rec;
    rec.start();
    setRecording(true);
  }

  async function submitAnswer() {
    if (evaluating) return;
    stopRecording();
    const q = questions[idx];
    setEvaluating(true); setError(null);
    try {
      const evalR = await evaluateOralAnswer({ question: q.question, transcript, category: q.category, cvData });
      const gain = evalR.score * 5; // 0..50 XP
      setEvalResult(evalR);
      setResults((a) => [...a, { category: q.category, score: evalR.score }]);
      if (gain) { setXp((x) => x + gain); addXp(gain); }
      track('oral_answer', { idx, category: q.category, score: evalR.score });
    } catch (e) {
      const type = e instanceof QuotaError ? 'quota' : 'error';
      setError({ type, message: e?.message || 'Évaluation impossible. Réessaie.' });
    } finally {
      setEvaluating(false);
    }
  }

  function next() {
    if (idx + 1 >= questions.length) {
      const note = computeOralNote(results.map((r) => r.score));
      saveOralResult(note);
      track('oral_done', { total: questions.length, note, xp });
      setPhase('done');
    } else { setIdx(idx + 1); resetTurn(); }
  }

  // ── GATING ──────────────────────────────────────────────────────────────
  if (isFree) {
    return (
      <Shell onHome={() => navigate('/')}>
        <Header />
        <div style={S.upsell}>
          <div style={S.upsellBadge}>PRO</div>
          <div style={S.upsellTitle}>🔓 Réservé aux plans Personnel & Business</div>
          <div style={S.upsellText}>
            L'entretien à l'oral génère des questions sur-mesure et évalue tes réponses
            parlées. Passe à une offre supérieure pour t'entraîner comme en vrai.
          </div>
          <button style={S.cta} onClick={() => navigate('/pricing')}>Voir les offres</button>
        </div>
      </Shell>
    );
  }

  // ── SETUP / LOADING ─────────────────────────────────────────────────────
  if (phase === 'setup' || phase === 'loading') {
    const loading = phase === 'loading';
    const canStart = !!cvData && !loading;
    return (
      <Shell onHome={() => navigate('/')}>
        <Header />

        <div style={S.block}>
          <div style={S.blockLabel}>CV UTILISÉ</div>
          {cvData ? (
            <div style={S.cvRow}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.cvName}>{latest.name || 'Mon CV'}</div>
                <div style={S.cvMeta}>Dernier CV généré{latest.date ? ` · ${latest.date}` : ''}</div>
              </div>
            </div>
          ) : (
            <div style={S.empty}>Aucun CV trouvé. Génère d'abord un CV pour personnaliser ton oral.</div>
          )}
        </div>

        <div style={S.sectionLabel}>Offre visée (optionnel)</div>
        <textarea style={S.textarea} rows={4} value={offer} disabled={loading}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="Colle l'annonce pour des questions au plus proche du poste…" />

        <div style={{ ...S.infoBox, ...(recSupported ? {} : { background: C.amberSoft, borderColor: C.amber + '44' }) }}>
          {recSupported
            ? '🎙️ Tu répondras à voix haute : autorise le micro quand il te le demande. Tu peux aussi corriger la transcription au clavier.'
            : '⌨️ La reconnaissance vocale n\'est pas disponible sur ce navigateur (essaie Chrome). Tu pourras répondre au clavier, l\'IA évaluera ta réponse de la même façon.'}
        </div>

        {error && (
          <div style={{ ...S.err, background: error.type === 'quota' ? C.blueSoft : C.redSoft, color: error.type === 'quota' ? C.blue : C.red }}>
            <span>{error.type === 'quota' ? '⏳ ' : '⚠️ '}{error.message}</span>
            {error.type === 'quota' && <button style={S.errBtn} onClick={() => navigate('/pricing')}>Voir les offres</button>}
          </div>
        )}

        <button style={{ ...S.bigStart, opacity: canStart ? 1 : 0.6, cursor: canStart ? 'pointer' : 'not-allowed' }}
          onClick={start} disabled={!canStart}>
          {loading ? '✨ Préparation de ton entretien…' : `▶ Démarrer l'oral · ${DEFAULT_COUNT} questions`}
        </button>
        <p style={S.hint}>Questions générées sur-mesure depuis ton CV. Compte ~10 s.</p>
      </Shell>
    );
  }

  // ── DONE ────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return <Done results={results} questions={questions} xp={xp} onReplay={() => { resetTurn(); setPhase('setup'); }} onHome={() => navigate('/')} />;
  }

  // ── PLAY ────────────────────────────────────────────────────────────────
  const q = questions[idx];
  const meta = CATEGORIES[q.category] || { label: q.category, emoji: '🎤', color: C.blue };
  const answered = !!evalResult;
  const delivery = analyzeDelivery(transcript);
  const progress = ((idx + (answered ? 1 : 0)) / questions.length) * 100;
  const canSubmit = transcript.trim().length > 1 && !evaluating && !answered;

  return (
    <div style={S.shell}>
      <style>{`@keyframes oralIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(224,49,49,.45)}70%{box-shadow:0 0 0 16px rgba(224,49,49,0)}100%{box-shadow:0 0 0 0 rgba(224,49,49,0)}}`}</style>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={() => { stopRecording(); stopSpeaking(); setPhase('setup'); }}>← Quitter</button>
          <div style={S.hud}>
            <span style={S.xpPill}>⚡ {xp}</span>
            <span style={S.progText}>{idx + 1}/{questions.length}</span>
          </div>
        </div>
        <div style={S.progBar}><div style={{ ...S.progFill, width: `${progress}%` }} /></div>

        <div key={idx} style={S.card}>
          <div style={{ ...S.chip, background: meta.color + '18', color: meta.color }}>
            <span style={{ fontSize: 15 }}>{meta.emoji}</span> {meta.label}
          </div>

          <div style={S.question}>{q.question}</div>
          {ttsSupported && (
            <button style={S.ttsBtn} onClick={() => speak(q.question)}>🔊 Écouter la question</button>
          )}
          {q.hint && <div style={S.qHint}>🎯 {q.hint}</div>}

          {/* Micro */}
          {recSupported && !answered && (
            <div style={S.micWrap}>
              <button onClick={toggleRecording} disabled={evaluating}
                style={{ ...S.micBtn, ...(recording ? S.micBtnRec : {}) }}>
                {recording ? '⏹' : '🎙️'}
              </button>
              <div style={S.micLabel}>{recording ? 'Enregistrement… parle, puis arrête' : 'Appuie et réponds à voix haute'}</div>
            </div>
          )}

          {/* Transcription / saisie */}
          <textarea
            style={{ ...S.answerArea, ...(recording ? { borderColor: C.red } : {}) }}
            rows={5} value={transcript} disabled={evaluating || answered}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={recSupported ? 'Ta réponse apparaît ici — tu peux la corriger au clavier…' : 'Tape ta réponse comme si tu la disais à l\'oral…'}
          />
          {transcript.trim() && (
            <div style={S.deliveryRow}>
              <span>📝 {delivery.words} mots</span>
              <span style={{ color: delivery.fillers > 3 ? C.amber : C.mute }}>🗣️ {delivery.fillers} tic{delivery.fillers > 1 ? 's' : ''} de langage</span>
              {delivery.tooShort && <span style={{ color: C.amber }}>⚠️ réponse courte</span>}
            </div>
          )}

          {answered && (
            <SamFeedback
              tone={evalResult.score >= 7 ? 'good' : evalResult.score >= 4 ? 'mid' : 'bad'}
              verdict={`${evalResult.score}/10 · +${evalResult.score * 5} XP`}
            >
              {evalResult.verdict}
              {evalResult.strengths.length > 0 && (
                <div style={S.fbList}><b style={{ color: C.green }}>✓ Points forts</b>
                  <ul style={S.ul}>{evalResult.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {evalResult.improvements.length > 0 && (
                <div style={S.fbList}><b style={{ color: C.amber }}>↑ À améliorer</b>
                  <ul style={S.ul}>{evalResult.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {evalResult.model && (
                <div style={S.modelBox}><b>💬 Réponse modèle</b><div style={{ marginTop: 4 }}>{evalResult.model}</div></div>
              )}
            </SamFeedback>
          )}
        </div>

        {error && (
          <div style={{ ...S.err, background: error.type === 'quota' ? C.blueSoft : C.redSoft, color: error.type === 'quota' ? C.blue : C.red }}>
            <span>{error.type === 'quota' ? '⏳ ' : '⚠️ '}{error.message}</span>
          </div>
        )}

        {!answered ? (
          <button style={{ ...S.nextBtn, opacity: canSubmit ? 1 : 0.6, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
            onClick={submitAnswer} disabled={!canSubmit}>
            {evaluating ? '🤔 Le coach évalue ta réponse…' : 'Évaluer ma réponse →'}
          </button>
        ) : (
          <button style={S.nextBtn} onClick={next}>
            {idx + 1 >= questions.length ? 'Voir mon bilan →' : 'Question suivante →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function Shell({ children, onHome }) {
  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={onHome}>← Accueil</button>
          <span style={S.brandTag}>ALTIO · Oral</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div style={S.header}>
      <span style={S.eyebrow}>Entretien blanc · PRO ✨</span>
      <h1 style={S.h1}>Entretien à l'oral</h1>
      <p style={S.lead}>
        Réponds à voix haute à des questions générées depuis ton CV. Le coach évalue
        le fond, la structure et la clarté — comme un vrai entraînement.
      </p>
    </div>
  );
}

function Done({ results, questions, xp, onReplay, onHome }) {
  const navigate = useNavigate();
  const scores = results.map((r) => r.score);
  const note = computeOralNote(scores);
  const passed = note >= PASS_MARK;
  const accent = passed ? C.green : C.red;
  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={onHome}>← Accueil</button>
          <span style={S.xpPill}>⚡ {getTotalXp()} XP</span>
        </div>

        <div style={{ textAlign: 'center', margin: '12px 0 22px' }}>
          <div style={{ fontSize: 52 }}>{passed ? '🎤' : '💪'}</div>
          <div style={S.noteBig}><span style={{ color: accent }}>{note}</span><span style={S.noteOutOf}>/20</span></div>
          <p style={S.doneSub}>{results.length} réponses évaluées · ⚡ {xp} XP</p>
          <div style={{ ...S.verdict, background: passed ? C.greenSoft : C.redSoft, color: accent }}>
            {passed
              ? '✅ Bel oral — tu gagnes en aisance, continue !'
              : `Il faut au moins ${PASS_MARK}/20 — relance un oral pour t'améliorer.`}
          </div>
        </div>

        {results.length > 0 && (
          <>
            <div style={S.sectionLabel}>Tes réponses</div>
            <div style={S.block}>
              {results.map((r, i) => {
                const meta = CATEGORIES[r.category] || { label: r.category, emoji: '🎤' };
                const col = r.score >= 7 ? C.green : r.score >= 4 ? C.amber : C.red;
                return (
                  <div key={i} style={S.ansRow}>
                    <span style={{ fontSize: 15, width: 22 }}>{meta.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13, color: C.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {questions[i]?.question || meta.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: col }}>{r.score}/10</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ ...S.doneBtns, marginTop: 22 }}>
          <button style={S.bigStart} onClick={onReplay}>↻ Nouvel entretien</button>
          <button style={S.ghostBtn} onClick={() => navigate('/diagnostic')}>📊 Voir mon bilan</button>
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
  progText: { fontSize: 12.5, fontWeight: 700, color: C.mute },
  progBar: { height: 8, background: '#E3E8F2', borderRadius: 99, overflow: 'hidden', marginBottom: 12 },
  progFill: { height: '100%', background: C.blue, borderRadius: 99, transition: 'width .35s cubic-bezier(.16,.84,.24,1)' },

  header: { marginBottom: 18 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 12px' },
  lead: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 480 },

  block: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px' },
  blockLabel: { fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: C.mute, marginBottom: 10 },
  cvRow: { display: 'flex', alignItems: 'center', gap: 12 },
  cvName: { fontSize: 14.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cvMeta: { fontSize: 12, color: C.mute, marginTop: 2 },
  empty: { fontSize: 13.5, color: C.ink2, lineHeight: 1.5 },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '22px 0 11px' },
  textarea: { width: '100%', boxSizing: 'border-box', background: '#fff', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none', resize: 'vertical', lineHeight: 1.5 },
  infoBox: { background: C.blueSoft, border: `1px solid ${C.blue}22`, borderRadius: 12, padding: '12px 14px', fontSize: 13, color: C.ink2, lineHeight: 1.5, marginTop: 16 },

  bigStart: { width: '100%', marginTop: 18, background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.25)' },
  ghostBtn: { width: '100%', background: '#fff', color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },
  hint: { fontSize: 12, color: C.mute, lineHeight: 1.5, marginTop: 10, textAlign: 'center' },

  err: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, fontWeight: 600, marginTop: 16 },
  errBtn: { background: C.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' },

  upsell: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, padding: '24px 22px', textAlign: 'center', position: 'relative', marginTop: 8 },
  upsellBadge: { position: 'absolute', top: 16, right: 16, background: C.amberSoft, color: C.amber, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, letterSpacing: 0.5 },
  upsellTitle: { fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 8 },
  upsellText: { fontSize: 13.5, color: C.ink2, lineHeight: 1.6, marginBottom: 18, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' },
  cta: { background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  card: { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, padding: '20px 22px 24px', boxShadow: '0 4px 20px rgba(11,22,56,.05)', animation: 'oralIn .35s ease both' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 99 },
  question: { fontSize: 19, fontWeight: 800, color: C.ink, lineHeight: 1.35, letterSpacing: -0.3, margin: '16px 0 10px' },
  ttsBtn: { background: C.blueSoft, color: C.blue, border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  qHint: { fontSize: 12.5, color: C.ink2, lineHeight: 1.5, marginTop: 10, fontStyle: 'italic' },

  micWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, margin: '18px 0 14px' },
  micBtn: { width: 72, height: 72, borderRadius: '50%', border: 'none', background: C.blue, color: '#fff', fontSize: 30, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 8px 22px rgba(21,57,183,.3)' },
  micBtnRec: { background: C.red, animation: 'pulse 1.4s infinite' },
  micLabel: { fontSize: 12.5, color: C.ink2, fontWeight: 600 },

  answerArea: { width: '100%', boxSizing: 'border-box', background: '#FBFCFE', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none', resize: 'vertical', lineHeight: 1.55, marginTop: 6 },
  deliveryRow: { display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: C.mute, fontWeight: 600, marginTop: 8 },

  fbList: { marginTop: 8 },
  ul: { margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: C.ink2, lineHeight: 1.5 },
  modelBox: { marginTop: 10, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: C.ink, lineHeight: 1.5 },

  nextBtn: { width: '100%', marginTop: 16, background: C.ink, color: '#fff', border: 'none', borderRadius: 13, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  noteBig: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, margin: '6px 0 2px', fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1 },
  noteOutOf: { fontSize: 22, fontWeight: 700, color: C.mute, marginLeft: 2 },
  doneSub: { fontSize: 14, color: C.ink2, fontWeight: 600, margin: '8px 0 12px' },
  verdict: { fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, borderRadius: 12, padding: '12px 16px', maxWidth: 460, margin: '0 auto' },
  doneBtns: { display: 'grid', gap: 10, maxWidth: 420, margin: '0 auto' },
  ansRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' },
};
