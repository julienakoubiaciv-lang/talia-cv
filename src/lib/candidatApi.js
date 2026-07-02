/**
 * candidatApi — accès à l'espace candidat depuis le générateur (mode élève).
 *
 * Réutilise l'API legacy du CRM (`crm.altio-wave.com/api/candidat/*`), qui
 * accepte le JWT étudiant OCTO (auth duale via resolveCandidate) et fait déjà
 * tout le travail : timeline d'admission, URLs signées des documents,
 * candidatures, rendez-vous, upload/suppression de pièces (bucket
 * candidate-docs, un fichier par type). CORS ouvert côté API.
 *
 * Prérequis : le générateur pointe le MÊME projet Supabase (OCTO) — fait au
 * cutover du 2026-07-02 — sinon le JWT est rejeté.
 */
import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_LEGACY_API_BASE || 'https://crm.altio-wave.com';

async function authHeader() {
  const { data: { session } = {} } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Session expirée — reconnecte-toi.');
  return { Authorization: `Bearer ${session.access_token}` };
}

/** Infos complètes de l'espace candidat (fiche, admission, docs, candidatures, rdv, cv). */
export async function fetchCandidatInfo() {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/candidat/info`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Espace candidat indisponible (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Dépose (ou remplace) un document. `file` = File du <input type="file">. */
export async function uploadCandidatDoc(docType, file) {
  const headers = await authHeader();
  const fd = new FormData();
  fd.append('doc_type', docType);
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/api/candidat/upload-doc`, {
    method: 'POST', headers, body: fd,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Dépôt échoué (${res.status})`);
  return body;
}

/** Supprime le document d'un type donné. */
export async function deleteCandidatDoc(docType) {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/candidat/delete-doc`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_type: docType }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Suppression échouée (${res.status})`);
  return body;
}

/* ── Référentiels partagés avec l'espace candidat legacy ─────────────────── */

export const UPLOADABLE_DOC_TYPES = [
  { key: 'cni',                    label: "Pièce d'identité" },
  { key: 'photo',                  label: "Photo d'identité" },
  { key: 'diplome',                label: 'Diplôme / Attestation' },
  { key: 'releve_notes',           label: 'Relevé de notes' },
  { key: 'lettre_motivation',      label: 'Lettre de motivation' },
  { key: 'justificatif_domicile',  label: 'Justificatif de domicile' },
  { key: 'rib',                    label: 'RIB' },
  { key: 'secu',                   label: 'Carte vitale / attestation' },
  { key: 'autre',                  label: 'Autre document' },
];

export function docTypeLabel(key) {
  return UPLOADABLE_DOC_TYPES.find((d) => d.key === key)?.label || key || 'Document';
}

export const ADMISSION_STEPS = [
  { key: 'depot',     label: 'Dépôt dossier' },
  { key: 'tests',     label: "Tests d'admission" },
  { key: 'entretien', label: 'Entretien' },
  { key: 'decision',  label: 'Décision' },
  { key: 'admis',     label: 'Admis' },
];

export function formatDateFR(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export function formatDateTimeFR(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export function humanSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
