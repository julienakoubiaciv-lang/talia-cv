/**
 * cohortServer — Actions encadrant côté serveur (base OCTO) + repli démo.
 *
 * Rappel du modèle OCTO : l'élève est une ligne de `candidates`, l'encadrant
 * une ligne de `profiles`, les promos `cohorts` / `cohort_members`.
 *
 * En mode démo (sans backend), tout retombe sur la couche simulée.
 */
import { supabase, supabaseReady } from './supabase';
import { isAuthenticated, getCurrentUserId } from './currentUser';
import { isDemoMode } from './demoMode';
import { createDemoInvite } from './demoOrg';
import { setStudentOutcome as setDemoOutcome, getRoster } from './demoCohort';
import { outcomeLabel } from './cohortOutcome';

/**
 * Lien d'invitation — démo uniquement.
 *
 * ⚠️ OCTO n'a pas de lien d'inscription libre : `candidate_invitations` exige
 * un `candidate_id`, c'est-à-dire une fiche candidat DÉJÀ créée. Le parcours
 * réel est l'inverse du nôtre — l'école crée la fiche, puis invite l'élève à
 * rejoindre son portail. Générer un lien « rejoins mon groupe » depuis le
 * générateur n'a donc pas d'équivalent : l'élève doit exister d'abord.
 * @returns {Promise<{token:string}|null>}
 */
export async function createInvite({ managerId, managerName, orgName = '' } = {}) {
  if (isDemoMode()) {
    return { token: createDemoInvite({ managerId, managerName, orgName }) };
  }
  return null;
}

/**
 * Relance un élève. Démo → succès simulé.
 * Réel → dépose une notification dans son espace (table `notifications`).
 *
 * L'email n'est PAS envoyé d'ici : le CRM a déjà une automatisation
 * « Candidat inactif 14j → relance ». Doubler l'envoi enverrait deux messages
 * au même élève pour la même raison.
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function nudgeStudent({ userId, message = '' } = {}) {
  if (isDemoMode()) return { ok: true };
  if (!supabaseReady || !supabase || !isAuthenticated()) return { ok: false, reason: 'not_authenticated' };
  if (!userId) return { ok: false, reason: 'student_has_no_account' };

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'coach_nudge',
    title: 'Ton conseiller t’encourage à continuer',
    body: message || 'Quelques minutes suffisent pour avancer sur ton CV ou t’entraîner à l’entretien.',
    data: { from: getCurrentUserId() },
  });
  if (error) { console.warn('[cohortServer] nudge:', error.message); return { ok: false, reason: 'send_failed' }; }
  return { ok: true };
}

/**
 * Met à jour le statut de parcours.
 *
 * ⚠️ Volontairement non implémenté côté réel. Le statut est porté par
 * `candidates.statut_entreprise` / `statut_admission`, dont les libellés
 * pilotent les automatisations du CRM (« Contrat signé » déclenche un
 * workflow). Écrire ici des valeurs choisies par le générateur créerait un
 * second vocabulaire et casserait ces déclencheurs. Cette action doit passer
 * par le CRM tant que le référentiel de statuts n'est pas partagé.
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
export async function setOutcome({ studentId, outcome } = {}) {
  if (isDemoMode()) { setDemoOutcome(studentId, outcome); return { ok: true }; }
  return { ok: false, reason: 'managed_by_crm' };
}

/**
 * Création d'une promo — démo uniquement.
 *
 * ⚠️ `cohorts` exige `formation_id` et `start_date` : une promo est rattachée
 * à une formation du catalogue et à un calendrier, informations que le
 * générateur n'a pas. Les promos se créent dans le CRM ; ici on les lit.
 */
export async function createCohort({ name } = {}) {
  if (isDemoMode()) return { id: `demo-${Date.now()}`, name };
  return null;
}

/**
 * Nombre de CV produits par élève.
 * Réel → `cv_history`, comptée par compte utilisateur.
 * @returns {Promise<Record<string, {cv_count:number, last_cv_at:string|null}>>}
 */
export async function fetchCvStats(userIds = []) {
  const out = {};
  const ids = userIds.filter(Boolean);

  if (isDemoMode()) {
    const roster = getRoster();
    for (const id of userIds) {
      const s = roster.find((r) => r.id === id);
      out[id] = { cv_count: s?.cvCount ?? 0, last_cv_at: null };
    }
    return out;
  }

  if (!supabaseReady || !supabase || !isAuthenticated() || !ids.length) return out;
  const { data, error } = await supabase.from('cv_history')
    .select('user_id, created_at').in('user_id', ids);
  if (error) { console.warn('[cohortServer] cvStats:', error.message); return out; }
  for (const row of data || []) {
    const cur = out[row.user_id] || { cv_count: 0, last_cv_at: null };
    cur.cv_count += 1;
    if (!cur.last_cv_at || row.created_at > cur.last_cv_at) cur.last_cv_at = row.created_at;
    out[row.user_id] = cur;
  }
  return out;
}

/**
 * Marque de l'organisation (logo, couleur).
 * OCTO porte déjà ces champs : `organizations.logo_url` et `primary_color`.
 * @returns {Promise<{logo_url:string|null, primary_color:string|null}|null>}
 */
export async function fetchOrgBranding(orgId) {
  if (isDemoMode()) {
    try { return JSON.parse(localStorage.getItem('altio_demo_branding') || 'null'); } catch { return null; }
  }
  if (!supabaseReady || !supabase || !isAuthenticated() || !orgId) return null;
  const { data, error } = await supabase.from('organizations')
    .select('name, logo_url, primary_color').eq('id', orgId).maybeSingle();
  if (error) { console.warn('[cohortServer] branding:', error.message); return null; }
  return data;
}

/**
 * Enregistre la marque. La policy `org_update_admin` d'OCTO réserve déjà
 * l'écriture aux administrateurs de leur propre organisation : on s'appuie
 * dessus plutôt que d'ajouter un second mécanisme de contrôle.
 * @returns {Promise<boolean>}
 */
export async function saveOrgBranding({ orgId, logoUrl = '', brandColor = '' } = {}) {
  if (isDemoMode()) {
    try { localStorage.setItem('altio_demo_branding', JSON.stringify({ logo_url: logoUrl, primary_color: brandColor })); } catch { /* ignore */ }
    return true;
  }
  if (!supabaseReady || !supabase || !isAuthenticated() || !orgId) return false;
  if (brandColor && !/^#[0-9A-Fa-f]{6}$/.test(brandColor)) return false;
  const { error } = await supabase.from('organizations').update({
    logo_url: logoUrl || null,
    primary_color: brandColor || null,
  }).eq('id', orgId);
  if (error) { console.warn('[cohortServer] saveBranding:', error.message); return false; }
  return true;
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
