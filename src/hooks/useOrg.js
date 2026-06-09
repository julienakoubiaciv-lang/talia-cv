/**
 * useOrg — Tier de parrainage organisation (école/entreprise).
 *
 * Au login : consomme une éventuelle invitation en attente, puis lit le tier
 * effectif côté serveur. Expose `tier` (le tier effectif serveur) ou null
 * (hors-ligne / non connecté → l'app retombe sur le tier perso).
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { redeemPendingInvite, fetchEffectiveTier } from '@/lib/orgAccess';

export function useOrg() {
  const { user } = useAuth();
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setTier(null); return; }
    let alive = true;
    setLoading(true);
    (async () => {
      await redeemPendingInvite();          // rejoint l'org si lien en attente
      const t = await fetchEffectiveTier();  // max(perso, parrainage)
      if (alive) { setTier(t); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [user]);

  return { tier, loading };
}
