import { describe, it, expect } from 'vitest';
import { normalizeAISession } from './interviewAI.js';

const okQuestion = (over = {}) => ({
  category: 'parcours', difficulty: 2,
  situation: '« Parlez-moi d\'un défi que vous avez relevé. »',
  question: 'Quelle est la meilleure réponse ?',
  options: [
    { text: 'Une réponse structurée méthode STAR avec résultat chiffré', correct: true },
    { text: 'Rester vague', correct: false },
    { text: 'Dire « je sais pas »', correct: false },
    { text: 'Parler d\'autre chose', correct: false },
  ],
  explanation: 'La méthode STAR rend la réponse claire et mémorable.',
  tip: 'Termine par un résultat concret.',
  ...over,
});

describe('normalizeAISession', () => {
  it('conserve une question bien formée et mélange les options en gardant 1 correcte', () => {
    const out = normalizeAISession([okQuestion()]);
    expect(out).toHaveLength(1);
    const q = out[0];
    expect(q.kind).toBe('mcq');
    expect(q.sector).toBe('general');
    expect(q.options.filter((o) => o.correct)).toHaveLength(1);
    expect(q.options.length).toBeGreaterThanOrEqual(3);
    expect(q.id).toMatch(/^ai-/);
  });

  it('accepte aussi le format { questions: [...] }', () => {
    expect(normalizeAISession({ questions: [okQuestion()] })).toHaveLength(1);
  });

  it('rejette une question sans bonne réponse', () => {
    const bad = okQuestion({ options: [
      { text: 'a', correct: false }, { text: 'b', correct: false }, { text: 'c', correct: false },
    ] });
    expect(normalizeAISession([bad])).toHaveLength(0);
  });

  it('rejette une question avec plusieurs bonnes réponses', () => {
    const bad = okQuestion({ options: [
      { text: 'a', correct: true }, { text: 'b', correct: true },
      { text: 'c', correct: false }, { text: 'd', correct: false },
    ] });
    expect(normalizeAISession([bad])).toHaveLength(0);
  });

  it('rejette une question avec moins de 3 options', () => {
    const bad = okQuestion({ options: [
      { text: 'a', correct: true }, { text: 'b', correct: false },
    ] });
    expect(normalizeAISession([bad])).toHaveLength(0);
  });

  it('déduplique les options identiques', () => {
    const dupe = okQuestion({ options: [
      { text: 'Bonne', correct: true },
      { text: 'Mauvaise', correct: false },
      { text: 'mauvaise', correct: false }, // doublon (casse)
      { text: 'Autre', correct: false },
    ] });
    const q = normalizeAISession([dupe])[0];
    const texts = q.options.map((o) => o.text.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('remplace une catégorie inconnue par une valeur valide', () => {
    const q = normalizeAISession([okQuestion({ category: 'inexistante' })])[0];
    expect(q.category).toBe('parcours');
  });

  it('fournit un tip par défaut si manquant', () => {
    const q = normalizeAISession([okQuestion({ tip: '' })])[0];
    expect(q.tip.length).toBeGreaterThan(3);
  });

  it('limite la session au nombre demandé', () => {
    const many = Array.from({ length: 12 }, () => okQuestion());
    expect(normalizeAISession(many, 8)).toHaveLength(8);
  });

  it('renvoie un tableau vide pour une entrée invalide', () => {
    expect(normalizeAISession(null)).toEqual([]);
    expect(normalizeAISession('oops')).toEqual([]);
    expect(normalizeAISession([null, 42, {}])).toEqual([]);
  });
});
