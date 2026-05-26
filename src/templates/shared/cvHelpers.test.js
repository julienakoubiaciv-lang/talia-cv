import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calcAge, ageLabel, escH } from './cvHelpers.js';

// ── calcAge ───────────────────────────────────────────────────────────────────
describe('calcAge', () => {
  beforeAll(() => {
    // Figer la date courante au 01/06/2025 pour des résultats déterministes
    vi.setSystemTime(new Date('2025-06-01'));
  });
  afterAll(() => vi.useRealTimers());

  it("calcule l'âge correct pour une date valide", () => {
    expect(calcAge('15/03/2000')).toBe(25);
  });

  it("prend en compte si l'anniversaire est passé cette année", () => {
    expect(calcAge('01/07/2000')).toBe(24); // anniversaire pas encore passé
    expect(calcAge('01/05/2000')).toBe(25); // anniversaire passé
  });

  it("retourne null pour une date vide", () => {
    expect(calcAge('')).toBeNull();
    expect(calcAge(null)).toBeNull();
    expect(calcAge(undefined)).toBeNull();
  });

  it("retourne null pour un format invalide", () => {
    expect(calcAge('not-a-date')).toBeNull();
    expect(calcAge('2000-03-15')).toBeNull(); // mauvais format (AAAA-MM-JJ)
  });
});

// ── ageLabel ─────────────────────────────────────────────────────────────────
describe('ageLabel', () => {
  beforeAll(() => vi.setSystemTime(new Date('2025-06-01')));
  afterAll(() => vi.useRealTimers());

  it("retourne ' (25 ans)' pour un âge calculable", () => {
    expect(ageLabel('15/03/2000')).toBe(' (25 ans)');
  });

  it("retourne une chaîne vide si la date est absente", () => {
    expect(ageLabel('')).toBe('');
    expect(ageLabel(null)).toBe('');
  });
});

// ── escH ─────────────────────────────────────────────────────────────────────
describe('escH', () => {
  it('échappe les caractères HTML spéciaux', () => {
    expect(escH('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('échappe les esperluettes', () => {
    expect(escH('Rock & Roll')).toBe('Rock &amp; Roll');
  });

  it("retourne une chaîne vide pour une valeur falsy", () => {
    expect(escH('')).toBe('');
    expect(escH(null)).toBe('');
    expect(escH(undefined)).toBe('');
  });

  it("ne modifie pas une chaîne sans caractères spéciaux", () => {
    expect(escH('Bonjour le monde')).toBe('Bonjour le monde');
  });
});
