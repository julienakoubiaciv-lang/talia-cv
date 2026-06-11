/**
 * recruitTest — « Test de recrutement » adaptatif, généré par Claude.
 *
 * Reproduit les tests que font passer les recruteurs (aptitudes + connaissances
 * métier + mises en situation), mais SUR-MESURE : le test s'adapte à l'annonce,
 * à l'entreprise, au CV du candidat et au secteur d'activité visé.
 *
 * Chaque question est un QCM à 4 options (1 seule correcte) avec explication.
 * Passe par l'Edge Function claude-proxy via l'action 'coach' (déjà gérée par le
 * quota côté serveur) → aucune modification serveur nécessaire.
 */
import { callClaude } from '@/lib/claudeClient';
import { cvDataToText } from '@/lib/cvFeedback';
import { shuffle } from '@/lib/interviewBank';

/** Catégories d'épreuves d'un test de recrutement. */
export const TEST_CATEGORIES = {
  logique:   { label: 'Raisonnement logique', emoji: '🧩', color: '#1539B7', adaptive: false,
    hint: 'Suites, analogies, déductions — aptitude logique générale.' },
  numerique: { label: 'Aptitude numérique',   emoji: '🔢', color: '#0CA678', adaptive: false,
    hint: 'Pourcentages, proportions, lecture de données chiffrées.' },
  verbal:    { label: 'Compréhension verbale', emoji: '📖', color: '#7048E8', adaptive: false,
    hint: 'Vocabulaire, compréhension d\'un texte, orthographe pro.' },
  metier:    { label: 'Connaissances métier',  emoji: '🛠️', color: '#E8590C', adaptive: true,
    hint: 'Questions ciblées sur le poste, le secteur et l\'annonce.' },
  situation: { label: 'Mise en situation pro', emoji: '🎯', color: '#1098AD', adaptive: true,
    hint: 'Cas concrets du quotidien du poste : la meilleure décision.' },
};

export const PASS_MARK = 12;     // note /20 pour « réussir » le test
export const DEFAULT_COUNT = 10; // nombre de questions par défaut

const VALID_CATS = Object.keys(TEST_CATEGORIES);

/** Liste des catégories pour un picker UI. */
export function listTestCategories() {
  return VALID_CATS.map((id) => ({ id, ...TEST_CATEGORIES[id] }));
}

/**
 * Décrit la cible du test pour le prompt (fonction pure, testable).
 * Combine annonce, entreprise, intitulé et/ou secteur d'activité.
 */
export function describeTestTarget({ offerText = '', company = '', roleTitle = '', sectorLabel = '' } = {}) {
  const lines = [];
  if (String(company).trim())    lines.push(`Entreprise : ${String(company).trim()}`);
  if (String(roleTitle).trim())  lines.push(`Poste visé : ${String(roleTitle).trim()}`);
  if (String(sectorLabel).trim()) lines.push(`Secteur d'activité : ${String(sectorLabel).trim()}`);
  const offer = String(offerText).trim();
  if (offer) lines.push(`Annonce :\n${offer.slice(0, 4000)}`);
  return lines.length ? lines.join('\n') : '(cible non précisée — déduis le poste le plus probable à partir du CV)';
}

function systemFor(cats) {
  const wanted = (cats && cats.length ? cats : VALID_CATS).filter((c) => VALID_CATS.includes(c));
  const catList = wanted.map((c) => `${c} (${TEST_CATEGORIES[c].label})`).join(', ');
  return `Tu es un psychologue du travail qui conçoit un TEST DE RECRUTEMENT sur-mesure.
À partir de l'annonce, de l'entreprise, du secteur et du CV du candidat, génère un test
réaliste, comme ceux que les recruteurs font passer en présélection.

CATÉGORIES À COUVRIR (réparties équilibrées) : ${catList}.

ADAPTATION (essentiel) :
- "metier" et "situation" : ANCRE-les dans le poste, le secteur et l'annonce fournis
  (vocabulaire, outils, gestes professionnels, cas concrets du quotidien du poste).
- "logique", "numerique", "verbal" : aptitudes générales, mais habille les énoncés
  avec un contexte professionnel proche du métier visé quand c'est naturel.
- Calibre la difficulté sur le niveau du poste déduit du CV (débutant/alternant → confirmé).

RÈGLES STRICTES :
- Réponds UNIQUEMENT par un tableau JSON valide, sans texte autour, sans Markdown.
- Chaque élément a EXACTEMENT cette forme :
  {
    "category": "<une de: ${VALID_CATS.join(', ')}>",
    "difficulty": 1|2|3,
    "question": "l'énoncé complet de la question (auto-suffisant)",
    "options": [
      {"text": "...", "correct": true},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false}
    ],
    "explanation": "pourquoi la bonne réponse est correcte (1-2 phrases pédagogiques)"
  }
- EXACTEMENT 4 options, une SEULE avec "correct": true.
- Pour "numerique"/"logique" : une seule réponse objectivement juste, vérifiable.
- Les distracteurs doivent être plausibles (erreurs fréquentes), jamais absurdes.
- Français impeccable, sans fautes. Pas de question hors-sujet ni piège déloyal.`;
}

/**
 * Valide et normalise la sortie brute de Claude en questions jouables.
 * Tolérante : ignore les questions mal formées plutôt que tout rejeter.
 * @param {any} raw - tableau (ou {questions:[...]}) renvoyé par l'IA
 * @param {number} count - nombre max de questions à conserver
 * @returns {Array} questions normalisées
 */
