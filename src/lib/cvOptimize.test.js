import { describe, it, expect } from 'vitest';
import { applyOptimization } from './cvOptimize.js';

const CV = {
  prenom: 'Alice', nom: 'Dupont', poste: 'Assistante RH', accroche: 'Ancienne accroche.',
  experiences: [
    { poste: 'Stage RH', entreprise: 'Acme', periode: '2024', missions: ['Aide au recrutement'] },
    { poste: 'Vendeuse', entreprise: 'Shop', periode: '2023', missions: ['Encaissement'] },
  ],
  competences: { techniques: ['Excel'], comportementales: ['Écoute'] },
};

describe('applyOptimization', () => {
  it('remplace l\'accroche et les missions par index', () => {
    const out = applyOptimization(CV, {
      accroche: 'Nouvelle accroche optimisée.',
      experiences: [{ missions: ['Sourcing et présélection', 'Suivi des candidatures'] }, { missions: ['Conseil client'] }],
    });
    expect(out.accroche).toBe('Nouvelle accroche optimisée.');
    expect(out.experiences[0].missions).toEqual(['Sourcing et présélection', 'Suivi des candidatures']);
    expect(out.experiences[1].missions).toEqual(['Conseil client']);
  });

  it('préserve le nombre et l\'ordre des expériences (pas d\'invention)', () => {
    const out = applyOptimization(CV, { experiences: [{ missions: ['X'] }] }); // une seule fournie
    expect(out.experiences).toHaveLength(2);
    expect(out.experiences[1].missions).toEqual(['Encaissement']); // inchangée
    expect(out.experiences[0].entreprise).toBe('Acme'); // entreprise conservée
  });

  it('ajoute les compétences sans doublon', () => {
    const out = applyOptimization(CV, { competencesAjoutees: ['Recrutement', 'excel', 'SIRH'] });
    const tech = out.competences.techniques;
    expect(tech).toContain('Recrutement');
    expect(tech).toContain('SIRH');
    // 'excel' est un doublon (insensible à la casse) → pas ajouté en double
    expect(tech.filter((x) => x.toLowerCase() === 'excel')).toHaveLength(1);
  });

  it('ignore les missions vides et trim', () => {
    const out = applyOptimization(CV, { experiences: [{ missions: ['  Net  ', '', '   '] }] });
    expect(out.experiences[0].missions).toEqual(['Net']);
  });

  it('ne mute pas le CV d\'origine', () => {
    const out = applyOptimization(CV, { accroche: 'Modif' });
    expect(out.accroche).toBe('Modif');
    expect(CV.accroche).toBe('Ancienne accroche.');
  });

  it('entrée vide → renvoie une copie inchangée', () => {
    expect(applyOptimization(CV, null).accroche).toBe('Ancienne accroche.');
  });
});
