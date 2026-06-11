/**
 * useCRMToken — Hook React wrappant crmToken.js
 *
 * Expose :
 *   crmLink     : CRMLink | null   — lien courant
 *   isLinked    : boolean
 *   linkFromURL : () => CRMLink|null — à appeler dans useEffect sur la page Home
 *   unlink      : () => void
 *   push        : (payload) => Promise<boolean> — pousse un CV vers le CRM
 */
import { useState, useCallback } from 'react';
import {
  getCRMLink,
  setCRMLink,
  removeCRMLink,
  consumeCRMTokenFromURL,
  pushCVtoCRM,
} from '@/lib/crmToken';

export function useCRMToken() {
  const [crmLink, setCrmLink] = useState(() => getCRMLink());

  /** Détecte ?altio_key= dans l'URL, stocke et nettoie. */
  const linkFromURL = useCallback(() => {
    const link = consumeCRMTokenFromURL();
    if (link) setCrmLink(link);
    return link;
  }, []);

  /** Lie manuellement via une clé de connexion collée par l'utilisateur. */
  const link = useCallback((key) => {
    const l = setCRMLink(key);
    setCrmLink(l);
    return l;
  }, []);

  /** Supprime le lien. */
  const unlink = useCallback(() => {
    removeCRMLink();
    setCrmLink(null);
  }, []);

  /** Pousse un CV vers le CRM si une clé est disponible. */
  const push = useCallback(async (payload) => {
    return pushCVtoCRM(payload);
  }, []);

  return {
    crmLink,
    isLinked: Boolean(crmLink?.key),
    linkFromURL,
    link,
    unlink,
    push,
  };
}
