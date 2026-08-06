/**
 * cohortOutcome — Statut de parcours d'un élève (formation → diplomation).
 *
 * Partagé par le dashboard encadrant, l'export CSV et la couche démo pour
 * qu'un même statut s'affiche partout avec le même libellé et la même couleur.
 */
import { C } from './gameTheme';

export const OUTCOMES = [
  { id: 'in_training',  label: 'En formation',  short: 'Formation',  color: C.mute },
  { id: 'job_searching', label: 'En recherche',  short: 'Recherche',  color: C.amber },
  { id: 'placed',        label: 'Contrat signé', short: 'Placé',      color: C.blue },
  { id: 'graduated',     label: 'Diplômé',       short: 'Diplômé',    color: C.green },
  { id: 'employed',      label: 'En poste',      short: 'En poste',   color: C.green },
  { id: 'dropped_out',   label: 'Sorti',         short: 'Sorti',      color: C.red },
];

export const DEFAULT_OUTCOME = 'in_training';

export function outcomeMeta(id) {
  return OUTCOMES.find((o) => o.id === id) || OUTCOMES[0];
}

export function outcomeLabel(id) {
  return outcomeMeta(id).label;
}

/** Un élève dont le parcours est terminé n'a plus besoin d'être relancé. */
export function isSettled(outcome) {
  return outcome === 'placed' || outcome === 'graduated' || outcome === 'employed' || outcome === 'dropped_out';
}
