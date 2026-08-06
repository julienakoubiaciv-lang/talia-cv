import { describe, it, expect } from 'vitest';
import {
  statsFromProgress, pillarsFromProgress, moduleBreakdown, badgesFromProgress, hasProgress,
} from './studentProgress.js';

const BLOB = {
  altio_player: { xp: 1240, dayStreak: 4, badges: ['first_cv', 'oral_pro'] },
  altio_interview_progress: { motivation: { best: 80, plays: 3 }, parcours: { best: 60, plays: 1 } },
  altio_jobs_progress: { vendeur: { validated: true }, rh: { validated: false } },
  altio_codes_progress: { bestNote: 16, plays: 2 },
  altio_recruit_progress: { bestNote: 12, plays: 1 },
  altio_oral_progress: { bestNote: 18, plays: 4 },
  altio_letters_count: 2,
};

describe('statsFromProgress', () => {
  it('traduit les notes des modules', () => {
    const s = statsFromProgress(BLOB);
    expect(s.codesBest).toBe(16);
    expect(s.oralBest).toBe(18);
    expect(s.recruitBest).toBe(12);
    expect(s.lettersGenerated).toBe(2);
    expect(s.jobsValidated).toBe(1);
  });

  it("moyenne l'entretien sur tous les thèmes, pas seulement ceux joués", () => {
    // 80 + 60 = 140 réparti sur les 8 thèmes du référentiel → 18
    expect(statsFromProgress(BLOB).interviewOverall).toBe(18);
  });

  it('blob vide ou absent → tout à zéro, sans planter', () => {
    for (const v of [null, undefined, {}, 'nope', 42]) {
      const s = statsFromProgress(v);
      expect(s.codesBest).toBe(0);
      expect(s.interviewOverall).toBe(0);
      expect(s.jobsValidated).toBe(0);
    }
  });

  it('ignore les valeurs non numériques', () => {
    const s = statsFromProgress({ altio_codes_progress: { bestNote: 'seize' }, altio_letters_count: null });
    expect(s.codesBest).toBe(0);
    expect(s.lettersGenerated).toBe(0);
  });
});

describe('pillarsFromProgress', () => {
  it('produit un pilier par domaine et un score global', () => {
    const d = pillarsFromProgress(BLOB);
    expect(d.pillars.length).toBeGreaterThan(0);
    expect(d.global).toBeGreaterThanOrEqual(0);
    expect(d.global).toBeLessThanOrEqual(100);
  });

  it('sans CV produit, le pilier CV reste à zéro', () => {
    const cv = pillarsFromProgress(BLOB).pillars.find((p) => p.id === 'cv');
    expect(cv.score).toBe(0);
  });

  it('un CV produit fait monter le pilier CV', () => {
    const cv = pillarsFromProgress(BLOB, { cv_count: 2 }).pillars.find((p) => p.id === 'cv');
    expect(cv.score).toBeGreaterThan(0);
  });

  it('progression vide → score global nul', () => {
    expect(pillarsFromProgress({}).global).toBe(0);
  });
});

describe('moduleBreakdown', () => {
  it('compte les thèmes joués et les métiers validés', () => {
    const m = moduleBreakdown(BLOB);
    expect(m.find((x) => x.id === 'entretien').done).toBe(2);
    expect(m.find((x) => x.id === 'metiers').done).toBe(1);
    expect(m.find((x) => x.id === 'oral').note).toBe(18);
    expect(m.find((x) => x.id === 'lettres').count).toBe(2);
  });

  it('blob vide → tout à zéro', () => {
    const m = moduleBreakdown(null);
    expect(m.find((x) => x.id === 'entretien').done).toBe(0);
    expect(m.find((x) => x.id === 'codes').note).toBe(0);
  });
});

describe('badgesFromProgress', () => {
  it('accepte un tableau', () => {
    expect(badgesFromProgress(BLOB)).toEqual(['first_cv', 'oral_pro']);
  });
  it('accepte un objet de drapeaux', () => {
    expect(badgesFromProgress({ altio_player: { badges: { a: true, b: false } } })).toEqual(['a']);
  });
  it('absent → tableau vide', () => {
    expect(badgesFromProgress({})).toEqual([]);
    expect(badgesFromProgress(null)).toEqual([]);
  });
});

describe('hasProgress', () => {
  it('distingue un accompagné actif d’un compte jamais utilisé', () => {
    expect(hasProgress(BLOB)).toBe(true);
    expect(hasProgress({})).toBe(false);
    expect(hasProgress(null)).toBe(false);
  });
});
