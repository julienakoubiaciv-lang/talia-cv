import { describe, it, expect } from 'vitest';
import { computeDiagnostic, tierForScore } from './employability.js';

describe('tierForScore', () => {
  it('renvoie le bon palier', () => {
    expect(tierForScore(90).label).toBe('Prêt à l\'emploi');
    expect(tierForScore(70).label).toBe('Solide');
    expect(tierForScore(50).label).toBe('En bonne voie');
    expect(tierForScore(10).label).toBe('À construire');
  });
});

describe('computeDiagnostic', () => {
  it('profil vide : score 0, tout en axe de progression', () => {
    const d = computeDiagnostic({});
    expect(d.global).toBe(0);
    expect(d.pillars).toHaveLength(5);
    expect(d.strengths).toHaveLength(0);
    expect(d.gaps).toHaveLength(5);
  });

  it('profil complet : score élevé, des forces', () => {
    const d = computeDiagnostic({
      cvExists: true, cvAts: 100, interviewOverall: 90,
      jobsValidated: 3, jobsCovered: 3, codesBest: 18, lettersGenerated: 2,
    });
    expect(d.global).toBeGreaterThanOrEqual(85);
    expect(d.tier.label).toBe('Prêt à l\'emploi');
    expect(d.strengths.length).toBeGreaterThanOrEqual(4);
    expect(d.gaps).toHaveLength(0);
  });

  it('le pilier CV est 0 sans CV même avec un score ATS', () => {
    const d = computeDiagnostic({ cvExists: false, cvAts: 100 });
    expect(d.pillars.find((p) => p.id === 'cv').score).toBe(0);
  });

  it('convertit la note codes /20 en pourcentage', () => {
    const d = computeDiagnostic({ codesBest: 10 });
    expect(d.pillars.find((p) => p.id === 'codes').score).toBe(50);
  });

  it('le pilier métier = validés / disponibles', () => {
    const d = computeDiagnostic({ jobsValidated: 1, jobsCovered: 4 });
    expect(d.pillars.find((p) => p.id === 'metier').score).toBe(25);
  });

  it('les axes de progression sont triés du plus faible au plus fort', () => {
    const d = computeDiagnostic({ cvExists: true, cvAts: 40, interviewOverall: 10, codesBest: 0 });
    const gapScores = d.gaps.map((g) => g.score);
    expect(gapScores).toEqual([...gapScores].sort((a, b) => a - b));
  });

  it('chaque pilier expose un libellé, une reco et un CTA', () => {
    for (const p of computeDiagnostic({}).pillars) {
      expect(p.label.length).toBeGreaterThan(3);
      expect(p.reco.length).toBeGreaterThan(10);
      expect(p.cta.startsWith('/')).toBe(true);
    }
  });
});
