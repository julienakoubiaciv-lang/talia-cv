/**
 * studentProgress — Lecture de la progression d'un accompagné par l'encadrant.
 *
 * La fiche élève affichait un bilan par pilier FABRIQUÉ (scores dérivés du
 * score global par hachage). La vraie progression vit dans user_progress.data,
 * sous la forme des mêmes clés que le localStorage de l'élève.
 *
 * Ce module traduit ce blob en statistiques, puis réutilise `computeDiagnostic`
 * — l'algorithme déjà utilisé côté élève sur /diagnostic. Un pilier affiché au
 * coach vaut donc exactement ce que voit l'élève, sans seconde implémentation.
 */
import { computeDiagnostic } from './employability';
import { CATEGORIES } from './interviewCategories.js';
import { listJobs } from './jobIntel';

// Dénominateurs lus à la source : ajouter un thème ou un métier ne fausse pas
// silencieusement les pourcentages affichés au coach.
const INTERVIEW_THEMES = Object.keys(CATEGORIES).length;
const JOBS_TOTAL = listJobs().length;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Traduit un blob user_progress.data en statistiques d'employabilité.
 * Tolérant : une clé absente vaut zéro (l'élève n'a pas encore joué ce module).
 */
export function statsFromProgress(blob) {
  const d = blob && typeof blob === 'object' ? blob : {};

  const interview = d.altio_interview_progress || {};
  const themes = Object.values(interview).filter((t) => t && typeof t === 'object');
  const interviewOverall = themes.length
    ? Math.round(themes.reduce((s, t) => s + num(t.best), 0) / INTERVIEW_THEMES)
    : 0;

  const jobs = d.altio_jobs_progress || {};
  const jobsValidated = Object.values(jobs).filter((j) => j && j.validated).length;

  return {
    // Le contenu du CV n'est pas exposé à l'encadrant : on ne peut pas
    // recalculer un score ATS ici. Le compteur de CV est fourni à part
    // (student_cv_stats) et injecté par l'appelant.
    cvExists: false,
    cvAts: 0,
    interviewOverall,
    jobsValidated,
    jobsCovered: JOBS_TOTAL,
    codesBest: num((d.altio_codes_progress || {}).bestNote),
    lettersGenerated: num(d.altio_letters_count),
    oralBest: num((d.altio_oral_progress || {}).bestNote),
    recruitBest: num((d.altio_recruit_progress || {}).bestNote),
  };
}

/**
 * Bilan par pilier d'un accompagné, à partir de sa progression réelle.
 * @param {object} blob      user_progress.data
 * @param {object} [cvStats] { cv_count, last_cv_at } — le CV ne peut pas être
 *                           noté ici, mais son existence alimente le pilier CV.
 */
export function pillarsFromProgress(blob, cvStats) {
  const stats = statsFromProgress(blob);
  const cvCount = num(cvStats?.cv_count);
  if (cvCount > 0) {
    // Sans accès au contenu, on ne peut pas mesurer la qualité ATS : un CV
    // produit vaut un pilier « en bonne voie », pas un pilier plein. Mieux
    // vaut sous-estimer que d'afficher un score inventé.
    stats.cvExists = true;
    stats.cvAts = 60;
  }
  return computeDiagnostic(stats);
}

/** Détail par module, pour la fiche : ce qui a été travaillé, et où ça en est. */
export function moduleBreakdown(blob) {
  const d = blob && typeof blob === 'object' ? blob : {};
  const interview = d.altio_interview_progress || {};
  const themesPlayed = Object.values(interview).filter((t) => t && num(t.plays) > 0).length;
  const jobs = d.altio_jobs_progress || {};
  const codes = d.altio_codes_progress || {};
  const oral = d.altio_oral_progress || {};
  const recruit = d.altio_recruit_progress || {};

  return [
    { id: 'entretien', emoji: '🎤', label: 'Entretien écrit', done: themesPlayed, total: INTERVIEW_THEMES, unit: 'thèmes' },
    { id: 'metiers',   emoji: '🧭', label: 'Métiers décryptés', done: Object.values(jobs).filter((j) => j && j.validated).length, total: JOBS_TOTAL, unit: 'métiers' },
    { id: 'oral',      emoji: '🗣️', label: 'Entretien oral', note: num(oral.bestNote), plays: num(oral.plays) },
    { id: 'codes',     emoji: '🏢', label: 'Savoir-être', note: num(codes.bestNote), plays: num(codes.plays) },
    { id: 'tests',     emoji: '🧩', label: 'Tests de recrutement', note: num(recruit.bestNote), plays: num(recruit.plays) },
    { id: 'lettres',   emoji: '✉️', label: 'Lettres générées', count: num(d.altio_letters_count) },
  ];
}

/** Badges obtenus (altio_player.badges), pour la fiche. */
export function badgesFromProgress(blob) {
  const player = (blob && blob.altio_player) || {};
  const b = player.badges;
  if (Array.isArray(b)) return b;
  if (b && typeof b === 'object') return Object.keys(b).filter((k) => b[k]);
  return [];
}

/** L'accompagné a-t-il une progression enregistrée ? (sinon : jamais connecté) */
export function hasProgress(blob) {
  return !!blob && typeof blob === 'object' && Object.keys(blob).length > 0;
}
