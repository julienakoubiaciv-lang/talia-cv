import { describe, it, expect, beforeEach } from 'vitest';
import {
  PROGRESS_KEYS, snapshotLocal, hydrateLocal,
  deepMergeMax, mergePlayer, mergeBestNote, mergeProgress, progressStats,
} from './progressSync.js';

describe('deepMergeMax', () => {
  it('prend le max des nombres', () => {
    expect(deepMergeMax(3, 7)).toBe(7);
    expect(deepMergeMax(9, 2)).toBe(9);
  });
  it('union des tableaux (dédupliqués)', () => {
    expect(deepMergeMax(['a', 'b'], ['b', 'c']).sort()).toEqual(['a', 'b', 'c']);
  });
  it('récursif sur les objets', () => {
    expect(deepMergeMax({ x: 1, y: 5 }, { x: 4, z: 2 })).toEqual({ x: 4, y: 5, z: 2 });
  });
  it('garde la string la plus grande (date ISO la plus récente)', () => {
    expect(deepMergeMax('2026-01-01', '2026-06-09')).toBe('2026-06-09');
  });
  it('OU logique sur les booléens', () => {
    expect(deepMergeMax(false, true)).toBe(true);
  });
  it('gère les valeurs absentes', () => {
    expect(deepMergeMax(undefined, 5)).toBe(5);
    expect(deepMergeMax(5, undefined)).toBe(5);
  });
});

describe('mergePlayer', () => {
  it('xp et série au max, dernière activité la plus récente', () => {
    const r = mergePlayer(
      { xp: 100, dayStreak: 3, lastPlay: '2026-06-01', badges: {} },
      { xp: 250, dayStreak: 5, lastPlay: '2026-06-08', badges: {} },
    );
    expect(r.xp).toBe(250);
    expect(r.dayStreak).toBe(5);
    expect(r.lastPlay).toBe('2026-06-08');
  });
  it('badges en union, conserve la 1re date de déblocage', () => {
    const r = mergePlayer(
      { badges: { a: 1000, b: 5000 } },
      { badges: { a: 999, c: 7000 } },
    );
    expect(r.badges).toEqual({ a: 999, b: 5000, c: 7000 });
  });
  it('profil vide → valeurs par défaut', () => {
    expect(mergePlayer()).toEqual({ xp: 0, dayStreak: 0, lastPlay: null, badges: {} });
  });
});

describe('mergeBestNote', () => {
  it('meilleure note et nombre de parties maxi', () => {
    expect(mergeBestNote({ bestNote: 12, plays: 2 }, { bestNote: 16, plays: 1 }))
      .toEqual({ bestNote: 16, plays: 2 });
  });
});

describe('mergeProgress', () => {
  it('applique le bon fusionneur par clé', () => {
    const local = {
      talia_player: { xp: 100, badges: { a: 10 } },
      talia_recruit_progress: { bestNote: 8, plays: 1 },
      talia_letters_count: 3,
    };
    const remote = {
      talia_player: { xp: 300, badges: { b: 20 } },
      talia_recruit_progress: { bestNote: 14, plays: 2 },
      talia_letters_count: 5,
      talia_codes_progress: { bestNote: 18, plays: 4 },
    };
    const m = mergeProgress(local, remote);
    expect(m.talia_player.xp).toBe(300);
    expect(m.talia_player.badges).toEqual({ a: 10, b: 20 });
    expect(m.talia_recruit_progress).toEqual({ bestNote: 14, plays: 2 });
    expect(m.talia_letters_count).toBe(5);
    expect(m.talia_codes_progress).toEqual({ bestNote: 18, plays: 4 }); // clé seulement distante
  });

  it('clé présente d\'un seul côté est conservée', () => {
    expect(mergeProgress({ talia_letters_count: 2 }, {})).toEqual({ talia_letters_count: 2 });
    expect(mergeProgress({}, { talia_letters_count: 4 })).toEqual({ talia_letters_count: 4 });
  });
});

describe('progressStats', () => {
  it('extrait xp et série du profil', () => {
    expect(progressStats({ talia_player: { xp: 420, dayStreak: 7 } })).toEqual({ xp: 420, day_streak: 7 });
  });
  it('blob vide → zéros', () => {
    expect(progressStats({})).toEqual({ xp: 0, day_streak: 0 });
  });
});

describe('snapshotLocal / hydrateLocal (round-trip)', () => {
  beforeEach(() => { for (const k of PROGRESS_KEYS) localStorage.removeItem(k); });

  it('lit les clés présentes en respectant les types', () => {
    localStorage.setItem('talia_player', JSON.stringify({ xp: 50, badges: {} }));
    localStorage.setItem('talia_letters_count', '4');
    const snap = snapshotLocal();
    expect(snap.talia_player).toEqual({ xp: 50, badges: {} });
    expect(snap.talia_letters_count).toBe(4);
    expect('talia_oral_progress' in snap).toBe(false);
  });

  it('hydrate réécrit le cache (objets en JSON, nombres en chaîne)', () => {
    hydrateLocal({ talia_player: { xp: 99 }, talia_letters_count: 7 });
    expect(JSON.parse(localStorage.getItem('talia_player'))).toEqual({ xp: 99 });
    expect(localStorage.getItem('talia_letters_count')).toBe('7');
  });

  it('round-trip snapshot → hydrate → snapshot est stable', () => {
    const blob = { talia_player: { xp: 12, dayStreak: 2, lastPlay: '2026-06-09', badges: { a: 1 } }, talia_codes_progress: { bestNote: 15, plays: 3 }, talia_letters_count: 6 };
    hydrateLocal(blob);
    expect(snapshotLocal()).toEqual(blob);
  });
});
