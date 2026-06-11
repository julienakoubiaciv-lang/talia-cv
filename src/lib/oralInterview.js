/**
 * oralInterview — « Entretien à l'oral » : mock d'entretien à réponse parlée.
 *
 * Le simulateur d'entretien classique est un QCM ; ici le candidat RÉPOND À VOIX
 * HAUTE à des questions ouvertes (reconnaissance vocale), et l'IA évalue le fond
 * et la forme de sa réponse parlée : structure, pertinence, clarté, tics de langage.
 *
 * Génération + évaluation via l'Edge Function claude-proxy (action 'coach', déjà
 * gérée par le quota) → aucune modification serveur nécessaire.
 */
import { callClaude } from '@/lib/claudeClient';
import { cvDataToText } from '@/lib/cvFeedback';
import { shuffle } from '@/lib/interviewBank';
import { CATEGORIES } from '@/lib/interviewCategories';

const VALID_CATS = Object.keys(CATEGORIES);

export const PASS_MARK = 12;     // note /20 pour « valider » l'oral
export const DEFAULT_COUNT = 5;  // nombre de questions par défaut

/** Tics de langage français les plus courants à l'oral. */
export const FILLER_WORDS = [
  'euh', 'heu', 'hum', 'ben', 'bah', 'bin', 'du coup', 'en fait', 'genre',
  'voilà', 'tu vois', 'vous voyez', 'quoi', 'enfin', 'disons', 'comment dire',
];

// ── Génération des questions ─────────────────────────────────────────────────

const GEN_SYSTEM = `Tu es un recruteur qui fait passer un entretien ORAL à un candidat.
À partir de son CV et, si fournie, de l'offre visée, génère des questions OUVERTES
(auxquelles on répond à voix haute, pas des QCM), réalistes et variées.

RÈGLES STRICTES :
- Réponds UNIQUEMENT par un tableau JSON valide, sans texte autour, sans Markdown.
- Chaque élément a EXACTEMENT cette forme :
  {
    "category": "<une de: ${VALID_CATS.join(', ')}>",
    "question": "la question posée à l'oral par le recruteur",
    "hint": "ce que le recruteur cherche à évaluer / un conseil pour bien répondre (1 phrase)"
  }
- Questions ouvertes uniquement (jamais de 'oui/non', jamais de choix multiples).
- Personnalise vraiment à partir du parcours, des compétences et du poste visé.
- Commence par une question de présentation, puis varie les thèmes.
- Français, ton professionnel et bienveillant.`;

/** Normalise la sortie brute de génération en questions jouables (pur, testable). */
export function normalizeOralQuestions(raw, count = DEFAULT_COUNT) {
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.questions) ? raw.questions : []);
  const out = [];
  arr.forEach((q, i) => {
    if (!q || typeof q !== 'object') return;
    const question = String(q.question || '').trim();
    if (question.length < 8) return;
    const category = VALID_CATS.includes(q.category) ? q.category : 'presentation';
    const hint = String(q.hint || '').trim();
    out.push({ id: `oral-${Date.now()}-${i}`, category, question, hint });
  });
  return out.slice(0, count);
}

/** Génère une série de questions d'entretien oral via Claude. */
export async function generateOralQuestions({ cvData, offerText = '', count = DEFAULT_COUNT }) {
  const cvText = cvDataToText(cvData);
  if (!cvText.trim()) {
    throw new Error('CV vide : génère ou sélectionne d\'abord un CV avant de lancer un oral.');
  }
  const offer = (offerText || '').trim();
  const userContent =
    `POSTE / OFFRE VISÉE :\n${offer ? offer.slice(0, 4000) : '(non précisée — déduis le poste le plus probable du CV)'}\n\n` +
    `CV DU CANDIDAT :\n${cvText}\n\n` +
    `Génère ${count} questions d'entretien oral pour ce candidat.`;

  const res = await callClaude({
    action: 'coach', model: 'claude-haiku-4-5', max_tokens: 1500,
    system: GEN_SYSTEM,
    messages: [{ role: 'user', content: userContent }],
    metadata: { feature: 'oral_interview_gen', hasOffer: !!offer, count },
  });

  const parsed = parseJsonLoose((res?.content || []).map((b) => b.text || '').join(''));
  const qs = normalizeOralQuestions(parsed, count);
  if (!qs.length) throw new Error('La génération n\'a produit aucune question exploitable. Réessaie.');
  return qs;
}

// ── Évaluation d'une réponse parlée ──────────────────────────────────────────

const EVAL_SYSTEM = `Tu es un coach d'entretien bienveillant et exigeant. Tu évalues la
réponse ORALE (transcrite) d'un candidat à une question d'entretien.

La transcription vient d'une reconnaissance vocale : ignore la ponctuation/casse
imparfaite et les hésitations transcrites, juge le FOND et la STRUCTURE.

RÈGLES STRICTES :
- Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, sans Markdown :
  {
    "score": <entier 0 à 10>,
    "verdict": "<une phrase de synthèse>",
    "strengths": ["point fort 1", "point fort 2"],
    "improvements": ["axe d'amélioration 1", "axe 2"],
    "model": "une reformulation modèle, concise, à la 1re personne (2-4 phrases)"
  }
- "score" : 0-3 réponse faible/hors-sujet, 4-6 correcte mais perfectible, 7-8 bonne, 9-10 excellente.
- 1 à 3 éléments par liste, concrets et actionnables. Pas de remplissage.
- Évalue la méthode STAR quand c'est pertinent (situation, tâche, action, résultat).
- Si la réponse est vide ou quasi vide, score 0 et explique quoi dire.
- Français, ton encourageant mais honnête.`;

