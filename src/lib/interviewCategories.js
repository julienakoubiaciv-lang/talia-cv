/**
 * interviewCategories — Métadonnées des thèmes d'entretien (sans les questions).
 *
 * Module volontairement léger : il ne contient AUCUNE question, pour que les
 * modules qui n'ont besoin que des libellés/ids (ex. interviewProgress, utilisé
 * sur l'accueil) ne tirent pas toute la banque dans leur bundle.
 */
export const CATEGORIES = {
  presentation: { label: 'Présentation',            emoji: '👋', color: '#1539B7' },
  motivation:   { label: 'Motivation',              emoji: '🔥', color: '#E8590C' },
  parcours:     { label: 'Parcours (méthode STAR)', emoji: '📈', color: '#0CA678' },
  faiblesses:   { label: 'Forces & faiblesses',     emoji: '⚖️', color: '#7048E8' },
  entreprise:   { label: 'Connaissance entreprise', emoji: '🏢', color: '#1098AD' },
  salaire:      { label: 'Négociation salaire',     emoji: '💶', color: '#C2255C' },
  posture:      { label: 'Savoir-être & posture',   emoji: '🧍', color: '#5C940D' },
  cloture:      { label: 'Clôture & relance',       emoji: '🤝', color: '#3B5BDB' },
};

/**
 * Secteurs métier. 'general' = tronc commun comportemental (les 8 thèmes ci-dessus).
 * Les autres secteurs déclinent leurs questions par TYPE (voir TYPES).
 */
export const SECTORS = {
  general:   { label: 'Général',              emoji: '🎯', color: '#1539B7' },
  commerce:  { label: 'Vente / Commerce',     emoji: '🛒', color: '#E8590C' },
  marketing: { label: 'Marketing / Com',      emoji: '📣', color: '#7048E8' },
  rh:        { label: 'Ressources Humaines',  emoji: '👥', color: '#0CA678' },
  admin:     { label: 'Administratif',        emoji: '🗂️', color: '#1098AD' },
  finance:   { label: 'Finance / Compta',     emoji: '💶', color: '#C2255C' },
};

/** Les 4 couches d'un parcours sectoriel. */
export const TYPES = {
  comportemental: { label: 'Comportemental',    emoji: '🧠', color: '#1539B7' },
  technique:      { label: 'Technique métier',  emoji: '🛠️', color: '#0CA678' },
  situation:      { label: 'Mise en situation', emoji: '🎭', color: '#7048E8' },
  actu:           { label: 'Actu & tendances',  emoji: '📰', color: '#E8590C' },
};
