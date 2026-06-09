/**
 * progressSync — Synchronisation de la progression joueur (offline-first).
 *
 * Stratégie « write-through cache », même esprit que historySync :
 *   • localStorage = cache rapide + mode hors-ligne (source de travail)
 *   • Supabase (table user_progress) = source de vérité multi-appareil
 *
 * Toute la progression gamifiée (XP, série, badges, notes des modules,
 * complétions) vit dans un petit ensemble de clés localStorage. Ce module les
 * agrège en un blob unique, le fusionne avec le serveur (résolution de conflit
 * par "meilleur score"), réécrit le cache local et repousse en base.
 *
 * Si Supabase n'est pas configuré ou l'utilisateur n'est pas connecté →
 * tout reste en localStorage (fallback silencieux, comportement actuel inchangé).
 */
import { supabase, supabaseReady } from './supabase';
import { getCurrentUserId, isAuthenticated } from './currentUser';

/** Clés localStorage qui constituent la progression (PAS les préférences). */
export const PROGRESS_KEYS = [
  'talia_player',            // xp, lastPlay, dayStreak, badges
  'talia_interview_progress', // maîtrise par thème d'entretien
  'talia_jobs_progress',      // métiers validés
  'talia_codes_progress',     // { bestNote, plays }
  'talia_recruit_progress',   // { bestNote, plays }
  'talia_oral_progress',      // { bestNote, plays }
  'talia_letters_count',      // compteur de lettres générées
];

// ── Snapshot / hydratation du cache local ────────────────────────────────────

/** Lit toutes les clés de progression présentes → objet { clé: valeur }. */
export function snapshotLocal() {
  const out = {};
  for (const k of PROGRESS_KEYS) {
    let raw;
    try { raw = localStorage.getItem(k); } catch { raw = null; }
    if (raw == null) continue;
    try { out[k] = JSON.parse(raw); } catch { out[k] = raw; }
  }
  return out;
}

/** Réécrit le cache local à partir d'un blob de progression. */
export function hydrateLocal(blob) {
  if (!blob || typeof blob !== 'object') return;
  for (const k of PROGRESS_KEYS) {
    if (!(k in blob)) continue;
    const v = blob[k];
    const str = (v !== null && typeof v === 'object') ? JSON.stringify(v) : String(v);
    try { localStorage.setItem(k, str); } catch { /* ignore */ }
  }
}

/** Représentation JSON stable du snapshot (pour détecter les changements). */
export function snapshotJson() {
  return JSON.stringify(snapshotLocal());
}

// ── Fusion (pure, testable) ───────────────────────────────────────────────────

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const uniq = (a) => [...new Set(a)];

/** Fusion générique « le meilleur gagne » : nombres = max, tableaux = union,
 *  objets = récursif, dates ISO/strings = la plus grande (= la plus récente). */
export function deepMergeMax(a, b) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if (Array.isArray(a) && Array.isArray(b)) return uniq([...a, ...b]);
  if (isObj(a) && isObj(b)) {
    const out = { ...a };
    for (const k of Object.keys(b)) out[k] = deepMergeMax(a[k], b[k]);
    return out;
  }
  if (typeof a === 'string' && typeof b === 'string') return a >= b ? a : b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
  // types hétérogènes → on garde la valeur définie la plus "riche"
  return b ?? a;
}

/** Profil joueur : xp/série au max, dernière activité la plus récente,
 *  badges en union en conservant la 1re date de déblocage (min). */
export function mergePlayer(a = {}, b = {}) {
  const badges = {};
  for (const id of uniq([...Object.keys(a.badges || {}), ...Object.keys(b.badges || {})])) {
    const ta = a.badges?.[id], tb = b.badges?.[id];
    badges[id] = (ta && tb) ? Math.min(ta, tb) : (ta || tb);
  }
  const lastA = a.lastPlay || '', lastB = b.lastPlay || '';
  return {
    xp: Math.max(a.xp || 0, b.xp || 0),
    dayStreak: Math.max(a.dayStreak || 0, b.dayStreak || 0),
    lastPlay: (lastA >= lastB ? lastA : lastB) || null,
    badges,
  };
}

/** Stores { bestNote, plays } : meilleure note + nombre de parties maxi. */
export function mergeBestNote(a = {}, b = {}) {
  return {
    bestNote: Math.max(a.bestNote || 0, b.bestNote || 0),
    plays: Math.max(a.plays || 0, b.plays || 0),
  };
}

const KEY_MERGERS = {
  talia_player: mergePlayer,
  talia_codes_progress: mergeBestNote,
  talia_recruit_progress: mergeBestNote,
  talia_oral_progress: mergeBestNote,
  talia_letters_count: (a = 0, b = 0) => Math.max(Number(a) || 0, Number(b) || 0),
};

/** Fusionne deux blobs de progression (local + distant), clé par clé. */
export function mergeProgress(local = {}, remote = {}) {
  const out = {};
  for (const k of uniq([...Object.keys(local || {}), ...Object.keys(remote || {})])) {
    if (!(k in (local || {}))) { out[k] = remote[k]; continue; }
    if (!(k in (remote || {}))) { out[k] = local[k]; continue; }
    const merger = KEY_MERGERS[k] || deepMergeMax;
    out[k] = merger(local[k], remote[k]);
  }
  return out;
}

/** XP / série extraites d'un blob (pour les colonnes indexées). */
export function progressStats(blob = {}) {
  const p = blob.talia_player || {};
  return { xp: Number(p.xp) || 0, day_streak: Number(p.dayStreak) || 0 };
}

// ── Pull / Push Supabase ──────────────────────────────────────────────────────

function canSync() {
  return supabaseReady && !!supabase && isAuthenticated();
}

/** Pousse le snapshot local vers Supabase (no-op hors-ligne / non connecté). */
export async function pushProgress() {
  if (!canSync()) return false;
  try {
    const data = snapshotLocal();
    const { xp, day_streak } = progressStats(data);
    const { error } = await supabase.from('user_progress').upsert({
      user_id: getCurrentUserId(), data, xp, day_streak, updated_at: new Date().toISOString(),
    });
    if (error) { console.warn('[progressSync] push:', error.message); return false; }
    return true;
  } catch (e) { console.warn('[progressSync] push:', e?.message); return false; }
}

/**
 * Tire la progression distante, la fusionne avec le local, réhydrate le cache
 * et repousse le résultat (pour que le serveur récupère les gains locaux).
 * Renvoie le blob fusionné (ou le snapshot local en mode hors-ligne).
 */
export async function pullProgress() {
  const local = snapshotLocal();
  if (!canSync()) return local;
  try {
    const { data, error } = await supabase
      .from('user_progress').select('data').eq('user_id', getCurrentUserId()).maybeSingle();
    if (error) { console.warn('[progressSync] pull:', error.message); return local; }
    if (!data) { await pushProgress(); return local; } // pas encore de ligne → on initialise
    const merged = mergeProgress(local, data.data || {});
    hydrateLocal(merged);
    await pushProgress();
    return merged;
  } catch (e) { console.warn('[progressSync] pull:', e?.message); return local; }
}
