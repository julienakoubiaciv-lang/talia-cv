/**
 * applications — Suivi léger des candidatures d'un accompagné.
 *
 * Entreprise, poste, où en est la candidature. Volontairement minimal : le
 * dossier d'admission complet reste au CRM école. Ici, l'objectif est qu'un
 * coach puisse dire « j'ai placé 8 personnes sur 12 ».
 *
 * En démo (sans backend), les candidatures vivent en localStorage pour que le
 * parcours se joue de bout en bout.
 */
import { supabase, supabaseReady } from './supabase';
import { isAuthenticated, getCurrentUserId } from './currentUser';
import { isDemoMode } from './demoMode';
import { C } from './gameTheme';

export const APP_STATUS = [
  { id: 'applied',   label: 'Envoyée',       short: 'Envoyée',   color: C.mute },
  { id: 'interview', label: 'Entretien',     short: 'Entretien', color: C.blue },
  { id: 'offer',     label: 'Proposition',   short: 'Proposition', color: C.amber },
  { id: 'signed',    label: 'Contrat signé', short: 'Signé',     color: C.green },
  { id: 'rejected',  label: 'Refus',         short: 'Refus',     color: C.red },
  { id: 'abandoned', label: 'Abandonnée',    short: 'Abandon',   color: C.mute },
];

export const DEFAULT_APP_STATUS = 'applied';

export function appStatusMeta(id) {
  return APP_STATUS.find((s) => s.id === id) || APP_STATUS[0];
}

/** Une candidature aboutie : c'est elle qui compte comme placement. */
export function isPlacement(status) {
  return status === 'signed';
}

// ── Démo ────────────────────────────────────────────────────────────────────
const LS_DEMO = 'altio_demo_applications';

function readDemo() {
  try { return JSON.parse(localStorage.getItem(LS_DEMO) || '{}'); } catch { return {}; }
}
function writeDemo(all) {
  try { localStorage.setItem(LS_DEMO, JSON.stringify(all)); } catch { /* ignore */ }
}

/** Quelques candidatures de départ, pour que la démo ne soit pas vide. */
const DEMO_SEED = {
  s1: [
    { id: 'a1', company: 'Decathlon', role_title: 'Alternance vente', status: 'signed', applied_at: '2026-03-02', interview_at: '2026-03-14' },
    { id: 'a2', company: 'Leroy Merlin', role_title: 'Conseiller rayon', status: 'rejected', applied_at: '2026-02-18' },
  ],
  s2: [
    { id: 'a3', company: 'Orange', role_title: 'Chargé de clientèle', status: 'interview', applied_at: '2026-07-20', interview_at: '2026-08-12' },
  ],
  s3: [
    { id: 'a4', company: 'BNP Paribas', role_title: 'Assistant RH', status: 'signed', applied_at: '2026-01-15', interview_at: '2026-01-29' },
  ],
  s6: [
    { id: 'a5', company: 'Carrefour', role_title: 'Alternance logistique', status: 'signed', applied_at: '2026-04-08' },
    { id: 'a6', company: 'Lidl', role_title: 'Employé polyvalent', status: 'offer', applied_at: '2026-05-02', interview_at: '2026-05-20' },
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

/** Candidatures d'un accompagné, les plus récentes d'abord. */
export async function listApplications(studentId) {
  if (!studentId) return [];
  if (isDemoMode()) return demoFor(studentId);
  if (!supabaseReady || !supabase || !isAuthenticated()) return [];
  const { data, error } = await supabase.from('applications')
    .select('id, company, role_title, status, applied_at, interview_at, notes')
    .eq('student_id', studentId)
    .order('applied_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) { console.warn('[applications] list:', error.message); return []; }
  return data || [];
}

/** Ajoute une candidature. @returns {Promise<object|null>} */
export async function addApplication({ studentId, orgId = null, company, roleTitle = '', status = DEFAULT_APP_STATUS, appliedAt = null, interviewAt = null } = {}) {
  const name = String(company || '').trim();
  if (!studentId || !name) return null;

  if (isDemoMode()) {
    const all = readDemo();
    const list = demoFor(studentId);
    const row = {
      id: `demo-${Date.now().toString(36)}`, company: name, role_title: roleTitle || null,
      status, applied_at: appliedAt || new Date().toISOString().slice(0, 10), interview_at: interviewAt || null,
    };
    all[studentId] = [row, ...list];
    writeDemo(all);
    return row;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return null;
  const { data, error } = await supabase.from('applications').insert({
    student_id: studentId, org_id: orgId, company: name, role_title: roleTitle || null,
    status, applied_at: appliedAt || new Date().toISOString().slice(0, 10),
    interview_at: interviewAt || null, created_by: getCurrentUserId(),
  }).select('id, company, role_title, status, applied_at, interview_at, notes').single();
  if (error) { console.warn('[applications] add:', error.message); return null; }
  return data;
}

/** Change l'état d'une candidature (envoyée → entretien → signée…). */
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
  const { error } = await supabase.from('applications').update(patch).eq('id', id);
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
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) { console.warn('[applications] delete:', error.message); return false; }
  return true;
}

/**
 * Compteurs par accompagné, pour le tableau de bord.
 * @returns {Promise<Record<string, {total:number, interviews:number, offers:number, signed:number}>>}
 */
export async function fetchApplicationStats(studentIds = []) {
  const empty = {};
  if (!studentIds.length) return empty;

  if (isDemoMode()) {
    for (const id of studentIds) {
      const list = demoFor(id);
      empty[id] = {
        total: list.length,
        interviews: list.filter((a) => a.status === 'interview').length,
        offers: list.filter((a) => a.status === 'offer').length,
        signed: list.filter((a) => a.status === 'signed').length,
      };
    }
    return empty;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return empty;
  const { data, error } = await supabase.from('student_application_stats')
    .select('student_id, total, interviews, offers, signed')
    .in('student_id', studentIds);
  if (error) { console.warn('[applications] stats:', error.message); return empty; }
  for (const r of data || []) {
    empty[r.student_id] = { total: r.total, interviews: r.interviews, offers: r.offers, signed: r.signed };
  }
  return empty;
}
