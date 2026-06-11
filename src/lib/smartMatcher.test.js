import { describe, it, expect } from 'vitest';
import { analyzeMatch, atsCheck } from './smartMatcher.js';

const FULL_CV = {
  prenom: 'Alice', nom: 'Dupont', email: 'alice@exemple.fr', telephone: '0600000000',
  poste: 'Assistante RH', accroche: 'Assistante RH rigoureuse, spécialisée en recrutement et gestion administrative du personnel, avec une vraie aisance relationnelle.',
  experiences: [{ poste: 'Stage RH', entreprise: 'Acme', periode: '2024', missions: ['Recrutement', 'Paie', 'Onboarding'] }],
  formations: [{ titre: 'BTS', etablissement: 'Lycée X', isTalia: false }],
  competences: { techniques: ['Recrutement', 'Paie', 'Excel', 'SIRH', 'Droit social'], comportementales: ['Écoute'], outils: [] },
  langues: [{ langue: 'Anglais' }], centresInteret: ['Lecture'],
};

describe('atsCheck', () => {
  it('un CV complet obtient un score élevé', () => {
    const r = atsCheck(FULL_CV);
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.checks.every((c) => c.ok)).toBe(true);
  });

  it('un CV vide échoue tous les contrôles', () => {
    const r = atsCheck({});
    expect(r.score).toBe(0);
    expect(r.passed).toBe(0);
  });

  it('détecte un email invalide et le manque de compétences', () => {
    const r = atsCheck({ ...FULL_CV, email: 'pas-un-email', competences: { techniques: ['Excel'] } });
    const by = Object.fromEntries(r.checks.map((c) => [c.id, c.ok]));
    expect(by.email).toBe(false);
    expect(by.competences).toBe(false);
    expect(by.identite).toBe(true);
  });

  it('chaque contrôle expose un libellé et un conseil', () => {
    for (const c of atsCheck({}).checks) {
      expect(c.label.length).toBeGreaterThan(3);
      expect(c.hint.length).toBeGreaterThan(5);
    }
  });
});

describe('analyzeMatch', () => {
  it('score élevé quand le CV couvre les mots-clés de l\'offre', () => {
    const offer = 'Nous recherchons un assistant RH pour le recrutement, la paie et la gestion administrative du personnel. Maîtrise d\'Excel et du SIRH.';
    const r = analyzeMatch(offer, FULL_CV);
    expect(r.score).toBeGreaterThan(40);
    expect(r.total).toBeGreaterThan(0);
    expect(Array.isArray(r.missing)).toBe(true);
  });

  it('renvoie un score nul pour une offre trop courte', () => {
    expect(analyzeMatch('court', FULL_CV).score).toBe(0);
  });
});
