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
  removeCRMLink,
  consumeCRMTokenFromURL,
  pushCVtoCRM,
  isCRMLinked,
} from '@/lib/crmToken';

export function useCRMToken() {
  const [crmLink, setCrmLink] = useState(() => getCRMLink());

  /** Détecte ?crm_token= dans l'URL, stocke et nettoie. */
  const linkFromURL = useCallback(() => {
    const link = consumeCRMTokenFromURL();
    if (link) setCrmLink(link);
    return link;
  }, []);

  /** Supprime le lien. */
  const unlink = useCallback(() => {
    removeCRMLink();
    setCrmLink(null);
  }, []);

  /** Pousse un CV vers le CRM si un token est disponible. */
  const push = useCallback(async (payload) => {
    return pushCVtoCRM(payload);
  }, []);

  return {
    crmLink,
    isLinked: Boolean(crmLink?.token),
    linkFromURL,
    unlink,
    push,
  };
}
