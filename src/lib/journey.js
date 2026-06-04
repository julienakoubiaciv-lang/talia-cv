/**
 * journey — Parcours gamifié unifié « Ton chemin vers l'emploi ».
 *
 * Agrège la progression de toutes les briques (CV, métiers, entretien) en :
 *   - un niveau global basé sur l'XP cumulée,
 *   - des étapes (steps) du parcours candidat avec statut/avancement,
 *   - des badges débloqués.
 *
 * `computeJourney(stats)` est pur (testable) ; `getJourney()` lit les stores.
 */
import { getHist } from '@/lib/cvData';
import {
  getOverallCompletion, getTotalXp, getDailyStreak, getThemesPlayed, getProgress,
} from '@/lib/interviewProgress';
import { getValidatedJobs, getJobsPlayed } from '@/lib/jobsProgress';

const INTERVIEW_PASS_PCT = 60; // 12/20 → un thème est « validé » à 60 %

/** Paliers de niveau selon l'XP cumulée (du plus haut au plus bas pour lookup). */
export const LEVELS = [
  { min: 0,    label: 'Débutant',  emoji: '🌱' },
  { min: 200,  label: 'Apprenti',  emoji: '📘' },
  { min: 600,  label: 'Confirmé',  emoji: '⚡' },
  { min: 1200, label: 'Pro',       emoji: '🏆' },
  { min: 2500, label: 'Expert',    emoji: '👑' },
];

/** Niveau (et progression vers le suivant) pour une XP donnée. */
export function levelForXp(xp = 0) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const span = next ? next.min - current.min : 1;
  const into = next ? xp - current.min : 1;
  const progress = next ? Math.max(0, Math.min(100, Math.round((into / span) * 100))) : 100;
  return { ...current, index: idx, next, progress, toNext: next ? Math.max(0, next.min - xp) : 0 };
}

/**
 * Construit le parcours à partir de statistiques déjà collectées (fonction pure).
 * @param {object} s
 * @param {number} s.cvCount         - nb de CV créés
 * @param {number} s.overall         - % de complétion entretien (tronc commun)
 * @param {number} s.themesPlayed    - nb de thèmes d'entretien joués
 * @param {number} s.validatedThemes - nb de thèmes entretien validés (≥60 %)
 * @param {number} s.jobsPlayed      - nb de métiers tentés
 * @param {number} s.jobsValidated   - nb de métiers validés
 * @param {number} s.xp              - XP cumulée
 * @param {number} s.streak          - série quotidienne
 */
export function computeJourney(s) {
  const {
    cvCount = 0, overall = 0, themesPlayed = 0, validatedThemes = 0,
    jobsPlayed = 0, jobsValidated = 0, xp = 0, streak = 0,
  } = s || {};

  const level = levelForXp(xp);

  const steps = [
    {
      id: 'cv', emoji: '📄', title: 'Crée ton CV',
      desc: cvCount > 0 ? `${cvCount} CV créé${cvCount > 1 ? 's' : ''}` : 'Génère ton premier CV',
      done: cvCount > 0, cta: '/generate', ctaLabel: cvCount > 0 ? 'Mes CV' : 'Créer mon CV',
    },
    {
      id: 'metier', emoji: '🧭', title: 'Décrypte ton métier',
      desc: jobsValidated > 0 ? `${jobsValidated} métier${jobsValidated > 1 ? 's' : ''} validé${jobsValidated > 1 ? 's' : ''}`
        : (jobsPlayed > 0 ? 'Continue : valide un métier (≥12/20)' : 'Comprends les compétences clés'),
      done: jobsValidated > 0, cta: '/metiers', ctaLabel: 'Explorer les métiers',
    },
    {
      id: 'entrainement', emoji: '🎤', title: 'Entraîne-toi à l\'entretien',
      desc: themesPlayed > 0 ? `${themesPlayed} thème${themesPlayed > 1 ? 's' : ''} travaillé${themesPlayed > 1 ? 's' : ''} · ${overall}%`
        : 'Joue ta première session',
      done: themesPlayed > 0, cta: '/entretien', ctaLabel: 'S\'entraîner',
    },
    {
      id: 'validation', emoji: '🏆', title: 'Valide un entretien',
      desc: validatedThemes > 0 ? `${validatedThemes} session${validatedThemes > 1 ? 's' : ''} validée${validatedThemes > 1 ? 's' : ''} (≥12/20)`
        : 'Obtiens au moins 12/20 sur une session',
      done: validatedThemes > 0, cta: '/entretien', ctaLabel: 'Tenter ma validation',
    },
    {
      id: 'lettre', emoji: '✉️', title: 'Lettre de motivation',
      desc: 'Bientôt disponible', done: false, locked: true,
    },
  ];

  const activeSteps = steps.filter((st) => !st.locked);
  const completed = activeSteps.filter((st) => st.done).length;

  const badges = [
    { id: 'first-cv',    emoji: '🌱', label: 'Premier CV',        earned: cvCount > 0 },
    { id: 'metier',      emoji: '🧭', label: 'Métier décrypté',   earned: jobsValidated > 0 },
    { id: 'first-itw',   emoji: '🎤', label: 'Premier entretien', earned: themesPlayed > 0 },
    { id: 'validated',   emoji: '🏆', label: 'Entretien validé',  earned: validatedThemes > 0 },
    { id: 'polyvalent',  emoji: '🧠', label: 'Polyvalent (3 thèmes)', earned: themesPlayed >= 3 },
    { id: 'streak',      emoji: '🔥', label: 'Série de 3 jours',  earned: streak >= 3 },
    { id: 'xp-100',      emoji: '⭐', label: '100 XP',            earned: xp >= 100 },
    { id: 'xp-500',      emoji: '🌟', label: '500 XP',            earned: xp >= 500 },
  ];

  return {
    level, xp, streak,
    steps, completed, totalSteps: activeSteps.length,
    badges, earnedBadges: badges.filter((b) => b.earned).length,
  };
}

/** Lit les stores et calcule le parcours complet. */
export function getJourney() {
  let cvCount = 0;
  try { cvCount = (getHist() || []).length; } catch { cvCount = 0; }

  const prog = getProgress();
  const validatedThemes = Object.values(prog).filter((p) => (p?.best || 0) >= INTERVIEW_PASS_PCT).length;

  return computeJourney({
    cvCount,
    overall: getOverallCompletion(),
    themesPlayed: getThemesPlayed(),
    validatedThemes,
    jobsPlayed: getJobsPlayed(),
    jobsValidated: getValidatedJobs().length,
    xp: getTotalXp(),
    streak: getDailyStreak(),
  });
}
