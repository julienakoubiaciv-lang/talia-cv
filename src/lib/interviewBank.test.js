import { describe, it, expect } from 'vitest';
import { QUESTIONS, listCategories, buildSession, CATEGORIES } from './interviewBank.js';

describe('interviewBank — intégrité de la banque', () => {
  it('chaque question a exactement une bonne réponse', () => {
    for (const q of QUESTIONS) {
      const nbCorrect = q.options.filter((o) => o.correct).length;
      expect(nbCorrect, `question ${q.id}`).toBe(1);
    }
  });

  it('chaque question référence une catégorie connue + a explication et tip', () => {
    for (const q of QUESTIONS) {
      expect(CATEGORIES[q.category], `catégorie de ${q.id}`).toBeTruthy();
      expect(q.explanation.length, q.id).toBeGreaterThan(10);
      expect(q.tip.length, q.id).toBeGreaterThan(3);
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('les ids sont uniques', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('cible 30 questions / thème (étoffé par lots)', () => {
  // Thèmes déjà complétés à 30 — à compléter au fur et à mesure des lots.
  const DONE = ['presentation', 'motivation'];
  for (const cat of DONE) {
    it(`le thème "${cat}" a au moins 30 questions`, () => {
      const n = QUESTIONS.filter((q) => q.category === cat).length;
      expect(n).toBeGreaterThanOrEqual(30);
    });
  }
});

describe('listCategories', () => {
  it('ne retourne que des catégories non vides avec un compteur correct', () => {
    for (const c of listCategories()) {
      expect(c.count).toBeGreaterThan(0);
      expect(c.count).toBe(QUESTIONS.filter((q) => q.category === c.id).length);
    }
  });
});

describe('buildSession', () => {
  it('limite la session à la taille demandée', () => {
    const s = buildSession({ category: 'all', size: 5 });
    expect(s.length).toBe(5);
  });

  it('filtre par catégorie', () => {
    const s = buildSession({ category: 'salaire', size: 50 });
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((q) => q.category === 'salaire')).toBe(true);
  });

  it('préserve une bonne réponse après mélange des options', () => {
    const s = buildSession({ category: 'all', size: 8 });
    for (const q of s) {
      expect(q.options.filter((o) => o.correct).length).toBe(1);
    }
  });

  it('ne dépasse pas le pool disponible', () => {
    const s = buildSession({ category: 'all', size: 999 });
    expect(s.length).toBe(QUESTIONS.length);
  });
});
