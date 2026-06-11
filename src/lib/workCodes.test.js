import { describe, it, expect } from 'vitest';
import {
  SCENARIOS, CODE_THEMES, listCodeThemes, buildCodesSession,
  computeNote, xpForScore, SCORE_XP,
} from './workCodes.js';

describe('workCodes — intégrité des SJT', () => {
  it('chaque scénario a une situation, un thème connu, un tip et ≥3 options', () => {
    for (const s of SCENARIOS) {
      expect(CODE_THEMES[s.theme], `thème de ${s.id}`).toBeTruthy();
      expect(s.situation.length, s.id).toBeGreaterThan(10);
      expect(s.tip.length, s.id).toBeGreaterThan(3);
      expect(s.options.length, s.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('chaque option a un score 0/1/2 et un feedback', () => {
    for (const s of SCENARIOS) {
      for (const o of s.options) {
        expect([0, 1, 2], `${s.id} score`).toContain(o.score);
        expect(o.feedback.length, `${s.id} feedback`).toBeGreaterThan(10);
      }
    }
  });

  it('chaque scénario a exactement une réaction idéale (score 2)', () => {
    for (const s of SCENARIOS) {
      const ideals = s.options.filter((o) => o.score === 2).length;
      expect(ideals, `idéales de ${s.id}`).toBe(1);
    }
  });

  it('les ids sont uniques', () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('listCodeThemes / buildCodesSession', () => {
  it('liste des thèmes non vides avec compteurs', () => {
    const themes = listCodeThemes();
    expect(themes.length).toBeGreaterThan(0);
    for (const t of themes) expect(t.count).toBeGreaterThan(0);
  });

  it('limite la session à la taille demandée', () => {
    expect(buildCodesSession({ size: 5 }).length).toBe(5);
  });

  it('filtre par thème', () => {
    const s = buildCodesSession({ theme: 'ponctualite', size: 50 });
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.theme === 'ponctualite')).toBe(true);
  });

  it('préserve une réaction idéale après mélange des options', () => {
    for (const s of buildCodesSession({ size: 50 })) {
      expect(s.options.filter((o) => o.score === 2).length).toBe(1);
    }
  });
});

describe('scoring', () => {
  it('xpForScore suit le barème', () => {
    expect(xpForScore(0)).toBe(SCORE_XP[0]);
    expect(xpForScore(2)).toBe(SCORE_XP[2]);
    expect(xpForScore(2)).toBeGreaterThan(xpForScore(1));
  });

  it('computeNote = total / (2*n) ramené sur 20', () => {
    expect(computeNote([2, 2, 2, 2])).toBe(20); // parfait
    expect(computeNote([0, 0, 0, 0])).toBe(0);
    expect(computeNote([2, 1, 1, 0])).toBe(10); // 4 / 8 * 20
    expect(computeNote([])).toBe(0);
  });
});
