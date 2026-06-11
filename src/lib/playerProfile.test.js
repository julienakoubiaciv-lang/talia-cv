import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProfile, getTotalXp, addXp, getDailyStreak, bumpDailyStreak,
  levelForXp, LEVELS, getBadges, hasBadge, unlockBadge, syncBadges,
} from './playerProfile.js';

beforeEach(() => { localStorage.clear(); });

describe('playerProfile — XP', () => {
  it('démarre à 0 et cumule', () => {
    expect(getTotalXp()).toBe(0);
    expect(addXp(50)).toBe(50);
    expect(addXp(25)).toBe(75);
    expect(getTotalXp()).toBe(75);
  });

  it('ignore les montants négatifs ou invalides', () => {
    addXp(40);
    addXp(-100);
    addXp();
    expect(getTotalXp()).toBe(40);
  });
});

describe('playerProfile — niveau', () => {
  it('niveau selon les paliers + progression bornée', () => {
    expect(levelForXp(0).label).toBe('Débutant');
    expect(levelForXp(200).label).toBe('Apprenti');
    const l = levelForXp(400);
    expect(l.progress).toBeGreaterThan(0);
    expect(l.progress).toBeLessThanOrEqual(100);
  });

  it('niveau max : pas de next', () => {
    const l = levelForXp(99999);
    expect(l.label).toBe(LEVELS[LEVELS.length - 1].label);
    expect(l.next).toBeNull();
  });

  it('levelForXp() sans argument lit l\'XP courante', () => {
    addXp(250);
    expect(levelForXp().label).toBe('Apprenti');
  });
});

describe('playerProfile — badges', () => {
  it('unlock idempotent + horodatage conservé', () => {
    expect(hasBadge('first-cv')).toBe(false);
    const t1 = unlockBadge('first-cv');
    expect(hasBadge('first-cv')).toBe(true);
    const t2 = unlockBadge('first-cv');
    expect(t2).toBe(t1); // date inchangée
  });

  it('syncBadges débloque les nouveaux et garde les existants', () => {
    unlockBadge('a');
    syncBadges(['a', 'b', 'c']);
    const b = getBadges();
    expect(Object.keys(b).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('playerProfile — série quotidienne', () => {
  it('premier passage = 1, idempotent le même jour', () => {
    expect(bumpDailyStreak()).toBe(1);
    expect(bumpDailyStreak()).toBe(1);
    expect(getDailyStreak()).toBe(1);
  });
});

describe('playerProfile — migration depuis altio_interview_meta', () => {
  it('reprend xp/série de l\'ancien store si aucun profil', () => {
    localStorage.setItem('altio_interview_meta', JSON.stringify({ xp: 320, lastPlay: '2026-01-01', dayStreak: 4 }));
    const p = getProfile();
    expect(p.xp).toBe(320);
    expect(p.dayStreak).toBe(4);
    expect(getTotalXp()).toBe(320);
  });
});
