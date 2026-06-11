/**
 * crmToken.js — Connecteur CV : lien entre le générateur (TaliaCV) et le CRM Altio.
 *
 * MODÈLE (décidé 2026-06-01) : comptes séparés, PAS de SSO.
 *   1. Dans le CRM (Paramètres → Connecteur CV), le conseiller génère une
 *      CLÉ DE CONNEXION personnelle (format altio_xxxxx).
 *   2. Il la colle UNE fois ici (Paramètres → Connexion CRM).
 *   3. Chaque sauvegarde de CV peut être poussée vers le CRM via l'Edge
 *      Function `import-cv`, authentifiée par le header `x-altio-key`.
 *   4. Le CV arrive dans la boîte de réception « CV reçus » du CRM (à valider).
 *
 * Sécurité : la clé est opaque côté client (le CRM la valide par hash).
 * Délier = supprimer la clé du localStorage.
 */

const LS_KEY = 'altio_crm_key';
// Edge Function du CRM (projet zxiroikfhrwsyzgqflzb). Surchargeable via env.
const IMPORT_CV_URL = import.meta.env.VITE_CRM_IMPORT_CV_URL
  || 'https://zxiroikfhrwsyzgqflzb.supabase.co/functions/v1/import-cv';

/** @typedef {{ key: string, linkedAt: string }} CRMLink */

/** Retourne le lien CRM actuel ou null. */
export function getCRMLink() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Stocke une clé de connexion CRM. */
export function setCRMLink(key) {
  const link = { key: String(key || '').trim(), linkedAt: new Date().toISOString() };
  localStorage.setItem(LS_KEY, JSON.stringify(link));
  return link;
}

/** Supprime le lien CRM. */
export function removeCRMLink() {
  localStorage.removeItem(LS_KEY);
}

/** True si une clé est stockée. */
export function isCRMLinked() {
  const link = getCRMLink();
  return Boolean(link?.key);
}

/**
 * Compat : ancien flux ?crm_token= dans l'URL. Conservé pour ne pas casser
 * Home.jsx, mais le nouveau modèle est la saisie manuelle de la clé.
 * Si un param ?altio_key= (ou ?crm_token=) est présent, on le consomme.
 * @returns {CRMLink|null}
 */
export function consumeCRMTokenFromURL() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const key = params.get('altio_key') || params.get('crm_token');
  if (!key) return null;
  const link = setCRMLink(key);
  params.delete('altio_key');
  params.delete('crm_token');
  params.delete('org_id');
  params.delete('org_name');
  const cleanSearch = params.toString() ? '?' + params.toString() : '';
  window.history.replaceState({}, '', window.location.pathname + cleanSearch + window.location.hash);
  return link;
}

/**
 * Pousse un CV vers le CRM (Edge Function import-cv).
 * No-op silencieux si pas de clé.
 *
 * @param {{ name?: string, cvData?: object|null, html?: string }} payload
 * @returns {Promise<{ ok: boolean, duplicate?: boolean, error?: string }>}
 */
export async function pushCVtoCRM(payload) {
  const link = getCRMLink();
  if (!link?.key) return { ok: false, error: 'not_linked' };

  try {
    const res = await fetch(IMPORT_CV_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-altio-key':  link.key,
      },
      body: JSON.stringify({
        name:    payload.name   || '',
        email:   payload.cvData?.email || '',
        cv_data: payload.cvData || null,
        cv_html: payload.html   || '',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || ('HTTP ' + res.status) };
    return { ok: true, duplicate: !!data.duplicate };
  } catch (err) {
    console.warn('[crmToken] pushCVtoCRM error:', err.message);
    return { ok: false, error: err.message };
  }
}