/** Normalise la sortie d'évaluation (pur, testable). */
export function normalizeEvaluation(raw) {
  const o = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  let score = Number(o.score);
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(10, Math.round(score)));
  const list = (v) => (Array.isArray(v) ? v : [])
    .map((s) => String(s).trim()).filter(Boolean).slice(0, 3);
  return {
    score,
    verdict: String(o.verdict || '').trim() || (score >= 7 ? 'Bonne réponse.' : 'Réponse à retravailler.'),
    strengths: list(o.strengths),
    improvements: list(o.improvements),
    model: String(o.model || '').trim(),
  };
}

/** Évalue une réponse orale (transcription) via Claude. */
export async function evaluateOralAnswer({ question, transcript, category = '', cvData = null }) {
  const answer = String(transcript || '').trim();
  if (answer.length < 2) {
    return normalizeEvaluation({ score: 0, verdict: 'Aucune réponse captée.', improvements: ['Reprends et formule une réponse structurée à voix haute.'] });
  }
  const cvText = cvData ? cvDataToText(cvData).slice(0, 1500) : '';
  const userContent =
    `QUESTION POSÉE :\n${question}\n\n` +
    (category ? `THÈME : ${CATEGORIES[category]?.label || category}\n\n` : '') +
    (cvText ? `EXTRAIT DU CV (pour juger la pertinence) :\n${cvText}\n\n` : '') +
    `RÉPONSE ORALE DU CANDIDAT (transcription) :\n${answer.slice(0, 3000)}\n\n` +
    `Évalue cette réponse.`;

  const res = await callClaude({
    action: 'coach', model: 'claude-haiku-4-5', max_tokens: 900,
    system: EVAL_SYSTEM,
    messages: [{ role: 'user', content: userContent }],
    metadata: { feature: 'oral_interview_eval', category, answerLength: answer.length },
  });

  return normalizeEvaluation(parseJsonLoose((res?.content || []).map((b) => b.text || '').join('')));
}

// ── Analyse de la diction (pur, local, sans IA) ──────────────────────────────

/**
 * Analyse objective de la transcription : nombre de mots et tics de langage.
 * @param {string} transcript
 * @returns {{ words:number, fillers:number, fillerRate:number, tooShort:boolean }}
 */
export function analyzeDelivery(transcript) {
  const text = String(transcript || '').toLowerCase();
  const words = (text.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
  let fillers = 0;
  for (const f of FILLER_WORDS) {
    const re = new RegExp(`(^|[^\\p{L}])${escapeRe(f)}([^\\p{L}]|$)`, 'gu');
    const m = text.match(re);
    if (m) fillers += m.length;
  }
  const fillerRate = words ? Math.round((fillers / words) * 1000) / 10 : 0; // %
  return { words, fillers, fillerRate, tooShort: words < 20 };
}

// ── Score global ─────────────────────────────────────────────────────────────

/**
 * Note /20 à partir des scores /10 de chaque réponse.
 * @param {number[]} scores - scores 0..10
 */
export function computeOralNote(scores = []) {
  if (!scores.length) return 0;
  const avg = scores.reduce((s, n) => s + (Number(n) || 0), 0) / scores.length; // /10
  return Math.round(avg * 2); // /20
}

// ── Persistance de la meilleure note /20 ─────────────────────────────────────
const LS_ORAL = 'altio_oral_progress';

/** Enregistre le résultat d'un oral (meilleure note conservée). */
export function saveOralResult(note) {
  try {
    const prev = JSON.parse(localStorage.getItem(LS_ORAL) || '{}');
    const n = Math.max(0, Math.min(20, Math.round(note || 0)));
    const data = { bestNote: Math.max(prev.bestNote || 0, n), plays: (prev.plays || 0) + 1 };
    localStorage.setItem(LS_ORAL, JSON.stringify(data));
    return data;
  } catch { return null; }
}

/** Meilleure note /20 obtenue à l'oral (0 si jamais joué). */
export function getOralBest() {
  try { return JSON.parse(localStorage.getItem(LS_ORAL) || '{}').bestNote || 0; }
  catch { return 0; }
}

// ── Helpers internes ─────────────────────────────────────────────────────────

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function parseJsonLoose(text) {
  let t = String(text || '').trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch { /* continue */ }
  const a = t.indexOf('['), b = t.lastIndexOf(']');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* continue */ } }
  const o = t.indexOf('{'), c = t.lastIndexOf('}');
  if (o >= 0 && c > o) { try { return JSON.parse(t.slice(o, c + 1)); } catch { /* continue */ } }
  throw new Error('Réponse de l\'IA illisible. Réessaie dans un instant.');
}
