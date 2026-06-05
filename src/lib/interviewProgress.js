/**
 * interviewProgress — Suivi local du % de complétion du simulateur d'entretien.
 *
 * Stocke, par thème, le meilleur score (%) obtenu et le nombre de sessions jouées.
 * Persistance : localStorage 'talia_interview_progress'.
 * Sert à afficher la progression sur l'écran d'accueil du jeu (façon code de la route).
 */
import { CATEGORIES } from './interviewCategories.js';

const LS_KEY = 'talia_interview_progress';

function read() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch { /* ignore */ }
}

/** Retourne { [category]: { best, plays } } pour tous les thèmes joués. */
export function getProgress() {
  return read();
}

/** Meilleur score (%) pour un thème, 0 si jamais joué. */
export function getBest(category) {
  return read()[category]?.best ?? 0;
}

/**
 * Enregistre le résultat d'une session : met à jour le meilleur score + le compteur.
 * @param {string} category - id du thème ('all' pour la session mixte)
 * @param {number} pct      - score de la session en %
 * @returns {{best:number, plays:number, improved:boolean}}
 */
export function saveResult(category, pct) {
  const data = read();
  const prev = data[category] || { best: 0, plays: 0 };
  const improved = pct > prev.best;
  data[category] = {
    best: Math.max(prev.best, Math.round(pct)),
    plays: prev.plays + 1,
  };
  write(data);
  return { ...data[category], improved };
}

/**
 * Taux de complétion global : moyenne du meilleur score sur TOUS les thèmes.
 * Un thème jamais joué compte pour 0 % → reflète la vraie progression d'ensemble.
 */
export function getOverallCompletion() {
  const data = read();
  const cats = Object.keys(CATEGORIES); // les 8 thèmes, joués ou non
  if (!cats.length) return 0;
  const sum = cats.reduce((s, k) => s + (data[k]?.best || 0), 0);
  return Math.round(sum / cats.length);
}

/** Nombre de thèmes déjà tentés (au moins une session jouée). */
export function getThemesPlayed() {
  const data = read();
  return Object.keys(CATEGORIES).filter((k) => data[k]?.plays > 0).length;
}

// ── XP cumulée & série quotidienne ────────────────────────────────────────────
// Déléguées au profil joueur unifié (playerProfile). Réexportées ici pour
// compatibilité : les modules continuent d'importer ces fonctions depuis
// interviewProgress sans changement.
export { getTotalXp, addXp, getDailyStreak, bumpDailyStreak } from './playerProfile.js';
