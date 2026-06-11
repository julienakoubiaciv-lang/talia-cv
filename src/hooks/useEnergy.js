/**
 * useEnergy — Énergie IA quotidienne, câblée au forfait + rôle.
 *
 * Combine useEntitlements (tier, staff) et aiEnergy (jetons/jour). Expose l'état
 * pour la jauge ⚡, et `ensure()` / `spend()` pour les pages qui lancent une
 * génération IA.
 *
 *   const energy = useEnergy();
 *   try { energy.ensure(); const r = await generate(); energy.spend(); }
 *   catch (e) { if (e instanceof EnergyError) ... }
 */
import { useCallback, useState } from 'react';
import { useEntitlements } from '@/hooks/useEntitlements';
import {
  capForTier, energyState, spendEnergy, EnergyError, resetLabel, ENERGY_COST,
} from '@/lib/aiEnergy';

export function useEnergy() {
  const { tier, isStaff } = useEntitlements();
  const cap = capForTier(tier, isStaff);
  const [, force] = useState(0);

  const state = energyState(cap);

  const spend = useCallback((n = ENERGY_COST) => {
    spendEnergy(n);
    force((x) => x + 1); // rafraîchit la jauge
  }, []);

  /** Lève EnergyError si plus d'énergie (sauf illimité). À appeler avant l'IA. */
  const ensure = useCallback(() => {
    const st = energyState(cap);
    if (st.empty) {
      throw new EnergyError(`Plus d'énergie IA aujourd'hui — recharge ${resetLabel()}.`);
    }
    return true;
  }, [cap]);

  return {
    ...state,            // { day, spent, cap, remaining, unlimited, empty }
    resetLabel: resetLabel(),
    spend,
    ensure,
  };
}
