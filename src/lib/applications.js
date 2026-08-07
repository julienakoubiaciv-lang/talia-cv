/**
 * applications — Candidatures d'un élève (table `candidatures` d'OCTO).
 *
 * Le CRM suit déjà les candidatures : entreprise, poste, statut, dates d'envoi,
 * d'entretien et de signature. On lit et écrit CETTE table plutôt que d'en
 * créer une seconde — un doublon aurait divergé de ce que voit l'école.
 *
 * Particularités d'OCTO respectées ici :
 *   • `candidatures.id` est un `text`, pas un uuid — c'est le CRM qui en fixe
 *     la forme, on génère donc un identifiant lisible côté client ;
 *   • les dates sont des `bigint` (millisecondes epoch), pas des `date` ;
 *   • `entreprise_id` référence `entreprises` ; une candidature saisie par le
 *     coach ne connaît souvent que le nom, stocké alors dans `poste`/notes.
 *
 * En démo, tout vit en localStorage.
 */
import { supabase, supabaseReady } from './supabase';
import { isAuthenticated, getCurrentUserId } from './currentUser';
import { isDemoMode } from './demoMode';
import { C } from './gameTheme';

/**
 * Statuts, avec les libellés du CRM comme valeurs stockées : les
 * automatisations d'OCTO réagissent à « Contrat signé », inventer un
 * vocabulaire parallèle casserait leurs déclencheurs.
 */
export const APP_STATUS = [
  { id: 'Envoyée',       label: 'Envoyée',       short: 'Envoyée',     color: C.mute },
  { id: 'Entretien',     label: 'Entretien',     short: 'Entretien',   color: C.blue },
  { id: 'Proposition',   label: 'Proposition',   short: 'Proposition', color: C.amber },
  { id: 'Contrat signé', label: 'Contrat signé', short: 'Signé',       color: C.green },
  { id: 'Refusé',        label: 'Refus',         short: 'Refus',       color: C.red },
  { id: 'Abandon',       label: 'Abandonnée',    short: 'Abandon',     color: C.mute },
];

export const DEFAULT_APP_STATUS = 'Envoyée';

export function appStatusMeta(id) {
  return APP_STATUS.find((s) => s.id === id) || APP_STATUS[0];
}

/** Une candidature aboutie : c'est elle qui compte comme placement. */
export function isPlacement(status) {
  return status === 'Contrat signé';
}

const toMs = (d) => (d ? new Date(d).getTime() : null);
const toISODate = (ms) => (ms ? new Date(Number(ms)).toISOString().slice(0, 10) : null);

/** Ligne `candidatures` → forme attendue par l'interface. */
function fromRow(r) {
  return {
    id: r.id,
    company: r.entreprise_nom || r.entreprise_id || '—',
    role_title: r.poste || null,
    status: r.statut || DEFAULT_APP_STATUS,
    applied_at: toISODate(r.date_envoi),
    interview_at: toISODate(r.date_entretien),
  };
}

// ── Démo ────────────────────────────────────────────────────────────────────
const LS_DEMO = 'altio_demo_applications';

function readDemo() {
  try { return JSON.parse(localStorage.getItem(LS_DEMO) || '{}'); } catch { return {}; }
}
function writeDemo(all) {
  try { localStorage.setItem(LS_DEMO, JSON.stringify(all)); } catch { /* ignore */ }
}

const DEMO_SEED = {
  s1: [
    { id: 'a1', company: 'Decathlon', role_title: 'Alternance vente', status: 'Contrat signé', applied_at: '2026-03-02', interview_at: '2026-03-14' },
    { id: 'a2', company: 'Leroy Merlin', role_title: 'Conseiller rayon', status: 'Refusé', applied_at: '2026-02-18' },
  ],
  s2: [
    { id: 'a3', company: 'Orange', role_title: 'Chargé de clientèle', status: 'Entretien', applied_at: '2026-07-20', interview_at: '2026-08-12' },
  ],
  s3: [
    { id: 'a4', company: 'BNP Paribas', role_title: 'Assistant RH', status: 'Contrat signé', applied_at: '2026-01-15', interview_at: '2026-01-29' },
  ],
  s6: [
    { id: 'a5', company: 'Carrefour', role_title: 'Alternance logistique', status: 'Contrat signé', applied_at: '2026-04-08' },
    { id: 'a6', company: 'Lidl', role_title: 'Employé polyvalent', status: 'Proposition', applied_at: '2026-05-02', interview_at: '2026-05-20' },
  ],
};

function demoFor(studentId) {
  const all = readDemo();
  if (!(studentId in all)) {
    all[studentId] = (DEMO_SEED[studentId] || []).map((a) => ({ ...a }));
    writeDemo(all);
  }
  return all[studentId];
}

