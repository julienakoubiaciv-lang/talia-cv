import { describe, it, expect } from 'vitest';
import { cvDataToText } from './cvFeedback.js';

describe('cvDataToText', () => {
  it('retourne une chaîne vide pour un CV vide ou nul', () => {
    expect(cvDataToText(null)).toBe('');
    expect(cvDataToText({})).toBe('');
  });

  it('sérialise identité, poste et accroche', () => {
    const txt = cvDataToText({ prenom: 'Marie', nom: 'Lefèvre', poste: 'MARKETING', accroche: 'Passionnée.' });
    expect(txt).toContain('Nom: Marie Lefèvre');
    expect(txt).toContain('Poste visé: MARKETING');
    expect(txt).toContain('Accroche: Passionnée.');
  });

  it('liste les expériences avec leurs missions', () => {
    const txt = cvDataToText({
      experiences: [{ poste: 'Vendeuse', entreprise: 'Zara', lieu: 'Lyon', periode: '2022', missions: ['Conseil client', '', '  '] }],
    });
    expect(txt).toContain('EXPÉRIENCES:');
    expect(txt).toContain('Vendeuse | Zara | Lyon | 2022');
    expect(txt).toContain('• Conseil client');
    // les missions vides sont filtrées
    expect(txt.match(/•/g)).toHaveLength(1);
  });

  it('marque la formation Talia', () => {
    const txt = cvDataToText({ formations: [{ titre: 'Bachelor', etablissement: 'Talia', isTalia: true }] });
    expect(txt).toContain('Bachelor | Talia (Talia)');
  });

  it('fusionne toutes les catégories de compétences', () => {
    const txt = cvDataToText({
      competences: { techniques: ['SEO'], comportementales: ['Rigueur'], outils: ['Canva'] },
    });
    expect(txt).toContain('COMPÉTENCES: SEO, Rigueur, Canva');
  });

  it('formate langues et intérêts', () => {
    const txt = cvDataToText({
      langues: [{ langue: 'Anglais', niveau: 'B2' }],
      centresInteret: ['Photo', 'Danse'],
    });
    expect(txt).toContain('LANGUES: Anglais B2');
    expect(txt).toContain('INTÉRÊTS: Photo, Danse');
  });
});
