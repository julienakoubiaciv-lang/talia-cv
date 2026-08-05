/**
 * demoCohort — Cohorte SIMULÉE pour le dashboard encadrant (mode démo).
 *
 * Permet de jouer les deux vues sans backend :
 *   • Conseiller (manager) → voit SES élèves.
 *   • Direction (admin)    → voit tout + peut réattribuer un élève.
 *
 * Le roster est persistné en localStorage pour que la réattribution tienne
 * pendant la session. On peut changer de « persona » (qui regarde).
 */
import { isSettled } from './cohortOutcome';

// v2 : le roster porte désormais promo + statut de parcours. La clé est
// versionnée pour qu'une démo ouverte avant cette évolution reparte du modèle
// à jour plutôt que d'afficher des élèves sans promo.
const LS_ROSTER  = 'altio_demo_roster_v2';
const LS_PERSONA = 'altio_demo_persona';
const LS_ENCADRANT = 'altio_demo_encadrant'; // en démo : se voir comme encadrant

/** En démo, l'utilisateur a-t-il activé le « mode encadrant » ? (défaut : élève) */
export function isDemoEncadrant() {
  try { return localStorage.getItem(LS_ENCADRANT) === '1'; } catch { return false; }
}
/** Active/désactive le mode encadrant de démo. */
export function setDemoEncadrant(on) {
  try { localStorage.setItem(LS_ENCADRANT, on ? '1' : '0'); } catch { /* ignore */ }
}

/** Conseillers de l'école de démo. */
export const DEMO_CONSEILLERS = [
  { id: 'karim', name: 'Karim B.' },
  { id: 'nadia', name: 'Nadia M.' },
];

export const DEMO_ORG_NAME = 'École Altio Paris';

/** Promos de l'école de démo. */
export const DEMO_COHORTS = [
  { id: 'bts-ndrc-24', name: 'BTS NDRC · 2024' },
  { id: 'bachelor-rh-24', name: 'Bachelor RH · 2024' },
];

/** Progression simulée : mêmes clés que user_progress.data en réel. */
function demoProgress({ interview = {}, jobs = 0, codes = 0, recruit = 0, oral = 0, letters = 0, badges = [] }) {
  const jobsProgress = {};
  for (let i = 0; i < jobs; i++) jobsProgress[`metier-${i}`] = { validated: true };
  return {
    altio_player: { badges },
    altio_interview_progress: interview,
    altio_jobs_progress: jobsProgress,
    altio_codes_progress: { bestNote: codes, plays: codes ? 2 : 0 },
    altio_recruit_progress: { bestNote: recruit, plays: recruit ? 1 : 0 },
    altio_oral_progress: { bestNote: oral, plays: oral ? 3 : 0 },
    altio_letters_count: letters,
  };
}