// ── API ─────────────────────────────────────────────────────────────────────

/** Candidatures d'un élève, les plus récentes d'abord. */
export async function listApplications(studentId) {
  if (!studentId) return [];
  if (isDemoMode()) return demoFor(studentId);
  if (!supabaseReady || !supabase || !isAuthenticated()) return [];
  const { data, error } = await supabase.from('candidatures')
    .select('id, entreprise_id, poste, statut, date_envoi, date_entretien, date_signature')
    .eq('candidate_id', studentId)
    .order('date_envoi', { ascending: false, nullsFirst: false });
  if (error) { console.warn('[applications] list:', error.message); return []; }
  return (data || []).map(fromRow);
}

/** Ajoute une candidature. @returns {Promise<object|null>} */
export async function addApplication({ studentId, orgId = null, company, roleTitle = '', status = DEFAULT_APP_STATUS, appliedAt = null } = {}) {
  const name = String(company || '').trim();
  if (!studentId || !name) return null;

  if (isDemoMode()) {
    const all = readDemo();
    const list = demoFor(studentId);
    const row = {
      id: `demo-${Date.now().toString(36)}`, company: name, role_title: roleTitle || null,
      status, applied_at: appliedAt || new Date().toISOString().slice(0, 10), interview_at: null,
    };
    all[studentId] = [row, ...list];
    writeDemo(all);
    return row;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return null;
  const now = Date.now();
  const { data, error } = await supabase.from('candidatures').insert({
    id: `cand-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    org_id: orgId,
    candidate_id: studentId,
    // Le nom de l'entreprise sert d'identifiant tant qu'elle n'est pas une
    // fiche `entreprises` : le coach saisit souvent avant que le CRM la crée.
    entreprise_id: name,
    poste: roleTitle || null,
    statut: status,
    date_envoi: toMs(appliedAt) || now,
    conseiller_id: getCurrentUserId(),
    created_at: now,
    updated_at: now,
  }).select('id, entreprise_id, poste, statut, date_envoi, date_entretien, date_signature').single();
  if (error) { console.warn('[applications] add:', error.message); return null; }
  return fromRow(data);
}

/** Change l'état d'une candidature, et horodate le jalon correspondant. */
export async function updateApplication(id, patch = {}) {
  if (!id) return false;

  if (isDemoMode()) {
    const all = readDemo();
    for (const sid of Object.keys(all)) {
      const row = all[sid].find((a) => a.id === id);
      if (row) { Object.assign(row, patch); writeDemo(all); return true; }
    }
    return false;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return false;
  const now = Date.now();
  const row = { updated_at: now };
  if (patch.status) {
    row.statut = patch.status;
    // Les jalons du CRM se remplissent au passage du statut, comme il le fait
    // lui-même — sinon un contrat signé resterait sans date de signature.
    if (patch.status === 'Entretien') row.date_entretien = now;
    if (isPlacement(patch.status)) row.date_signature = now;
  }
  const { error } = await supabase.from('candidatures').update(row).eq('id', id);
  if (error) { console.warn('[applications] update:', error.message); return false; }
  return true;
}

/** Supprime une candidature saisie par erreur. */
export async function deleteApplication(id) {
  if (!id) return false;

  if (isDemoMode()) {
    const all = readDemo();
    for (const sid of Object.keys(all)) {
      const i = all[sid].findIndex((a) => a.id === id);
      if (i >= 0) { all[sid].splice(i, 1); writeDemo(all); return true; }
    }
    return false;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return false;
  const { error } = await supabase.from('candidatures').delete().eq('id', id);
  if (error) { console.warn('[applications] delete:', error.message); return false; }
  return true;
}

/**
 * Compteurs par élève, pour le tableau de bord.
 * @returns {Promise<Record<string, {total:number, interviews:number, offers:number, signed:number}>>}
 */
export async function fetchApplicationStats(studentIds = []) {
  const out = {};
  if (!studentIds.length) return out;

  const tally = (list) => ({
    total: list.length,
    interviews: list.filter((a) => a.status === 'Entretien').length,
    offers: list.filter((a) => a.status === 'Proposition').length,
    signed: list.filter((a) => isPlacement(a.status)).length,
  });

  if (isDemoMode()) {
    for (const id of studentIds) out[id] = tally(demoFor(id));
    return out;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return out;
  const { data, error } = await supabase.from('candidatures')
    .select('candidate_id, statut').in('candidate_id', studentIds);
  if (error) { console.warn('[applications] stats:', error.message); return out; }
  const byStudent = {};
  for (const r of data || []) {
    (byStudent[r.candidate_id] ||= []).push({ status: r.statut });
  }
  for (const id of studentIds) out[id] = tally(byStudent[id] || []);
  return out;
}
