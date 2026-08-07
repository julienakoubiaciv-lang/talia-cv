import { describe, it, expect } from 'vitest';
import { outcomeFromCandidate, outcomeLabel, isSettled, DEFAULT_OUTCOME } from './cohortOutcome.js';

describe('outcomeFromCandidate', () => {
  it('la décision de jury prime sur tout le reste', () => {
    const c = { pipeline_status: 'in_training', statut_entreprise: 'Contrat signé' };
    expect(outcomeFromCandidate(c, { jury_decision: 'Admis' })).toBe('graduated');
  });

  it("mappe les 12 valeurs de l'enum candidate_status du CRM", () => {
    const attendu = {
      prospect: 'prospect', contacted: 'prospect', dossier_recu: 'prospect', qualified: 'prospect',
      interview_planned: 'job_searching', interview_done: 'job_searching', offer_sent: 'job_searching',
      contract_signed: 'placed', placed: 'placed',
      in_training: 'in_training',
      abandoned: 'dropped_out', disqualified: 'dropped_out',
    };
    for (const [pipeline, out] of Object.entries(attendu)) {
      expect(outcomeFromCandidate({ pipeline_status: pipeline })).toBe(out);
    }
  });

  it('reconnaît un placement depuis le texte libre, en secours', () => {
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

  it('un statut de pipeline inconnu retombe sur le défaut', () => {
    expect(outcomeFromCandidate({ pipeline_status: 'valeur_future' })).toBe(DEFAULT_OUTCOME);
  });

  it('fiche vide ou absente → défaut, sans planter', () => {
    for (const v of [null, undefined, {}]) {
      expect(outcomeFromCandidate(v)).toBe(DEFAULT_OUTCOME);
    }
  });

  it("n'invente pas un placement à partir d'un texte libre inconnu", () => {
    expect(outcomeFromCandidate({ pipeline_status: 'in_training', statut_entreprise: 'En discussion' })).toBe('in_training');
  });

  it('le texte libre peut signaler une sortie que le pipeline ignore encore', () => {
    expect(outcomeFromCandidate({ pipeline_status: 'in_training', statut_entreprise: 'Rupture' })).toBe('dropped_out');
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
