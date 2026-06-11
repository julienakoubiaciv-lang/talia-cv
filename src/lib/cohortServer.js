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
 * Relance un élève (trace la demande ; l'envoi réel est fait côté serveur).
 * Démo → succès simulé (l'UI affiche le toast).
 * @returns {Promise<boolean>}
 */
export async function nudgeStudent({ studentId, orgId = null, message = '' } = {}) {
  if (isDemoMode()) return true;
  if (!supabaseReady || !supabase || !isAuthenticated()) return false;
  const { error } = await supabase.from('student_nudges').insert({
    student_id: studentId, org_id: orgId, manager_id: getCurrentUserId(), message, channel: 'email',
  });
  if (error) { console.warn('[cohortServer] nudge:', error.message); return false; }
  return true;
}

/** Construit un CSV de la cohorte (pur, testable). */
export function rosterToCSV(students = [], nameOf = (id) => id) {
  const head = ['Nom', 'Email', 'Conseiller', 'Employabilité (%)', 'XP', 'Série (j)', 'Dernière activité'];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = students.map((s) => [
    s.name, s.email, nameOf(s.manager),
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
