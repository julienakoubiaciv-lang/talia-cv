import { describe, it, expect } from 'vitest';
import { computeJourney, levelForXp, LEVELS } from './journey.js';

describe('levelForXp', () => {
  it('démarre au niveau Débutant à 0 XP', () => {
    const l = levelForXp(0);
    expect(l.label).toBe('Débutant');
    expect(l.index).toBe(0);
    expect(l.next.label).toBe('Apprenti');
  });

  it('passe au niveau supérieur au franchissement du palier', () => {
    expect(levelForXp(199).label).toBe('Débutant');
    expect(levelForXp(200).label).toBe('Apprenti');
    expect(levelForXp(600).label).toBe('Confirmé');
  });

  it('calcule une progression bornée 0-100 vers le niveau suivant', () => {
    const l = levelForXp(400); // entre 200 (Apprenti) et 600 (Confirmé)
    expect(l.progress).toBeGreaterThan(0);
    expect(l.progress).toBeLessThanOrEqual(100);
    expect(l.toNext).toBe(200);
  });

  it('au niveau max : pas de next, progression 100', () => {
    const l = levelForXp(99999);
    expect(l.label).toBe(LEVELS[LEVELS.length - 1].label);
    expect(l.next).toBeNull();
    expect(l.progress).toBe(100);
  });
});

describe('computeJourney', () => {
  it('parcours vide : aucune étape validée, aucun badge', () => {
    const j = computeJourney({});
    expect(j.completed).toBe(0);
    expect(j.totalSteps).toBe(5); // 5 étapes actives (CV, métier, entraînement, validation, lettre)
    expect(j.earnedBadges).toBe(0);
    expect(j.steps.find((s) => s.id === 'lettre').locked).toBeFalsy();
  });

  it('marque l\'étape lettre quand au moins une lettre est générée', () => {
    const j = computeJourney({ lettersGenerated: 2 });
    const lettre = j.steps.find((s) => s.id === 'lettre');
    expect(lettre.done).toBe(true);
    expect(j.badges.find((b) => b.id === 'lettre').earned).toBe(true);
  });

  it('marque les étapes selon les stats', () => {
    const j = computeJourney({
      cvCount: 2, jobsValidated: 1, themesPlayed: 3, validatedThemes: 1, xp: 250, streak: 4,
    });
    const byId = Object.fromEntries(j.steps.map((s) => [s.id, s]));
    expect(byId.cv.done).toBe(true);
    expect(byId.metier.done).toBe(true);
    expect(byId.entrainement.done).toBe(true);
    expect(byId.validation.done).toBe(true);
    expect(j.completed).toBe(4);
  });

  it('débloque les badges correspondants', () => {
    const j = computeJourney({
      cvCount: 1, jobsValidated: 1, themesPlayed: 3, validatedThemes: 1, xp: 600, streak: 5,
    });
    const earned = new Set(j.badges.filter((b) => b.earned).map((b) => b.id));
    expect(earned.has('first-cv')).toBe(true);
    expect(earned.has('metier')).toBe(true);
    expect(earned.has('polyvalent')).toBe(true); // 3 thèmes
    expect(earned.has('streak')).toBe(true);      // 3 jours
    expect(earned.has('xp-100')).toBe(true);
    expect(earned.has('xp-500')).toBe(true);
  });

  it('la série < 3 ne débloque pas le badge série', () => {
    const j = computeJourney({ streak: 2 });
    expect(j.badges.find((b) => b.id === 'streak').earned).toBe(false);
  });
});
