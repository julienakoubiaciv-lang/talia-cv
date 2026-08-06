/**
 * cohortOutcome — Statut de parcours d'un élève (formation → diplomation).
 *
 * Le statut n'a pas de colonne dédiée : il est dérivé de ce que le CRM
 * renseigne déjà, dans cet ordre de priorité :
 *   1. cohort_members.jury_decision   → diplômé (décision de jury)
 *   2. candidates.pipeline_status     → enum `candidate_status`, la source
 *                                       canonique du CRM
 *   3. candidates.statut_entreprise   → texte libre, en secours seulement
 *
 * On ne crée pas de quatrième vocabulaire : les automatisations du CRM
 * réagissent aux valeurs existantes, en inventer casserait leurs déclencheurs.
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

/**
 * Enum `candidate_status` du CRM → statut affiché.
 * Les 12 valeurs sont couvertes : une valeur non mappée retomberait sur le
 * défaut sans qu'on s'en aperçoive.
 */
const FROM_PIPELINE = {
  prospect:          'prospect',
  contacted:         'prospect',
  dossier_recu:      'prospect',
  qualified:         'prospect',
  interview_planned: 'job_searching',
  interview_done:    'job_searching',
  offer_sent:        'job_searching',
  contract_signed:   'placed',
  placed:            'placed',
  in_training:       'in_training',
  abandoned:         'dropped_out',
  disqualified:      'dropped_out',
};

/** Comparaison tolérante à la casse et aux accents, pour le texte libre. */
const norm = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();

const PLACED_LABELS  = ['contrat signe', 'signe', 'place', 'en poste'];
const DROPPED_LABELS = ['abandon', 'refuse', 'doublon', 'rupture', 'sorti'];
const GRADUATED_JURY = ['admis', 'diplome', 'valide'];

/**
 * Statut d'un élève, dérivé de sa fiche candidat et de son inscription en promo.
 * @param {object} candidate ligne `candidates`
 * @param {object} [member]  ligne `cohort_members`
 */
export function outcomeFromCandidate(candidate, member) {
  const jury = norm(member?.jury_decision);
  if (jury && GRADUATED_JURY.some((v) => jury.includes(v))) return 'graduated';

  const mapped = FROM_PIPELINE[String(candidate?.pipeline_status || '').trim()];

  // `statut_entreprise` est du texte libre : il ne sert qu'à préciser un
  // placement ou une sortie que le pipeline n'a pas encore enregistrés.
  const entreprise = norm(candidate?.statut_entreprise);
  if (entreprise) {
    if (PLACED_LABELS.some((v) => entreprise.includes(v)))  return 'placed';
    if (DROPPED_LABELS.some((v) => entreprise.includes(v))) return 'dropped_out';
  }

  const admission = norm(candidate?.statut_admission);
  if (admission && DROPPED_LABELS.some((v) => admission.includes(v))) return 'dropped_out';

  return mapped || DEFAULT_OUTCOME;
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
