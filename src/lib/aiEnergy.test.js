import { describe, it, expect, beforeEach } from 'vitest';
import {
  DAILY_ENERGY, capForTier, computeRemaining, dayKey, msUntilReset,
  readEnergy, spendEnergy, getSpent, energyState, EnergyError,
} from './aiEnergy.js';

describe('capForTier', () => {
  it('renvoie la capacité du forfait', () => {
    expect(capForTier('free')).toBe(DAILY_ENERGY.free);
    expect(capForTier('personal')).toBe(40);
    expect(capForTier('business')).toBe(Infinity);
  });
  it('forfait inconnu → free', () => {
    expect(capForTier('xxx')).toBe(DAILY_ENERGY.free);
  });
  it('staff → illimité quel que soit le forfait', () => {
    expect(capForTier('free', true)).toBe(Infinity);
  });
});

describe('computeRemaining', () => {
  it('cap - spent, borné à 0', () => {
    expect(computeRemaining(2, 5)).toBe(3);
    expect(computeRemaining(9, 5)).toBe(0);
  });
  it('illimité', () => {
    expect(computeRemaining(100, Infinity)).toBe(Infinity);
  });
});

describe('msUntilReset', () => {
  it('compte jusqu\'à minuit', () => {
    const at22 = new Date(2026, 5, 9, 22, 0, 0); // 22:00 → 2 h
    expect(msUntilReset(at22)).toBe(2 * 3_600_000);
  });
});

describe('dayKey', () => {
  it('format YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('stockage énergie', () => {
  beforeEach(() => { try { localStorage.removeItem('talia_energy'); } catch { /* */ } });

  it('démarre à 0 dépensé', () => {
    expect(getSpent()).toBe(0);
  });

  it('spendEnergy incrémente', () => {
    spendEnergy();
    spendEnergy(2);
    expect(getSpent()).toBe(3);
  });

  it('réinitialise quand le jour change', () => {
    localStorage.setItem('talia_energy', JSON.stringify({ day: '2000-01-01', spent: 4 }));
    expect(readEnergy().spent).toBe(0); // jour périmé → reset
  });

  it('energyState calcule restant / vide', () => {
    spendEnergy(5);
    const st = energyState(5);
    expect(st.spent).toBe(5);
    expect(st.remaining).toBe(0);
    expect(st.empty).toBe(true);
    expect(st.unlimited).toBe(false);
  });

  it('energyState illimité n\'est jamais vide', () => {
    spendEnergy(100);
    const st = energyState(Infinity);
    expect(st.unlimited).toBe(true);
    expect(st.empty).toBe(false);
    expect(st.remaining).toBe(Infinity);
  });
});

describe('EnergyError', () => {
  it('est une Error nommée', () => {
    const e = new EnergyError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('EnergyError');
  });
});