const DEFAULT_ROSTER = [
  { id: 's1', name: 'Léa Martin',     email: 'lea.martin@email.fr',    manager: 'karim', cohortId: 'bts-ndrc-24',   outcome: 'placed',        employability: 72, xp: 1240, streak: 4, lastActive: "aujourd'hui", cvCount: 3, progress: demoProgress({ interview: { motivation: { best: 85, plays: 4 }, parcours: { best: 70, plays: 2 }, projet: { best: 60, plays: 1 } }, jobs: 5, codes: 16, recruit: 13, oral: 15, letters: 3, badges: ['first_cv', 'oral_pro'] }) },
  { id: 's2', name: 'Hugo Bernard',   email: 'hugo.bernard@email.fr',  manager: 'karim', cohortId: 'bts-ndrc-24',   outcome: 'job_searching', employability: 38, xp: 420,  streak: 0, lastActive: 'il y a 6 j', cvCount: 1, progress: demoProgress({ interview: { motivation: { best: 40, plays: 1 } }, jobs: 1, codes: 8, recruit: 0, oral: 0, letters: 1, badges: ['first_cv'] }) },
  { id: 's3', name: 'Inès Dubois',    email: 'ines.dubois@email.fr',   manager: 'karim', cohortId: 'bts-ndrc-24',   outcome: 'graduated',     employability: 91, xp: 2680, streak: 12, lastActive: "aujourd'hui", cvCount: 4, progress: demoProgress({ interview: { motivation: { best: 95, plays: 6 }, parcours: { best: 90, plays: 4 }, projet: { best: 85, plays: 3 }, equipe: { best: 80, plays: 2 } }, jobs: 9, codes: 18, recruit: 17, oral: 19, letters: 5, badges: ['first_cv', 'oral_pro', 'streak_7', 'job_expert'] }) },
  { id: 's4', name: 'Tom Petit',      email: 'tom.petit@email.fr',     manager: 'nadia', cohortId: 'bachelor-rh-24', outcome: 'job_searching', employability: 55, xp: 760,  streak: 2, lastActive: 'hier', cvCount: 2, progress: demoProgress({ interview: { motivation: { best: 55, plays: 2 } }, jobs: 3, codes: 12, recruit: 9, oral: 11, letters: 2, badges: ['first_cv'] }) },
  { id: 's5', name: 'Sarah Moreau',   email: 'sarah.moreau@email.fr',  manager: 'nadia', cohortId: 'bachelor-rh-24', outcome: 'in_training',   employability: 14, xp: 120,  streak: 0, lastActive: 'il y a 11 j', cvCount: 0, progress: demoProgress({ interview: {}, jobs: 0, codes: 0, recruit: 0, oral: 0, letters: 0, badges: [] }) },
  { id: 's6', name: 'Yanis Lefevre',  email: 'yanis.lefevre@email.fr', manager: 'nadia', cohortId: 'bachelor-rh-24', outcome: 'placed',        employability: 64, xp: 980,  streak: 5, lastActive: 'hier', cvCount: 2, progress: demoProgress({ interview: { motivation: { best: 65, plays: 3 }, parcours: { best: 55, plays: 2 } }, jobs: 4, codes: 14, recruit: 11, oral: 13, letters: 2, badges: ['first_cv', 'streak_7'] }) },
];

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_ROSTER) || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch { /* ignore */ }
  return DEFAULT_ROSTER.map((s) => ({ ...s }));
}
function write(roster) {
  try { localStorage.setItem(LS_ROSTER, JSON.stringify(roster)); } catch { /* ignore */ }
}

/** Roster complet (tous les élèves). */
export function getRoster() { return read(); }

/** Réattribue un élève à un autre conseiller (action « direction »). */
export function reassignStudent(studentId, managerId) {
  const roster = read();
  const s = roster.find((x) => x.id === studentId);
  if (!s || !DEMO_CONSEILLERS.some((c) => c.id === managerId)) return roster;
  s.manager = managerId;
  write(roster);
  return roster;
}

/** Met à jour le statut de parcours d'un élève. */
export function setStudentOutcome(studentId, outcome) {
  const roster = read();
  const s = roster.find((x) => x.id === studentId);
  if (!s) return roster;
  s.outcome = outcome;
  write(roster);
  return roster;
}

/** Réinitialise la cohorte de démo. */
export function resetRoster() { try { localStorage.removeItem(LS_ROSTER); } catch { /* ignore */ } }

// ── Persona (qui regarde) ────────────────────────────────────────────────────
/** 'karim' | 'nadia' = conseiller · 'direction' = admin. */
export function getPersona() {
  try { return localStorage.getItem(LS_PERSONA) || 'direction'; } catch { return 'direction'; }
}
export function setPersona(p) { try { localStorage.setItem(LS_PERSONA, p); } catch { /* ignore */ } }

/** Infos du viewer courant (rôle + libellé). */
export function getViewer() {
  const p = getPersona();
  if (p === 'direction') return { role: 'admin', id: 'direction', name: 'Direction', label: 'Direction' };
  const c = DEMO_CONSEILLERS.find((x) => x.id === p) || DEMO_CONSEILLERS[0];
  return { role: 'manager', id: c.id, name: c.name, label: `Conseiller · ${c.name}` };
}

/** Élèves visibles par le viewer courant (direction = tous, conseiller = les siens). */
export function getVisibleRoster() {
  const v = getViewer();
  const roster = read();
  return v.role === 'admin' ? roster : roster.filter((s) => s.manager === v.id);
}

// Les piliers d'employabilité sont désormais calculés sur la progression
// réelle de l'accompagné (voir lib/studentProgress.js), plus par dérivation
// du score global : le coach voit ce que voit l'élève.

/** Un élève « décroche » : inactif, sans série, ou employabilité faible. */
export function needsFollowup(s) {
  if (!s) return false;
  // Un élève placé, diplômé ou sorti du parcours n'est pas un décrocheur.
  if (isSettled(s.outcome)) return false;
  if (/il y a/i.test(s.lastActive || '')) return true;
  if ((s.streak || 0) === 0) return true;
  if (typeof s.employability === 'number' && s.employability < 40) return true;
  return false;
}
