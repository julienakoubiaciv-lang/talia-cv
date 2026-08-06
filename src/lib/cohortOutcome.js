/**
 * cohortOutcome — Statut de parcours d'un élève (formation → diplomation).
 *
 * ⚠️ Le statut n'a PAS de colonne dédiée : il est dérivé de ce que le CRM
 * renseigne déjà. Trois sources, de la plus décisive à la plus générale :
 *   1. cohort_members.jury_decision  → diplômé / ajourné
 *   2. candidates.statut_entreprise  → placement (« Contrat signé »…)
 *   3. candidates.pipeline_status    → phase (prospect / in_training)
 *
 * On ne crée pas de quatrième vocabulaire : les automatisations du CRM
 * réagissent aux libellés existants, en inventer casserait leurs déclencheurs.
 */
import { C } from './gameTheme';

export const OUTCOMES = [
  { id: 'prospect',      label: 'Prospect',      short: 'Prospect',  color: C.mute },
  { id: 'in_training',   label: 'En formation',  short: 'Formation', color: C.blue },
  { id: 'job_searching', label: 'En recherche',  short: 'Recherche', color: C.amber },
  { id: 'placed',        label: 'Contrat signé', short: 'Placé',     color: C.green },
  { id: 'graduated',     label: 'Diplômé',       short: 'Diplômé',   color: C.green },
  { id: 'dropped_out',   label: 'Sorti',         short: 'Sorti',     color: C.red },
];

export const DEFAULT_OUTCOME = 'prospect';

/** Libellés du CRM valant placement, insensibles à la casse et aux accents. */
const norm = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();

const PLACED_LABELS   = ['contrat signe', 'signe', 'place', 'en poste'];
const DROPPED_LABELS  = ['abandon', 'refuse', 'doublon', 'rupture', 'sorti'];
const GRADUATED_JURY  = ['admis', 'diplome', 'valide'];

/**
 * Statut d'un élève, dérivé de sa fiche candidat et de son inscription en promo.
 * @param {object} candidate ligne `candidates`
 * @param {object} [member]  ligne `cohort_members`
 */
export function outcomeFromCandidate(candidate, member) {
  const jury = norm(member?.jury_decision);
  if (jury && GRADUATED_JURY.some((v) => jury.includes(v))) return 'graduated';

  const entreprise = norm(candidate?.statut_entreprise);
  if (entreprise) {
    if (PLACED_LABELS.some((v) => entreprise.includes(v)))  return 'placed';
    if (DROPPED_LABELS.some((v) => entreprise.includes(v))) return 'dropped_out';
  }

  const admission = norm(candidate?.statut_admission);
  if (admission && DROPPED_LABELS.some((v) => admission.includes(v))) return 'dropped_out';

  const pipeline = norm(candidate?.pipeline_status);
  if (pipeline === 'in_training') {
    // En formation sans placement renseigné : l'élève est en recherche.
    return entreprise ? 'in_training' : 'job_searching';
  }
  return DEFAULT_OUTCOME;
}

export function outcomeMeta(id) {
  return OUTCOMES.find((o) => o.id === id) || OUTCOMES[0];
}

export function outcomeLabel(id) {
  return outcomeMeta(id).label;
}

/** Un élève dont le parcours est abouti n'a plus besoin d'être relancé. */
export function isSettled(outcome) {
  return outcome === 'placed' || outcome === 'graduated' || outcome === 'dropped_out';
}
