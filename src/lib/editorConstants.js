/**
 * editorConstants.js
 * Constantes partagées de l'éditeur CV : tokens de design, dimensions, timings.
 */

/** Dimensions du canvas CV (format A4 px à 96 dpi) */
export const CV_W = 794;
export const CV_H = 1122;

/** Tokens de couleur de l'interface éditeur */
export const C = {
  bluePrimary: '#1539B7',
  blueHover:   '#1F4FE0',
  blueSoft:    '#EEF2FF',
  navy:        '#0B1638',
  navyDeep:    '#0F1A40',
  ink:         '#0B1020',
  ink2:        '#3A4156',
  mute:        '#9AA0AE',
  rule:        '#ECEDF1',
  bg:          '#FFFFFF',
  surface:     '#F7F8FA',
  ok:          '#1F8A5B',
  okBg:        'rgba(31,138,91,0.10)',
  star:        '#F5B400',
};

/**
 * Temps estimé pour compléter chaque champ du CV (affiché dans les conseils BananaScore).
 */
export const TIP_TIMES = {
  prenom:       '10 sec',
  nom:          '10 sec',
  email:        '30 sec',
  telephone:    '30 sec',
  adresse:      '1 min',
  poste:        '30 sec',
  accrocheShort:'3 min',
  accrocheFull: '5 min',
  linkedin:     '30 sec',
  photo:        '2 min',
  exp1:         '10 min',
  exp2:         '8 min',
  expMissions:  '5 min',
  expPeriodes:  '2 min',
  formTalia:    '2 min',
  formExtra:    '3 min',
  compTech3:    '2 min',
  compTech6:    '3 min',
  compSoft:     '2 min',
  compOutils:   '1 min',
  langues:      '1 min',
  interets:     '30 sec',
};
