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

// ── XP cumulée & série quotidienne (façon « streak » Duolingo) ────────────────
const META_KEY = 'talia_interview_meta'; // { xp, lastPlay: 'YYYY-MM-DD', dayStreak }

function readMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : { xp: 0, lastPlay: null, dayStreak: 0 };
  } catch {
    return { xp: 0, lastPlay: null, dayStreak: 0 };
  }
}

function writeMeta(obj) {
  try { localStorage.setItem(META_KEY, JSON.stringify(obj)); } catch { /* ignore */ }
}

/** Date du jour au format 'YYYY-MM-DD' (heure locale). */
function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** XP totale cumulée, toutes sessions confondues. */
export function getTotalXp() {
  return readMeta().xp || 0;
}

/** Ajoute des points d'XP au total et renvoie le nouveau cumul. */
export function addXp(amount) {
  const meta = readMeta();
  meta.xp = (meta.xp || 0) + Math.max(0, Math.round(amount));
  writeMeta(meta);
  return meta.xp;
}

/** Série quotidienne courante (nombre de jours consécutifs joués). */
export function getDailyStreak() {
  return readMeta().dayStreak || 0;
}

/**
 * Met à jour la série quotidienne en fin de session.
 * +1 si le dernier jour joué était hier, reset à 1 si trou, inchangé si déjà joué aujourd'hui.
 * @returns {number} la série après mise à jour
 */
export function bumpDailyStreak() {
  const meta = readMeta();
  const today = todayKey();
  if (meta.lastPlay === today) return meta.dayStreak || 1; // déjà compté aujourd'hui

  const yesterday = todayKey(new Date(Date.now() - 86400000));
  meta.dayStreak = meta.lastPlay === yesterday ? (meta.dayStreak || 0) + 1 : 1;
  meta.lastPlay = today;
  writeMeta(meta);
  return meta.dayStreak;
}
