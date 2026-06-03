/**
 * crmToken.js — Lien persistant entre Altio CV et un compte CRM Talia.
 *
 * Flux :
 *   1. CRM génère une URL : https://cv.talia.fr/?crm_token=TOKEN&org_id=ID&org_name=NAME
 *   2. Altio CV détecte les params au chargement, stocke le token, nettoie l'URL.
 *   3. Toutes les sauvegardes de CV incluent le token (push CRM possible hors iframe).
 *   4. L'utilisateur peut délier depuis l'interface.
 *
 * Sécurité :
 *   - Le token est opaque côté client (le CRM valide en backend).
 *   - On n'envoie jamais de données sensibles sans token.
 *   - Délier = supprimer le token du localStorage.
 */

const LS_KEY = 'talia_crm_link';

/** @typedef {{ token: string, orgId: string, orgName: string, linkedAt: string }} CRMLink */

/** Retourne le lien CRM actuel ou null. */
export function getCRMLink() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? /** @type {CRMLink} */ (JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Stocke un lien CRM. */
export function setCRMLink(token, orgId, orgName) {
  const link = {
    token,
    orgId:    orgId    || 'unknown',
    orgName:  orgName  || 'CRM',
    linkedAt: new Date().toISOString(),
  };
  localStorage.setItem(LS_KEY, JSON.stringify(link));
  return link;
}

/** Supprime le lien CRM. */
export function removeCRMLink() {
  localStorage.removeItem(LS_KEY);
}

/** True si un token valide est stocké. */
export function isCRMLinked() {
  const link = getCRMLink();
  return Boolean(link?.token);
}

/**
 * Détecte et consomme les paramètres CRM dans l'URL courante.
 * Si trouvés, stocke le lien et nettoie l'URL (sans reload).
 * @returns {CRMLink|null} le lien créé, ou null si aucun param trouvé.
 */
export function consumeCRMTokenFromURL() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token   = params.get('crm_token');
  const orgId   = params.get('org_id');
  const orgName = params.get('org_name');
  if (!token) return null;

  const link = setCRMLink(token, orgId || '', orgName || 'CRM');

  // Nettoyer l'URL — évite que le token reste visible dans l'historique
  params.delete('crm_token');
  params.delete('org_id');
  params.delete('org_name');
  const cleanSearch = params.toString() ? '?' + params.toString() : '';
  const cleanURL = window.location.pathname + cleanSearch + window.location.hash;
  window.history.replaceState({}, '', cleanURL);

  return link;
}

/**
 * Pousse un CV vers l'API CRM (mode standalone, pas iframe).
 * No-op silencieux si pas de token ou si fetch échoue.
 *
 * @param {{ name: string, cvData: object|null, html: string }} payload
 * @returns {Promise<boolean>} true si succès
 */
export async function pushCVtoCRM(payload) {
  const link = getCRMLink();
  if (!link?.token) return false;

  // Endpoint CRM — ajuste selon l'infrastructure réelle
  const endpoint = import.meta.env.VITE_CRM_WEBHOOK_URL
    || 'https://app.talia.fr/api/cv-ingest';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${link.token}`,
        'X-Org-Id':      link.orgId,
      },
      body: JSON.stringify({
        org_id:   link.orgId,
        name:     payload.name   || '',
        cv_data:  payload.cvData || null,
        html:     payload.html   || '',
        sent_at:  new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[crmToken] pushCVtoCRM error:', err.message);
    return false;
  }
}
