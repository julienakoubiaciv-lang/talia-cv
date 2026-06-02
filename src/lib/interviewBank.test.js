import { describe, it, expect } from 'vitest';
import {
  QUESTIONS, listCategories, listSectors, listGroups, buildSession,
  groupOf, CATEGORIES, SECTORS, TYPES,
} from './interviewBank.js';

describe('interviewBank — intégrité de la banque', () => {
  it('chaque question a exactement une bonne réponse', () => {
    for (const q of QUESTIONS) {
      const nbCorrect = q.options.filter((o) => o.correct).length;
      expect(nbCorrect, `question ${q.id}`).toBe(1);
    }
  });

  it('chaque question a un secteur connu, une rubrique valide, explication, tip, ≥3 options', () => {
    for (const q of QUESTIONS) {
      expect(SECTORS[q.sector], `secteur de ${q.id}`).toBeTruthy();
      const g = groupOf(q);
      const validGroup = q.sector === 'general' ? CATEGORIES[g] : TYPES[g];
      expect(validGroup, `rubrique de ${q.id}`).toBeTruthy();
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

describe('cible 30 questions / thème (tronc commun, étoffé par lots)', () => {
  const DONE = ['presentation', 'motivation'];
  for (const cat of DONE) {
    it(`le thème "${cat}" a au moins 30 questions`, () => {
      const n = QUESTIONS.filter((q) => q.sector === 'general' && q.category === cat).length;
      expect(n).toBeGreaterThanOrEqual(30);
    });
  }
});

describe('secteurs métier — 4 couches complètes', () => {
  const metiers = listSectors().filter((s) => s.id !== 'general').map((s) => s.id);

  it('au moins commerce, admin et rh sont présents', () => {
    expect(metiers).toEqual(expect.arrayContaining(['commerce', 'admin', 'rh']));
  });

  for (const sec of ['commerce', 'admin', 'rh']) {
    it(`le secteur "${sec}" expose les 4 couches non vides`, () => {
      const groups = listGroups(sec);
      expect(groups.map((g) => g.id).sort()).toEqual(['actu', 'comportemental', 'situation', 'technique']);
      for (const g of groups) expect(g.count).toBeGreaterThan(0);
    });
  }
});

describe('listSectors / listGroups', () => {
  it('listSectors retourne general + commerce avec compteurs', () => {
    const ids = listSectors().map((s) => s.id);
    expect(ids).toContain('general');
    expect(ids).toContain('commerce');
  });

  it('listCategories (compat) = rubriques du secteur general', () => {
    expect(listCategories()).toEqual(listGroups('general'));
  });
});

describe('buildSession', () => {
  it('limite la session à la taille demandée', () => {
    const s = buildSession({ sector: 'general', group: 'all', size: 5 });
    expect(s.length).toBe(5);
  });

  it('filtre par rubrique dans le tronc commun', () => {
    const s = buildSession({ sector: 'general', group: 'salaire', size: 50 });
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((q) => q.category === 'salaire')).toBe(true);
  });

  it('filtre par type dans un secteur métier', () => {
    const s = buildSession({ sector: 'commerce', group: 'technique', size: 50 });
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((q) => q.sector === 'commerce' && q.type === 'technique')).toBe(true);
  });

  it('préserve une bonne réponse après mélange des options', () => {
    const s = buildSession({ sector: 'commerce', group: 'all', size: 8 });
    for (const q of s) expect(q.options.filter((o) => o.correct).length).toBe(1);
  });

  it('ne dépasse pas le pool du secteur', () => {
    const total = QUESTIONS.filter((q) => q.sector === 'commerce').length;
    const s = buildSession({ sector: 'commerce', group: 'all', size: 999 });
    expect(s.length).toBe(total);
  });
});
