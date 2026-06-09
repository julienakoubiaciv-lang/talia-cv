/**
 * RecruitTest — « Test de recrutement » adaptatif (PRO).
 *
 * Reproduit les tests de présélection des recruteurs (aptitudes + métier +
 * mises en situation), générés sur-mesure par l'IA à partir de l'annonce, de
 * l'entreprise, du secteur d'activité et du CV du candidat. QCM noté /20.
 */
import React, { useState, useMemo } from 'react';
import { C, FONT } from '@/lib/gameTheme';
import { useNavigate } from 'react-router-dom';
import {
  generateRecruitTest, listTestCategories, TEST_CATEGORIES,
  computeTestScore, saveTestResult, PASS_MARK, DEFAULT_COUNT,
} from '@/lib/recruitTest';
import { listPostesBySector } from '@/lib/jobIntel';
import { QuotaError } from '@/lib/claudeClient';
import { getHist } from '@/lib/cvData';
import { addXp, getTotalXp } from '@/lib/interviewProgress';
import { useEntitlements } from '@/hooks/useEntitlements';
import SamFeedback from '@/components/game/SamFeedback';
import { track } from '@/lib/monitoring';

const XP_PER_CORRECT = 20;

export default function RecruitTest() {
  const navigate = useNavigate();
  const { proLocked: isFree } = useEntitlements();
  const latest = useMemo(() => { try { return getHist()[0] || null; } catch { return null; } }, []);
  const cvData = latest?.data || null;
  const postesBySector = useMemo(() => { try { return listPostesBySector(); } catch { return {}; } }, []);
  const sectors = useMemo(() => Object.keys(postesBySector), [postesBySector]);
  const categories = useMemo(() => listTestCategories(), []);

  const [phase, setPhase] = useState('setup'); // setup | loading | play | done
  // Ciblage
  const [company, setCompany]   = useState('');
  const [sector, setSector]     = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [offer, setOffer]       = useState('');
  const [cats, setCats] = useState(categories.map((c) => c.id)); // toutes par défaut
  // Jeu
  const [test, setTest] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [xp, setXp] = useState(0);
  const [error, setError] = useState(null);

  function toggleCat(id) {
    setCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function start() {
    if (!cvData || phase === 'loading' || !cats.length) return;
    setPhase('loading'); setError(null);
    try {
      const sectorLabel = sector;
      const t = await generateRecruitTest({
        cvData, offerText: offer, company, roleTitle, sectorLabel,
        categories: cats, count: DEFAULT_COUNT,
      });
      setTest(t); setIdx(0); setPicked(null); setAnswers([]); setXp(0);
      setPhase('play');
      track('recruit_test_start', { count: t.length, cats: cats.join(','), hasOffer: !!offer.trim(), sector });
    } catch (e) {
      const type = e instanceof QuotaError ? 'quota' : 'error';
      setError({ type, message: e?.message || 'Une erreur est survenue. Réessaie.' });
      setPhase('setup');
    }
  }

  function answer(optIdx) {
    if (picked !== null) return;
    const q = test[idx];
    const correct = !!q.options[optIdx].correct;
    setPicked(optIdx);
    setAnswers((a) => [...a, { category: q.category, correct }]);
    if (correct) { setXp((x) => x + XP_PER_CORRECT); addXp(XP_PER_CORRECT); }
  }

  function next() {
    if (idx + 1 >= test.length) {
      const { note } = computeTestScore(answers);
      saveTestResult(note);
      track('recruit_test_done', { total: test.length, note, xp });
      setPhase('done');
    } else { setIdx(idx + 1); setPicked(null); }
  }

  // ── GATING ────────────────────────────────────────────────────────────────
  if (isFree) {
    return (
      <Shell onHome={() => navigate('/')}>
        <Header />
        <div style={S.upsell}>
          <div style={S.upsellBadge}>PRO</div>
          <div style={S.upsellTitle}>🔓 Réservé aux plans Personnel & Business</div>
          <div style={S.upsellText}>
            Le test de recrutement s'adapte à ton CV et à l'offre visée. Passe à une
            offre supérieure pour t'entraîner dans les conditions réelles.
          </div>
          <button style={S.cta} onClick={() => navigate('/pricing')}>Voir les offres</button>
        </div>
      </Shell>
    );
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === 'setup' || phase === 'loading') {
    const loading = phase === 'loading';
    const canStart = !!cvData && cats.length > 0 && !loading;
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
            <div style={S.empty}>Aucun CV trouvé. Génère d'abord un CV pour adapter ton test.</div>
          )}
        </div>

        <div style={S.sectionLabel}>Cibler le test</div>
        <input style={S.input} value={company} disabled={loading}
          onChange={(e) => setCompany(e.target.value)} placeholder="Entreprise (optionnel)" />
        <select style={{ ...S.input, marginTop: 10, appearance: 'auto' }} value={sector} disabled={loading}
          onChange={(e) => setSector(e.target.value)}>
          <option value="">— Secteur d'activité (optionnel) —</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input style={{ ...S.input, marginTop: 10 }} value={roleTitle} disabled={loading}
          onChange={(e) => setRoleTitle(e.target.value)} placeholder="Poste visé (optionnel)" list="rt-postes" />
        <datalist id="rt-postes">
          {(postesBySector[sector] || []).map((p) => <option key={p} value={p} />)}
        </datalist>
        <textarea style={{ ...S.textarea, marginTop: 10 }} rows={4} value={offer} disabled={loading}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="Colle l'annonce pour un test au plus proche du poste (optionnel)…" />

        <div style={S.sectionLabel}>Épreuves</div>
        <div style={S.catGrid}>
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} disabled={loading} onClick={() => toggleCat(c.id)}
                style={{ ...S.catCard, ...(on ? { borderColor: c.color, background: c.color + '12' } : {}) }}>
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <span style={S.catLabel}>{c.label}</span>
                {c.adaptive && <span style={S.catTag}>adapté</span>}
                <span style={{ ...S.catCheck, ...(on ? { borderColor: c.color, background: c.color, color: '#fff' } : {}) }}>{on ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ ...S.err, background: error.type === 'quota' ? C.blueSoft : C.redSoft, color: error.type === 'quota' ? C.blue : C.red }}>
            <span>{error.type === 'quota' ? '⏳ ' : '⚠️ '}{error.message}</span>
            {error.type === 'quota' && <button style={S.errBtn} onClick={() => navigate('/pricing')}>Voir les offres</button>}
          </div>
        )}

        <button style={{ ...S.bigStart, opacity: canStart ? 1 : 0.6, cursor: canStart ? 'pointer' : 'not-allowed' }}
          onClick={start} disabled={!canStart}>
          {loading ? '✨ Génération de ton test…' : `▶ Lancer le test · ${DEFAULT_COUNT} questions`}
        </button>
        <p style={S.hint}>Le test est généré sur-mesure à partir de ton CV et de la cible. Compte ~15 s.</p>
      </Shell>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return <Done answers={answers} xp={xp} onReplay={() => setPhase('setup')} onHome={() => navigate('/')} />;
  }

  // ── PLAY ──────────────────────────────────────────────────────────────────
  const q = test[idx];
  const meta = TEST_CATEGORIES[q.category];
  const answered = picked !== null;
  const correctIdx = q.options.findIndex((o) => o.correct);
  const progress = ((idx + (answered ? 1 : 0)) / test.length) * 100;
  const isRight = answered && picked === correctIdx;

  return (
    <div style={S.shell}>
      <style>{`@keyframes rtIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={() => setPhase('setup')}>← Quitter</button>
          <div style={S.hud}>
            <span style={S.xpPill}>⚡ {xp}</span>
            <span style={S.progText}>{idx + 1}/{test.length}</span>
          </div>
        </div>
        <div style={S.progBar}><div style={{ ...S.progFill, width: `${progress}%` }} /></div>

        <div key={idx} style={S.card}>
          <div style={{ ...S.chip, background: meta.color + '18', color: meta.color }}>
            <span style={{ fontSize: 15 }}>{meta.emoji}</span> {meta.label}
          </div>

          <div style={S.question}>{q.question}</div>

          <div style={S.options}>
            {q.options.map((o, i) => {
              const isPicked = i === picked;
              let st = S.opt;
              if (answered && i === correctIdx) st = { ...S.opt, borderColor: C.green, background: C.greenSoft, fontWeight: 700 };
              else if (answered && isPicked) st = { ...S.opt, borderColor: C.red, background: C.redSoft };
              else if (answered) st = { ...S.opt, opacity: 0.5 };
              return (
                <button key={i} style={st} onClick={() => answer(i)} disabled={answered}>
                  <span style={{ flex: 1, textAlign: 'left' }}>{o.text}</span>
                  {answered && i === correctIdx && <span style={S.markGood}>✓</span>}
                  {answered && isPicked && i !== correctIdx && <span style={S.markBad}>✕</span>}
                </button>
              );
            })}
          </div>

          {answered && (
            <SamFeedback
              tone={isRight ? 'good' : 'bad'}
              verdict={isRight ? `Bonne réponse · +${XP_PER_CORRECT} XP` : 'Réponse incorrecte'}
            >
              {q.explanation}
              {!isRight && <div style={S.fbIdeal}>✓ Bonne réponse : {q.options[correctIdx].text}</div>}
            </SamFeedback>
          )}
        </div>

        {answered && (
          <button style={S.nextBtn} onClick={next}>
            {idx + 1 >= test.length ? 'Voir mon résultat →' : 'Question suivante →'}
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
          <span style={S.brandTag}>ALTIO · Recrutement</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div style={S.header}>
      <span style={S.eyebrow}>Présélection · PRO ✨</span>
      <h1 style={S.h1}>Test de recrutement</h1>
      <p style={S.lead}>
        Entraîne-toi sur un test sur-mesure : aptitudes, connaissances métier et
        mises en situation, adaptés à ton CV, à l'annonce et au secteur visé.
      </p>
    </div>
  );
}

function Done({ answers, xp, onReplay, onHome }) {
  const navigate = useNavigate();
  const { note, correct, total, byCategory } = computeTestScore(answers);
  const passed = note >= PASS_MARK;
  const accent = passed ? C.green : C.red;
  const rows = Object.entries(byCategory).map(([id, b]) => ({
    id, meta: TEST_CATEGORIES[id] || { label: id, emoji: '•', color: C.blue }, ...b,
    pct: b.total ? Math.round((b.correct / b.total) * 100) : 0,
  }));
  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={onHome}>← Accueil</button>
          <span style={S.xpPill}>⚡ {getTotalXp()} XP</span>
        </div>

        <div style={{ textAlign: 'center', margin: '12px 0 22px' }}>
          <div style={{ fontSize: 52 }}>{passed ? '🎉' : '💪'}</div>
          <div style={S.noteBig}><span style={{ color: accent }}>{note}</span><span style={S.noteOutOf}>/20</span></div>
          <p style={S.doneSub}>{correct}/{total} bonnes réponses · ⚡ {xp} XP</p>
          <div style={{ ...S.verdict, background: passed ? C.greenSoft : C.redSoft, color: accent }}>
            {passed
              ? '✅ Test réussi — tu es prêt pour les présélections !'
              : `Il faut au moins ${PASS_MARK}/20 — relance un test pour progresser.`}
          </div>
        </div>

        {rows.length > 0 && (
          <>
            <div style={S.sectionLabel}>Détail par épreuve</div>
            <div style={S.block}>
              {rows.map((r) => (
                <div key={r.id} style={S.pillarRow}>
                  <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>{r.meta.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.pillarTop}>
                      <span style={S.pillarLabel}>{r.meta.label}</span>
                      <span style={{ ...S.pillarScore, color: r.pct >= 50 ? C.green : C.red }}>{r.correct}/{r.total}</span>
                    </div>
                    <div style={S.pillarBar}><div style={{ ...S.pillarFill, width: `${r.pct}%`, background: r.pct >= 50 ? C.green : C.red }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ ...S.doneBtns, marginTop: 22 }}>
          <button style={S.bigStart} onClick={onReplay}>↻ Nouveau test</button>
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
  progBar: { height: 8, background: C.track, borderRadius: 99, overflow: 'hidden', marginBottom: 12 },
  progFill: { height: '100%', background: C.blue, borderRadius: 99, transition: 'width .35s cubic-bezier(.16,.84,.24,1)' },

  header: { marginBottom: 18 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 12px' },
  lead: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 480 },

  block: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px' },
  blockLabel: { fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: C.mute, marginBottom: 10 },
  cvRow: { display: 'flex', alignItems: 'center', gap: 12 },
  cvName: { fontSize: 14.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cvMeta: { fontSize: 12, color: C.mute, marginTop: 2 },
  empty: { fontSize: 13.5, color: C.ink2, lineHeight: 1.5 },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '22px 0 11px' },
  input: { width: '100%', boxSizing: 'border-box', background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14.5, color: C.ink, fontFamily: FONT, outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none', resize: 'vertical', lineHeight: 1.5 },

  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  catCard: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: '13px 14px', cursor: 'pointer', fontFamily: FONT, textAlign: 'left', transition: 'all .12s' },
  catLabel: { fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.25 },
  catTag: { fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.amber, background: C.amberSoft, padding: '2px 6px', borderRadius: 6 },
  catCheck: { position: 'absolute', top: 10, right: 10, width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${C.line}`, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 },

  bigStart: { width: '100%', marginTop: 18, background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.25)' },
  ghostBtn: { width: '100%', background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },
  hint: { fontSize: 12, color: C.mute, lineHeight: 1.5, marginTop: 10, textAlign: 'center' },

  err: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, fontWeight: 600, marginTop: 16 },
  errBtn: { background: C.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' },

  upsell: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '24px 22px', textAlign: 'center', position: 'relative', marginTop: 8 },
  upsellBadge: { position: 'absolute', top: 16, right: 16, background: C.amberSoft, color: C.amber, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, letterSpacing: 0.5 },
  upsellTitle: { fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 8 },
  upsellText: { fontSize: 13.5, color: C.ink2, lineHeight: 1.6, marginBottom: 18, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' },
  cta: { background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '20px 22px 24px', boxShadow: '0 4px 20px rgba(11,22,56,.05)', animation: 'rtIn .35s ease both' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 99 },
  question: { fontSize: 18, fontWeight: 800, color: C.ink, lineHeight: 1.4, letterSpacing: -0.3, margin: '16px 0 16px' },
  options: { display: 'grid', gap: 10 },
  opt: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 14, fontWeight: 500, color: C.ink, cursor: 'pointer', fontFamily: FONT, transition: 'all .12s', textAlign: 'left' },
  markGood: { color: C.green, fontWeight: 800, fontSize: 16 },
  markBad: { color: C.red, fontWeight: 800, fontSize: 16 },
  fbIdeal: { fontSize: 13, color: C.ink, fontWeight: 600, marginTop: 8, background: C.greenSoft, borderRadius: 8, padding: '8px 10px' },
  nextBtn: { width: '100%', marginTop: 16, background: C.ink, color: '#fff', border: 'none', borderRadius: 13, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  noteBig: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, margin: '6px 0 2px', fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1 },
  noteOutOf: { fontSize: 22, fontWeight: 700, color: C.mute, marginLeft: 2 },
  doneSub: { fontSize: 14, color: C.ink2, fontWeight: 600, margin: '8px 0 12px' },
  verdict: { fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, borderRadius: 12, padding: '12px 16px', maxWidth: 460, margin: '0 auto' },
  doneBtns: { display: 'grid', gap: 10, maxWidth: 420, margin: '0 auto' },

  pillarRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' },
  pillarTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  pillarLabel: { fontSize: 13.5, fontWeight: 600, color: C.ink },
  pillarScore: { fontSize: 12.5, fontWeight: 800 },
  pillarBar: { height: 7, background: C.track, borderRadius: 99, overflow: 'hidden' },
  pillarFill: { height: '100%', borderRadius: 99, transition: 'width .5s ease' },
};
