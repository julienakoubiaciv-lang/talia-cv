import { describe, it, expect } from 'vitest';
import { outcomeFromCandidate, outcomeLabel, isSettled, DEFAULT_OUTCOME } from './cohortOutcome.js';

describe('outcomeFromCandidate', () => {
  it('la décision de jury prime sur tout le reste', () => {
    const c = { pipeline_status: 'in_training', statut_entreprise: 'Contrat signé' };
    expect(outcomeFromCandidate(c, { jury_decision: 'Admis' })).toBe('graduated');
  });

  it('reconnaît un placement depuis le libellé du CRM', () => {
    expect(outcomeFromCandidate({ statut_entreprise: 'Contrat signé' })).toBe('placed');
  });

  it('tolère casse et accents des libellés saisis à la main', () => {
    for (const v of ['CONTRAT SIGNE', 'contrat signé', '  Contrat Signé  ']) {
      expect(outcomeFromCandidate({ statut_entreprise: v })).toBe('placed');
    }
  });

  it('reconnaît une sortie de parcours', () => {
    expect(outcomeFromCandidate({ statut_entreprise: 'Rupture' })).toBe('dropped_out');
    expect(outcomeFromCandidate({ statut_admission: 'Abandon' })).toBe('dropped_out');
    expect(outcomeFromCandidate({ statut_admission: 'Refusé' })).toBe('dropped_out');
  });

  it('un élève en formation sans statut entreprise est en recherche', () => {
    expect(outcomeFromCandidate({ pipeline_status: 'in_training' })).toBe('job_searching');
  });

  it('un prospect reste un prospect', () => {
    expect(outcomeFromCandidate({ pipeline_status: 'prospect' })).toBe('prospect');
  });

  it('fiche vide ou absente → défaut, sans planter', () => {
    for (const v of [null, undefined, {}]) {
      expect(outcomeFromCandidate(v)).toBe(DEFAULT_OUTCOME);
    }
  });

  it("n'invente pas un placement à partir d'un statut inconnu", () => {
    expect(outcomeFromCandidate({ pipeline_status: 'in_training', statut_entreprise: 'En discussion' })).toBe('in_training');
  });
});

describe('isSettled', () => {
  it('placé, diplômé et sorti sont des parcours aboutis', () => {
    expect(isSettled('placed')).toBe(true);
    expect(isSettled('graduated')).toBe(true);
    expect(isSettled('dropped_out')).toBe(true);
  });
  it('en recherche ou en formation ne le sont pas', () => {
    expect(isSettled('job_searching')).toBe(false);
    expect(isSettled('in_training')).toBe(false);
    expect(isSettled('prospect')).toBe(false);
  });
});

describe('outcomeLabel', () => {
  it('donne un libellé lisible, même pour une valeur inconnue', () => {
    expect(outcomeLabel('placed')).toBe('Contrat signé');
    expect(outcomeLabel('n_importe_quoi')).toBeTruthy();
  });
});
