/**
 * cohortServer — Actions encadrant côté serveur (réel) + repli démo.
 *
 * - createInvite : insère un lien d'invitation (org_invites) côté serveur.
 * - nudgeStudent : enregistre une relance (student_nudges) ; un job/Edge enverra
 *   l'email/notif réel.
 *
 * En mode démo (sans backend), on retombe sur la couche simulée (demoOrg).
 */
import { supabase, supabaseReady } from './supabase';
import { isAuthenticated, getCurrentUserId } from './currentUser';
import { isDemoMode } from './demoMode';
import { createDemoInvite } from './demoOrg';
import { setStudentOutcome as setDemoOutcome, getRoster } from './demoCohort';
import { outcomeLabel } from './cohortOutcome';

const randToken = () =>
  'INV-' + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).toUpperCase();

/**
 * Crée un lien d'invitation. Démo → lien simulé. Réel → ligne org_invites.
 * @returns {Promise<{token:string}|null>}
 */
export async function createInvite({ orgId, managerId, managerName, cohortId = null, orgName = '' } = {}) {
  if (isDemoMode()) {
    return { token: createDemoInvite({ managerId, managerName, orgName }) };
  }
  if (!supabaseReady || !supabase || !isAuthenticated()) return null;
  const token = randToken();
  const { error } = await supabase.from('org_invites').insert({
    token, org_id: orgId, manager_id: managerId || getCurrentUserId(), cohort_id: cohortId,
    max_uses: 1000,
  });
  if (error) { console.warn('[cohortServer] createInvite:', error.message); return null; }
  return { token };
}

/**
 * Relance un élève par email via l'Edge Function send-nudge (qui vérifie les
 * droits, envoie le message et journalise le résultat réel dans student_nudges).
 * Démo → succès simulé (l'UI affiche le toast).
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function nudgeStudent({ studentId, orgId = null, message = '' } = {}) {
  if (isDemoMode()) return { ok: true };
  if (!supabaseReady || !supabase || !isAuthenticated()) return { ok: false, reason: 'not_authenticated' };
  const { data, error } = await supabase.functions.invoke('send-nudge', {
    body: { student_id: studentId, org_id: orgId, message },
  });
  if (error || !data?.ok) {
    const reason = data?.error || error?.message || 'send_failed';
    console.warn('[cohortServer] nudge:', reason);
    return { ok: false, reason };
  }
  return { ok: true };
}

/**
 * Met à jour le statut de parcours d'un élève (en formation → diplômé…).
 * Démo → mise à jour du roster simulé.
 * @returns {Promise<boolean>}
 */
export async function setOutcome({ studentId, orgId, outcome } = {}) {
  if (isDemoMode()) { setDemoOutcome(studentId, outcome); return true; }
  if (!supabaseReady || !supabase || !isAuthenticated()) return false;
  const { error } = await supabase.from('org_members')
    .update({ outcome, outcome_updated_at: new Date().toISOString() })
    .eq('user_id', studentId).eq('org_id', orgId);
  if (error) { console.warn('[cohortServer] setOutcome:', error.message); return false; }
  return true;
}

/** Crée une promo dans l'organisation. Démo → promo locale. */
export async function createCohort({ orgId, name } = {}) {
  if (isDemoMode()) return { id: `demo-${Date.now()}`, name };
  if (!supabaseReady || !supabase || !isAuthenticated() || !orgId) return null;
  const { data, error } = await supabase.from('cohorts')
    .insert({ org_id: orgId, name }).select('id, name').single();
  if (error) { console.warn('[cohortServer] createCohort:', error.message); return null; }
  return data;
}

/**
 * Nombre de CV produits par accompagné (jamais leur contenu : la vue
 * student_cv_stats n'expose que des compteurs).
 * @returns {Promise<Record<string, {cv_count:number, last_cv_at:string|null}>>}
 */
export async function fetchCvStats(studentIds = []) {
  const out = {};
  if (!studentIds.length) return out;

  if (isDemoMode()) {
    const roster = getRoster();
    for (const id of studentIds) {
      const s = roster.find((r) => r.id === id);
      out[id] = { cv_count: s?.cvCount ?? 0, last_cv_at: null };
    }
    return out;
  }

  if (!supabaseReady || !supabase || !isAuthenticated()) return out;
  const { data, error } = await supabase.from('student_cv_stats')
    .select('student_id, cv_count, last_cv_at')
    .in('student_id', studentIds);
  if (error) { console.warn('[cohortServer] cvStats:', error.message); return out; }
  for (const r of data || []) out[r.student_id] = { cv_count: r.cv_count, last_cv_at: r.last_cv_at };
  return out;
}

/** Construit un CSV de la cohorte (pur, testable). */
export function rosterToCSV(students = [], nameOf = (id) => id, cohortNameOf = () => '') {
  const head = ['Nom', 'Email', 'Promo', 'Conseiller', 'Statut', 'Employabilité (%)', 'XP', 'Série (j)', 'Dernière activité'];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = students.map((s) => [
    s.name, s.email, cohortNameOf(s.cohortId), nameOf(s.manager), outcomeLabel(s.outcome),
    typeof s.employability === 'number' ? s.employability : '',
    s.xp ?? 0, s.streak ?? 0, s.lastActive ?? '',
  ].map(esc).join(';'));
  return [head.join(';'), ...rows].join('\r\n');
}

/** Déclenche le téléchargement d'un CSV. */
export function downloadCSV(filename, csv) {
  try {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  } catch { /* ignore */ }
}
