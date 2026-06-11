import { describe, it, expect, beforeEach } from 'vitest';
import { migrateLegacyStorage } from './migrateStorage.js';

describe('migrateLegacyStorage', () => {
  beforeEach(() => localStorage.clear());

  it('renomme les clés talia_* en altio_* sans perte', () => {
    localStorage.setItem('talia_player', JSON.stringify({ xp: 540 }));
    localStorage.setItem('talia_energy', JSON.stringify({ day: '2026-06-10', spent: 3 }));
    migrateLegacyStorage();
    expect(localStorage.getItem('talia_player')).toBeNull();
    expect(JSON.parse(localStorage.getItem('altio_player'))).toEqual({ xp: 540 });
    expect(JSON.parse(localStorage.getItem('altio_energy')).spent).toBe(3);
  });

  it('mappe les clés CV vers ALTIO_CV_*', () => {
    localStorage.setItem('talia_cv_hist', '[{"id":1}]');
    localStorage.setItem('talia_cv_active_profile', 'p1');
    migrateLegacyStorage();
    expect(localStorage.getItem('ALTIO_CV_hist')).toBe('[{"id":1}]');
    expect(localStorage.getItem('ALTIO_CV_active_profile')).toBe('p1');
    expect(localStorage.getItem('talia_cv_hist')).toBeNull();
  });

  it('n\'écrase pas une nouvelle clé déjà présente', () => {
    localStorage.setItem('altio_player', JSON.stringify({ xp: 999 }));
    localStorage.setItem('talia_player', JSON.stringify({ xp: 10 }));
    migrateLegacyStorage();
    expect(JSON.parse(localStorage.getItem('altio_player')).xp).toBe(999); // conservé
    expect(localStorage.getItem('talia_player')).toBeNull();               // ancien retiré
  });

  it('idempotent : sans clé talia_, ne fait rien', () => {
    localStorage.setItem('altio_demo', '1');
    expect(migrateLegacyStorage()).toBe(0);
    expect(localStorage.getItem('altio_demo')).toBe('1');
  });
});
