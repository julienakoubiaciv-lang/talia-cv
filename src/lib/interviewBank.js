/**
 * interviewBank — Banque de scénarios d'entretien (jeu gratuit, zéro coût API).
 *
 * Format "code de la route" : une situation, une question, 3-4 options,
 * une seule bonne réponse, une explication pédagogique. `context` (optionnel)
 * = mise en situation immersive.
 *
 * Organisation : un fichier par thème dans ./interview/ (rédigés par lots).
 * Les thèmes non encore étoffés à 30 restent définis inline ci-dessous en
 * attendant leur lot dédié.
 */
import presentationQuestions from './interview/presentation.js';
import motivationQuestions   from './interview/motivation.js';
import parcoursQuestions     from './interview/parcours.js';
import faiblessesQuestions   from './interview/faiblesses.js';
import entrepriseQuestions   from './interview/entreprise.js';
import salaireQuestions      from './interview/salaire.js';
import postureQuestions      from './interview/posture.js';
import clotureQuestions      from './interview/cloture.js';
import commerceQuestions     from './interview/commerce.js';
import adminQuestions        from './interview/admin.js';
import rhQuestions           from './interview/rh.js';
import marketingQuestions    from './interview/marketing.js';
import financeQuestions      from './interview/finance.js';
import demoQuestions         from './interview/commerceDemo.js';
import { CATEGORIES, SECTORS, TYPES } from './interviewCategories.js';

// Re-export pour compat : les modules qui importaient ces métadonnées depuis
// interviewBank continuent de fonctionner.
export { CATEGORIES, SECTORS, TYPES };

/**
 * XP gagnée par bonne réponse, selon la typologie d'exercice (`kind`).
 *   - mcq        : choix multiple standard
 *   - translator : « Traducteur Pro » (ordonner des blocs)
 *   - boss       : mise en situation à fort enjeu (fin de parcours)
 */
export const XP_BY_KIND = { mcq: 50, translator: 75, boss: 150 };

/** XP d'une question (défaut : barème mcq). */
export function xpFor(q) {
  return XP_BY_KIND[q?.kind] ?? XP_BY_KIND.mcq;
}

// Tronc commun comportemental → secteur 'general' (rubrique = thème comportemental).
const GENERAL_QUESTIONS = [
  ...presentationQuestions,
  ...motivationQuestions,
  ...parcoursQuestions,
  ...faiblessesQuestions,
  ...entrepriseQuestions,
  ...salaireQuestions,
  ...postureQuestions,
  ...clotureQuestions,
].map((q) => ({ sector: 'general', ...q }));

export const QUESTIONS = [
  ...GENERAL_QUESTIONS,
  ...commerceQuestions,
  ...adminQuestions,
  ...rhQuestions,
  ...marketingQuestions,
  ...financeQuestions,
];

/**
 * Rubrique d'une question : pour 'general' = thème comportemental (q.category) ;
 * pour un secteur métier = type de question (q.type).
 */
export function groupOf(q) {
  return q.sector === 'general' ? q.category : q.type;
}

/** Métadonnées d'affichage (label/emoji/color) d'une question selon sa rubrique. */
export function metaOf(q) {
  return q.sector === 'general' ? CATEGORIES[q.category] : TYPES[q.type];
}

/** Métadonnées d'une rubrique à partir de son id + secteur. */
export function groupMeta(sector, groupId) {
  return sector === 'general' ? CATEGORIES[groupId] : TYPES[groupId];
}

/** Mélange (Fisher-Yates) sans muter l'entrée. */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Secteurs disponibles (avec nb de questions). */
export function listSectors() {
  return Object.entries(SECTORS).map(([id, meta]) => ({
    id, ...meta,
    count: QUESTIONS.filter((q) => q.sector === id).length,
  })).filter((s) => s.count > 0);
}

/** Rubriques d'un secteur (thèmes pour 'general', types sinon), avec compteurs. */
export function listGroups(sector) {
  const pool = QUESTIONS.filter((q) => q.sector === sector);
  const map = sector === 'general' ? CATEGORIES : TYPES;
  return Object.entries(map).map(([id, meta]) => ({
    id, ...meta,
    count: pool.filter((q) => groupOf(q) === id).length,
  })).filter((g) => g.count > 0);
}

/** Compat : thèmes comportementaux du tronc commun. */
export function listCategories() {
  return listGroups('general');
}

/**
 * Construit une session de jeu.
 * @param {object} [opts]
 * @param {string} [opts.sector] - secteur ('general' par défaut)
 * @param {string} [opts.group]  - rubrique ('all' = mix du secteur)
 * @param {number} [opts.size]   - nombre de questions (défaut 8)
 * @returns {Array} questions, options mélangées, prêtes à jouer
 */
export function buildSession({ sector = 'general', group = 'all', size = 8 } = {}) {
  let pool = QUESTIONS.filter((q) => q.sector === sector);
  if (group !== 'all') pool = pool.filter((q) => groupOf(q) === group);
  pool = shuffle(pool).slice(0, size);
  // Mélange aussi l'ordre des options pour éviter la mémorisation de position.
  return pool.map((q) => ({ ...q, options: shuffle(q.options) }));
}

/**
 * Parcours guidé « Ton 1er entretien » : les 3 étapes de la démo Commerce,
 * dans un ordre FIXE (la progression narrative compte), illustrant les 3
 * typologies d'exercices (QCM, Traducteur Pro, Boss).
 * Les options des QCM/Boss sont mélangées ; les blocs du Traducteur sont
 * mélangés au moment de l'affichage (côté composant).
 */
export function buildDemoSession() {
  return demoQuestions.map((q) =>
    q.options ? { ...q, options: shuffle(q.options) } : { ...q },
  );
}
