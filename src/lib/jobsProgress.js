/**
 * jobsProgress — Suivi local des métiers « décryptés » (module /metiers).
 *
 * Stocke, par métier (id de parcours), la meilleure note /20, le nombre de
 * parties et le statut « validé » (note ≥ seuil). Persistance localStorage.
 * Alimente le Parcours gamifié unifié.
 */
const LS_KEY = 'talia_jobs_progress';
export const JOB_PASS_MARK = 12; // note /20 minimale pour valider un métier

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

/**
 * Enregistre le résultat d'un test métier.
 * @param {string} jobV - id du métier (clé de parcours)
 * @param {number} note - note /20 obtenue
 * @returns {{bestNote:number, plays:number, validated:boolean}}
 */
export function saveJobResult(jobV, note) {
  if (!jobV) return null;
  const data = read();
  const prev = data[jobV] || { bestNote: 0, plays: 0, validated: false };
  const n = Math.max(0, Math.min(20, Math.round(note || 0)));
  data[jobV] = {
    bestNote: Math.max(prev.bestNote, n),
    plays: prev.plays + 1,
    validated: prev.validated || n >= JOB_PASS_MARK,
  };
  write(data);
  return data[jobV];
}

/** Progression brute { [jobV]: { bestNote, plays, validated } }. */
export function getJobsProgress() {
  return read();
}

/** Meilleure note /20 pour un métier (0 si jamais joué). */
export function getJobBest(jobV) {
  return read()[jobV]?.bestNote ?? 0;
}

/** Liste des ids de métiers validés (note ≥ seuil au moins une fois). */
export function getValidatedJobs() {
  const data = read();
  return Object.keys(data).filter((k) => data[k]?.validated);
}

/** Nombre de métiers déjà tentés. */
export function getJobsPlayed() {
  return Object.keys(read()).length;
}
