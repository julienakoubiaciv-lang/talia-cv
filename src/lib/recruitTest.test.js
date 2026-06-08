import { describe, it, expect } from 'vitest';
import {
  normalizeRecruitTest, computeTestScore, describeTestTarget,
  listTestCategories, TEST_CATEGORIES,
} from './recruitTest.js';

const q = (over = {}) => ({
  category: 'metier', difficulty: 2,
  question: 'Quelle action est prioritaire ?',
  explanation: 'Parce que c\'est la plus sûre.',
  options: [
    { text: 'Bonne', correct: true },
    { text: 'Mauvaise 1', correct: false },
    { text: 'Mauvaise 2', correct: false },
    { text: 'Mauvaise 3', correct: false },
  ],
  ...over,
});

describe('TEST_CATEGORIES / listTestCategories', () => {
  it('expose les cinq catégories attendues', () => {
    expect(Object.keys(TEST_CATEGORIES)).toEqual(['logique', 'numerique', 'verbal', 'metier', 'situation']);
  });
  it('metier et situation sont adaptatives, les aptitudes non', () => {
    expect(TEST_CATEGORIES.metier.adaptive).toBe(true);
    expect(TEST_CATEGORIES.situation.adaptive).toBe(true);
    expect(TEST_CATEGORIES.logique.adaptive).toBe(false);
  });
  it('listTestCategories renvoie id + label pour chaque', () => {
    const list = listTestCategories();
    expect(list).toHaveLength(5);
    list.forEach((c) => { expect(c.id).toBeTruthy(); expect(c.label.length).toBeGreaterThan(3); });
  });
});

describe('describeTestTarget', () => {
  it('inclut entreprise, poste, secteur et annonce', () => {
    const t = describeTestTarget({ company: 'Acme', roleTitle: 'Vendeur', sectorLabel: 'Commerce', offerText: 'Vente en magasin' });
    expect(t).toContain('Entreprise : Acme');
    expect(t).toContain('Poste visé : Vendeur');
    expect(t).toContain('Secteur d\'activité : Commerce');
    expect(t).toContain('Annonce :');
    expect(t).toContain('Vente en magasin');
  });
  it('cible vide : message de repli', () => {
    expect(describeTestTarget({})).toMatch(/cible non précisée/);
    expect(describeTestTarget()).toMatch(/cible non précisée/);
  });
  it('tronque une annonce très longue', () => {
    const t = describeTestTarget({ offerText: 'x'.repeat(8000) });
    expect(t.length).toBeLessThan(4100);
  });
});

describe('normalizeRecruitTest', () => {
  it('garde une question bien formée', () => {
    const out = normalizeRecruitTest([q()]);
    expect(out).toHaveLength(1);
    expect(out[0].options).toHaveLength(4);
    expect(out[0].options.filter((o) => o.correct)).toHaveLength(1);
    expect(out[0].id).toMatch(/^rt-/);
  });

  it('accepte un objet { questions: [...] }', () => {
    expect(normalizeRecruitTest({ questions: [q()] })).toHaveLength(1);
  });

  it('rejette une question sans bonne réponse', () => {
    const bad = q({ options: q().options.map((o) => ({ ...o, correct: false })) });
    expect(normalizeRecruitTest([bad])).toHaveLength(0);
  });

  it('rejette une question à 2 options', () => {
    const bad = q({ options: [{ text: 'a', correct: true }, { text: 'b', correct: false }] });
    expect(normalizeRecruitTest([bad])).toHaveLength(0);
  });

  it('rejette une explication trop courte', () => {
    expect(normalizeRecruitTest([q({ explanation: 'ok' })])).toHaveLength(0);
  });

  it('réduit à 4 options si l\'IA en renvoie plus', () => {
    const many = q({ options: [
      { text: 'Bonne', correct: true },
      { text: 'M1', correct: false }, { text: 'M2', correct: false },
      { text: 'M3', correct: false }, { text: 'M4', correct: false },
    ] });
    expect(normalizeRecruitTest([many])[0].options).toHaveLength(4);
  });

  it('catégorie inconnue → repli sur metier', () => {
    expect(normalizeRecruitTest([q({ category: 'inventee' })])[0].category).toBe('metier');
  });

  it('respecte le nombre max demandé', () => {
    const arr = Array.from({ length: 12 }, () => q());
    expect(normalizeRecruitTest(arr, 8)).toHaveLength(8);
  });
});

describe('computeTestScore', () => {
  it('calcule la note /20 et le détail par catégorie', () => {
    const r = computeTestScore([
      { category: 'logique', correct: true },
      { category: 'logique', correct: false },
      { category: 'metier', correct: true },
      { category: 'metier', correct: true },
    ]);
    expect(r.correct).toBe(3);
    expect(r.total).toBe(4);
    expect(r.note).toBe(15);
    expect(r.byCategory.logique).toEqual({ correct: 1, total: 2 });
    expect(r.byCategory.metier).toEqual({ correct: 2, total: 2 });
  });

  it('test vide : note 0', () => {
    expect(computeTestScore([]).note).toBe(0);
  });

  it('sans faute : 20/20', () => {
    expect(computeTestScore([{ category: 'verbal', correct: true }]).note).toBe(20);
  });
});
