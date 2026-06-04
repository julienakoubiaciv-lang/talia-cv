import { describe, it, expect } from 'vitest';
import { normalizeCoverLetter, LETTER_FORMATS, LETTER_TONES } from './coverLetter.js';

describe('normalizeCoverLetter', () => {
  it('gère l\'objet { subject, paragraphs }', () => {
    const r = normalizeCoverLetter({ subject: 'Candidature', paragraphs: ['Bonjour,', 'Je postule.', 'Cordialement.'] });
    expect(r.subject).toBe('Candidature');
    expect(r.paragraphs).toHaveLength(3);
    expect(r.text).toBe('Bonjour,\n\nJe postule.\n\nCordialement.');
  });

  it('gère le texte brut (fallback) en le découpant par paragraphes', () => {
    const r = normalizeCoverLetter('Bonjour,\n\nJe postule pour le poste.\n\nCordialement.');
    expect(r.subject).toBe('');
    expect(r.paragraphs).toHaveLength(3);
  });

  it('gère { letter: "..." }', () => {
    const r = normalizeCoverLetter({ letter: 'Para 1\n\nPara 2' });
    expect(r.paragraphs).toEqual(['Para 1', 'Para 2']);
  });

  it('nettoie les paragraphes vides et trim', () => {
    const r = normalizeCoverLetter({ paragraphs: ['  Salut  ', '', '   ', 'Fin'] });
    expect(r.paragraphs).toEqual(['Salut', 'Fin']);
  });

  it('renvoie une structure vide pour une entrée invalide', () => {
    const r = normalizeCoverLetter(null);
    expect(r.subject).toBe('');
    expect(r.paragraphs).toEqual([]);
    expect(r.text).toBe('');
  });

  it('expose des formats et tons cohérents', () => {
    expect(Object.keys(LETTER_FORMATS)).toEqual(['lettre', 'email', 'linkedin']);
    expect(Object.keys(LETTER_TONES)).toContain('equilibre');
  });
});
