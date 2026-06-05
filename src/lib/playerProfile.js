/**
 * playerProfile — Profil joueur unifié (couche gamification transverse).
 *
 * Source unique pour les signaux partagés par TOUS les modules ludiques :
 *   - XP cumulée
 *   - série quotidienne (streak Duolingo)
 *   - niveau (dérivé de l'XP)
 *   - badges débloqués (avec date de déblocage)
 *
 * Avant, l'XP/série vivaient dans interviewProgress et les badges étaient
 * recalculés à la volée. Centralisé ici → base pour les ligues & badges.
 *
 * Persistance : localStorage 'talia_player'.
 * Migration auto depuis l'ancien 'talia_interview_meta' (aucune perte de données).
 */
const LS_KEY = 'talia_player';
const LEGACY_META = 'talia_interview_meta';

function normalize(o) {
  return {
    xp: o?.xp || 0,
    lastPlay: o?.lastPlay || null,
    dayStreak: o?.dayStreak || 0,
    badges: (o && typeof o.badges === 'object' && o.badges) || {},
  };
}

function read() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return normalize(JSON.parse(raw));
    // ── Migration depuis l'ancien store entretien ──
    const legacy = localStorage.getItem(LEGACY_META);
    if (legacy) {
      const seed = normalize(JSON.parse(legacy));
      write(seed);
      return seed;
    }
  } catch { /* ignore */ }
  return normalize(null);
}

function write(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch { /* ignore */ }
}

/** Date du jour 'YYYY-MM-DD' (heure locale). */
function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Profil complet (xp, lastPlay, dayStreak, badges). */
export function getProfile() {
  return read();
}

// ── XP ────────────────────────────────────────────────────────────────────────
export function getTotalXp() {
  return read().xp || 0;
}

export function addXp(amount) {
  const p = read();
  p.xp = (p.xp || 0) + Math.max(0, Math.round(amount || 0));
  write(p);
  return p.xp;
}

// ── Série quotidienne ──────────────────────────────────────────────────────────
export function getDailyStreak() {
  return read().dayStreak || 0;
}

/**
 * Met à jour la série quotidienne en fin de session.
 * +1 si le dernier jour joué était hier, reset à 1 si trou, inchangé si déjà joué aujourd'hui.
 */
export function bumpDailyStreak() {
  const p = read();
  const today = todayKey();
  if (p.lastPlay === today) return p.dayStreak || 1;
  const yesterday = todayKey(new Date(Date.now() - 86400000));
  p.dayStreak = p.lastPlay === yesterday ? (p.dayStreak || 0) + 1 : 1;
  p.lastPlay = today;
  write(p);
  return p.dayStreak;
}

// ── Niveau ──────────────────────────────────────────────────────────────────────
export const LEVELS = [
  { min: 0,    label: 'Débutant',  emoji: '🌱' },
  { min: 200,  label: 'Apprenti',  emoji: '📘' },
  { min: 600,  label: 'Confirmé',  emoji: '⚡' },
  { min: 1200, label: 'Pro',       emoji: '🏆' },
  { min: 2500, label: 'Expert',    emoji: '👑' },
];

/** Niveau (et progression vers le suivant) pour une XP donnée. */
export function levelForXp(xp = getTotalXp()) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const span = next ? next.min - current.min : 1;
  const into = next ? xp - current.min : 1;
  const progress = next ? Math.max(0, Math.min(100, Math.round((into / span) * 100))) : 100;
  return { ...current, index: idx, next, progress, toNext: next ? Math.max(0, next.min - xp) : 0 };
}

// ── Badges (débloqués avec horodatage) ─────────────────────────────────────────
/** Map { badgeId: timestampMs } des badges débloqués. */
export function getBadges() {
  return read().badges || {};
}

export function hasBadge(id) {
  return !!read().badges?.[id];
}

/** Débloque un badge (idempotent), renvoie sa date de déblocage. */
export function unlockBadge(id) {
  if (!id) return null;
  const p = read();
  if (!p.badges[id]) { p.badges[id] = Date.now(); write(p); }
  return p.badges[id];
}

/**
 * Synchronise un lot de badges actuellement mérités : débloque ceux qui ne le
 * sont pas encore (en conservant la 1re date). Renvoie la map des badges.
 * @param {string[]} earnedIds
 */
export function syncBadges(earnedIds = []) {
  const p = read();
  let changed = false;
  for (const id of earnedIds) {
    if (id && !p.badges[id]) { p.badges[id] = Date.now(); changed = true; }
  }
  if (changed) write(p);
  return p.badges;
}
