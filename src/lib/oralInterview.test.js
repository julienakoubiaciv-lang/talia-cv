import { describe, it, expect } from 'vitest';
import {
  normalizeOralQuestions, normalizeEvaluation, analyzeDelivery,
  computeOralNote, FILLER_WORDS,
} from './oralInterview.js';

describe('normalizeOralQuestions', () => {
  it('garde les questions ouvertes bien formées', () => {
    const out = normalizeOralQuestions([
      { category: 'motivation', question: 'Pourquoi ce poste vous intéresse-t-il ?', hint: 'Cherche la sincérité.' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('motivation');
    expect(out[0].id).toMatch(/^oral-/);
  });

  it('accepte { questions: [...] }', () => {
    expect(normalizeOralQuestions({ questions: [{ question: 'Présentez-vous en deux minutes.' }] })).toHaveLength(1);
  });

  it('rejette une question trop courte', () => {
    expect(normalizeOralQuestions([{ question: 'Hein ?' }])).toHaveLength(0);
  });

  it('catégorie inconnue → repli sur presentation', () => {
    expect(normalizeOralQuestions([{ category: 'xxx', question: 'Parlez-moi de vous.' }])[0].category).toBe('presentation');
  });

  it('respecte le nombre max', () => {
    const arr = Array.from({ length: 9 }, (_, i) => ({ question: `Question numéro ${i} ouverte ?` }));
    expect(normalizeOralQuestions(arr, 5)).toHaveLength(5);
  });
});

describe('normalizeEvaluation', () => {
  it('borne le score entre 0 et 10', () => {
    expect(normalizeEvaluation({ score: 15 }).score).toBe(10);
    expect(normalizeEvaluation({ score: -3 }).score).toBe(0);
    expect(normalizeEvaluation({ score: 7.6 }).score).toBe(8);
  });

  it('limite les listes à 3 éléments et nettoie', () => {
    const r = normalizeEvaluation({ score: 6, strengths: ['a', '', '  b ', 'c', 'd'] });
    expect(r.strengths).toEqual(['a', 'b', 'c']);
  });

  it('fournit un verdict de repli selon le score', () => {
    expect(normalizeEvaluation({ score: 8 }).verdict).toMatch(/Bonne/);
    expect(normalizeEvaluation({ score: 3 }).verdict).toMatch(/retravailler/);
  });

  it('entrée invalide → score 0, structure cohérente', () => {
    const r = normalizeEvaluation(null);
    expect(r.score).toBe(0);
    expect(r.strengths).toEqual([]);
    expect(r.improvements).toEqual([]);
    expect(typeof r.model).toBe('string');
  });
});

describe('analyzeDelivery', () => {
  it('compte les mots', () => {
    expect(analyzeDelivery('Bonjour je suis candidat').words).toBe(4);
  });

  it('détecte les tics de langage', () => {
    const r = analyzeDelivery('Euh du coup en fait je euh travaille bien');
    expect(r.fillers).toBeGreaterThanOrEqual(3); // euh, du coup, en fait, euh
    expect(r.fillerRate).toBeGreaterThan(0);
  });

  it('ne compte pas un tic à l\'intérieur d\'un mot', () => {
    // "benitier" contient "ben" mais ne doit pas compter
    expect(analyzeDelivery('benitier cathedrale magnifique structure ancienne').fillers).toBe(0);
  });

  it('signale une réponse trop courte', () => {
    expect(analyzeDelivery('Oui voilà').tooShort).toBe(true);
    const long = analyzeDelivery(Array.from({ length: 25 }, () => 'mot').join(' '));
    expect(long.tooShort).toBe(false);
  });

  it('transcription vide : tout à zéro', () => {
    const r = analyzeDelivery('');
    expect(r).toEqual({ words: 0, fillers: 0, fillerRate: 0, tooShort: true });
  });

  it('expose une liste de tics non vide', () => {
    expect(FILLER_WORDS.length).toBeGreaterThan(5);
  });
});

describe('computeOralNote', () => {
  it('moyenne les scores /10 et convertit en /20', () => {
    expect(computeOralNote([10, 10])).toBe(20);
    expect(computeOralNote([5])).toBe(10);
    expect(computeOralNote([7, 8, 6])).toBe(14); // avg 7 → 14
  });
  it('aucun score : 0', () => {
    expect(computeOralNote([])).toBe(0);
  });
});
