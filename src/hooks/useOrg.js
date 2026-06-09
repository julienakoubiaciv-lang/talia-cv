/**
 * useOrg — Tier de parrainage organisation (école/entreprise).
 *
 * Au montage (et au login) : consomme une éventuelle invitation en attente,
 * puis lit le tier de parrainage. Fonctionne aussi en mode démo (sans auth).
 * Expose `tier` (parrainage) ou null, et `orgName`.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { redeemPendingInvite, fetchEffectiveTier, getOrgName } from '@/lib/orgAccess';

export function useOrg() {
  const { user } = useAuth();
  const [tier, setTier] = useState(null);
  const [orgName, setOrgName] = useState(() => getOrgName());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      await redeemPendingInvite();           // rejoint l'org si lien en attente
      const t = await fetchEffectiveTier();   // tier de parrainage
      if (alive) { setTier(t); setOrgName(getOrgName()); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [user]);

  return { tier, orgName, loading };
}
