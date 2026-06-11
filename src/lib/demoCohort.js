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
const LS_ROSTER  = 'talia_demo_roster';
const LS_PERSONA = 'talia_demo_persona';
const LS_ENCADRANT = 'talia_demo_encadrant'; // en démo : se voir comme encadrant

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

export const DEMO_ORG_NAME = 'École Talia Paris';

const DEFAULT_ROSTER = [
  { id: 's1', name: 'Léa Martin',     email: 'lea.martin@email.fr',    manager: 'karim', employability: 72, xp: 1240, streak: 4, lastActive: "aujourd'hui" },
  { id: 's2', name: 'Hugo Bernard',   email: 'hugo.bernard@email.fr',  manager: 'karim', employability: 38, xp: 420,  streak: 0, lastActive: 'il y a 6 j' },
  { id: 's3', name: 'Inès Dubois',    email: 'ines.dubois@email.fr',   manager: 'karim', employability: 91, xp: 2680, streak: 12, lastActive: "aujourd'hui" },
  { id: 's4', name: 'Tom Petit',      email: 'tom.petit@email.fr',     manager: 'nadia', employability: 55, xp: 760,  streak: 2, lastActive: 'hier' },
  { id: 's5', name: 'Sarah Moreau',   email: 'sarah.moreau@email.fr',  manager: 'nadia', employability: 14, xp: 120,  streak: 0, lastActive: 'il y a 11 j' },
  { id: 's6', name: 'Yanis Lefevre',  email: 'yanis.lefevre@email.fr', manager: 'nadia', employability: 64, xp: 980,  streak: 5, lastActive: 'hier' },
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

// ── Fiche élève : piliers d'employabilité (dérivés, déterministes) ────────────
export const PILLARS = [
  { id: 'cv',          label: 'CV prêt',        emoji: '📄' },
  { id: 'entretien',   label: 'Entretien',      emoji: '🎤' },
  { id: 'metier',      label: 'Métiers',        emoji: '🧭' },
  { id: 'codes',       label: 'Savoir-être',    emoji: '🏢' },
  { id: 'candidature', label: 'Candidature',    emoji: '✉️' },
  { id: 'recrutement', label: 'Tests',          emoji: '🧩' },
];

/** Détail par pilier pour un élève (démo : dérivé du score global). */
export function studentPillars(s) {
  const base = typeof s.employability === 'number' ? s.employability : Math.min(100, Math.round((s.xp || 0) / 30));
  const seed = [...(s.id || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PILLARS.map((p, i) => {
    const off = ((seed * (i + 3)) % 37) - 18; // -18..+18, déterministe
    return { ...p, score: Math.max(0, Math.min(100, base + off)) };
  });
}

/** Un élève « décroche » : inactif, sans série, ou employabilité faible. */
export function needsFollowup(s) {
  if (!s) return false;
  if (/il y a/i.test(s.lastActive || '')) return true;
  if ((s.streak || 0) === 0) return true;
  if (typeof s.employability === 'number' && s.employability < 40) return true;
  return false;
}