export function normalizeRecruitTest(raw, count = DEFAULT_COUNT) {
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.questions) ? raw.questions : []);
  const out = [];

  arr.forEach((q, i) => {
    if (!q || typeof q !== 'object') return;

    let options = (Array.isArray(q.options) ? q.options : [])
      .filter((o) => o && typeof o.text === 'string' && o.text.trim())
      .map((o) => ({ text: o.text.trim(), correct: !!o.correct }));

    // Dédup
    const seen = new Set();
    options = options.filter((o) => {
      const k = o.text.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (options.length > 4) options = options.slice(0, 4);
    if (options.length < 3) return;
    if (options.filter((o) => o.correct).length !== 1) return;

    const question = String(q.question || q.situation || '').trim();
    const explanation = String(q.explanation || '').trim();
    if (!question || explanation.length < 8) return;

    const category = VALID_CATS.includes(q.category) ? q.category : 'metier';
    const difficulty = [1, 2, 3].includes(q.difficulty) ? q.difficulty : 2;

    out.push({
      id: `rt-${Date.now()}-${i}`,
      category, difficulty, question, explanation,
      options: shuffle(options),
    });
  });

  return out.slice(0, count);
}

/**
 * Note /20 et détail par catégorie à partir des réponses.
 * @param {Array<{category:string, correct:boolean}>} answers
 * @returns {{ correct:number, total:number, note:number, byCategory:Object }}
 */
export function computeTestScore(answers = []) {
  const total = answers.length;
  const correct = answers.filter((a) => a && a.correct).length;
  const note = total ? Math.round((correct / total) * 20) : 0;

  const byCategory = {};
  for (const a of answers) {
    if (!a || !a.category) continue;
    const b = byCategory[a.category] || (byCategory[a.category] = { correct: 0, total: 0 });
    b.total += 1;
    if (a.correct) b.correct += 1;
  }
  return { correct, total, note, byCategory };
}

/**
 * Génère un test de recrutement adaptatif via Claude.
 * @param {object} opts
 * @param {object} opts.cvData
 * @param {string} [opts.offerText]   - annonce collée
 * @param {string} [opts.company]
 * @param {string} [opts.roleTitle]
 * @param {string} [opts.sectorLabel] - libellé du secteur d'activité
 * @param {string[]} [opts.categories]- catégories à couvrir (défaut : toutes)
 * @param {number} [opts.count]       - nombre de questions (défaut 10)
 * @returns {Promise<Array>} questions jouables
 * @throws {Error|QuotaError|ClaudeProxyError}
 */
export async function generateRecruitTest({
  cvData, offerText = '', company = '', roleTitle = '', sectorLabel = '',
  categories = [], count = DEFAULT_COUNT,
}) {
  const cvText = cvDataToText(cvData);
  if (!cvText.trim()) {
    throw new Error('CV vide : génère ou sélectionne d\'abord un CV avant de lancer un test.');
  }

  const target = describeTestTarget({ offerText, company, roleTitle, sectorLabel });
  const userContent =
    `CIBLE DU RECRUTEMENT :\n${target}\n\n` +
    `CV DU CANDIDAT :\n${cvText}\n\n` +
    `Génère ${count} questions de test de recrutement adaptées à cette cible et à ce profil.`;

  const res = await callClaude({
    action: 'coach',
    model: 'claude-haiku-4-5',
    max_tokens: 4000,
    system: systemFor(categories),
    messages: [{ role: 'user', content: userContent }],
    metadata: {
      feature: 'recruit_test', count,
      hasOffer: !!String(offerText).trim(),
      hasSector: !!String(sectorLabel).trim(),
      hasCompany: !!String(company).trim(),
      categories: (categories || []).join(','),
    },
  });

  let text = (res?.content || []).map((b) => b.text || '').join('').trim();
  text = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const a = text.indexOf('['), b = text.lastIndexOf(']');
    if (a >= 0 && b > a) {
      parsed = JSON.parse(text.slice(a, b + 1));
    } else {
      const o = text.indexOf('{'), c = text.lastIndexOf('}');
      if (o >= 0 && c > o) parsed = JSON.parse(text.slice(o, c + 1));
      else throw new Error('Réponse de l\'IA illisible. Réessaie dans un instant.');
    }
  }

  const test = normalizeRecruitTest(parsed, count);
  if (!test.length) {
    throw new Error('La génération n\'a produit aucune question exploitable. Réessaie.');
  }
  return test;
}

// ── Persistance de la meilleure note /20 ──────────────────────────────────────
const LS_TEST = 'altio_recruit_progress';

/** Enregistre le résultat d'un test (meilleure note conservée). */
export function saveTestResult(note) {
  try {
    const prev = JSON.parse(localStorage.getItem(LS_TEST) || '{}');
    const n = Math.max(0, Math.min(20, Math.round(note || 0)));
    const data = { bestNote: Math.max(prev.bestNote || 0, n), plays: (prev.plays || 0) + 1 };
    localStorage.setItem(LS_TEST, JSON.stringify(data));
    return data;
  } catch { return null; }
}

/** Meilleure note /20 obtenue au test (0 si jamais joué). */
export function getTestBest() {
  try { return JSON.parse(localStorage.getItem(LS_TEST) || '{}').bestNote || 0; }
  catch { return 0; }
}
