/**
 * useCRMBridge — bridge postMessage entre altio-cv (iframe) et altio-saas (parent CRM)
 *
 * MESSAGES REÇUS du CRM (parent → altio-cv) :
 *   - ALTIO_CV_UPLOAD  : { candidate, file? } → ouvre Generate avec contexte candidat
 *   - ALTIO_CV_PING    : ping de vérification de présence
 *
 * MESSAGES ÉMIS vers le CRM (altio-cv → parent) :
 *   - ALTIO_CV_READY   : { version } → envoyé au mount pour signaler la disponibilité
 *   - ALTIO_CV_SAVED   : { candidate_id, org_id, cv_data, html, name } → CV sauvegardé/validé
 *   - ALTIO_CV_NAV     : { path } → navigation interne (pour info)
 *
 * STOCKAGE :
 *   - sessionStorage.altio_crm_candidate → JSON du candidat actuel (lifecycle iframe)
 */
import { useEffect, useState, useCallback } from 'react';

const TRUSTED_ORIGINS = [
  'https://crm.altio-wave.app',
  'https://altio-saas.vercel.app',
  // localhost en dev
  'http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173',
];

const CV_VERSION = '1.0.0';

// ── Détecte si on tourne dans une iframe (mode CRM intégré) ─────────────────
export function isEmbeddedInCRM() {
  try {
    return window.parent !== window && !!window.parent;
  } catch {
    return true; // si cross-origin throw → on est dans une iframe externe
  }
}

// ── Envoie un message au parent (CRM) — no-op si standalone ─────────────────
export function postToCRM(payload) {
  if (!isEmbeddedInCRM()) return false;
  try {
    // '*' acceptable car on n'envoie pas de secrets et le contenu est public CV
    window.parent.postMessage(payload, '*');
    return true;
  } catch (err) {
    console.warn('[CRMBridge] postMessage failed:', err);
    return false;
  }
}

// ── Récupère le candidat courant (depuis sessionStorage si présent) ─────────
export function getCurrentCandidate() {
  try {
    const raw = sessionStorage.getItem('altio_crm_candidate');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCurrentCandidate() {
  sessionStorage.removeItem('altio_crm_candidate');
}

// ── Hook principal : écoute les messages + expose helpers ───────────────────
export function useCRMBridge() {
  const [candidate, setCandidate] = useState(() => getCurrentCandidate());
  const [embedded] = useState(() => isEmbeddedInCRM());

  useEffect(() => {
    if (!embedded) return;

    const handler = (event) => {
      // Sécurité : vérifier l'origine (sauf pour ping qui est anodin)
      if (!event.data || typeof event.data !== 'object') return;
      const { type } = event.data;
      if (!type || !String(type).startsWith('ALTIO_CV_')) return;

      // En dev, on accepte toute origine — en prod, on filtre
      const trusted = TRUSTED_ORIGINS.some(o => event.origin === o) ||
                       import.meta.env.DEV;
      if (!trusted) {
        console.warn('[CRMBridge] message d\'origine non-trustée:', event.origin);
        return;
      }

      switch (type) {
        case 'ALTIO_CV_UPLOAD': {
          const cand = event.data.candidate;
          if (cand) {
            sessionStorage.setItem('altio_crm_candidate', JSON.stringify(cand));
            setCandidate(cand);
          }
          // file (PDF/image) optionnel — sera consommé par Generate.jsx via event custom
          if (event.data.file) {
            sessionStorage.setItem('altio_crm_pending_file', JSON.stringify(event.data.file));
            window.dispatchEvent(new CustomEvent('altio-crm-file-received', { detail: event.data.file }));
          }
          break;
        }
        case 'ALTIO_CV_PING':
          postToCRM({ type: 'ALTIO_CV_PONG', version: CV_VERSION });
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);
    // Signaler au CRM qu'on est prêt
    postToCRM({ type: 'ALTIO_CV_READY', version: CV_VERSION });
    return () => window.removeEventListener('message', handler);
  }, [embedded]);

  // ── Helpers exposés aux composants ────────────────────────────────────────
  const notifySaved = useCallback((payload) => {
    if (!embedded) return false;
    return postToCRM({
      type: 'ALTIO_CV_SAVED',
      candidate_id: candidate?.id || payload?.candidate_id || null,
      org_id: candidate?.org_id || payload?.org_id || null,
      cv_data: payload?.cv_data || null,
      html: payload?.html || null,
      name: payload?.name || null,
      saved_at: new Date().toISOString(),
    });
  }, [embedded, candidate]);

  const notifyNav = useCallback((path) => {
    if (!embedded) return false;
    return postToCRM({ type: 'ALTIO_CV_NAV', path });
  }, [embedded]);

  // ── Crée un nouveau lead/candidat dans le CRM à partir d'un CV ───────────
  const notifyCreateLead = useCallback((payload) => {
    if (!embedded) return false;
    return postToCRM({
      type: 'ALTIO_CV_CREATE_LEAD',
      cv_data: payload?.cv_data || null,
      html:    payload?.html    || null,
      name:    payload?.name    || null,
    });
  }, [embedded]);

  return { embedded, candidate, setCandidate, notifySaved, notifyNav, notifyCreateLead };
}
