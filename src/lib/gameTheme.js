/**
 * gameTheme — Tokens de design partagés des modules ludiques.
 *
 * Palette + police communes au simulateur d'entretien, au décrypteur de métiers,
 * au parcours, à la lettre IA et aux codes de l'entreprise. Centralisé ici pour
 * éviter la duplication (chaque page redéfinissait le même objet `C`) et garder
 * une identité visuelle cohérente.
 *
 * (Distinct de theme.js, qui gère le thème clair/sombre global de l'app.)
 */
export const FONT = "'Manrope', system-ui, sans-serif";

export const C = {
  // Texte
  ink:  '#0B1638', ink2: '#3A4156', mute: '#8390A6',
  // Surfaces / bordures
  line: '#E6EAF1', bg: '#F4F6FA',
  // Bleu de marque
  blue: '#1539B7', blueSoft: '#EEF2FF',
  // États
  green: '#0CA678', greenSoft: '#E6F8F1',
  red:   '#E03131', redSoft:   '#FFF0F0',
  amber: '#E8A500', amberSoft: '#FBF3DE',
  // Accents typés (boss, hard/soft skills)
  boss: '#7048E8', bossSoft: '#F3EEFF',
  hard: '#1539B7', soft: '#7048E8', softBg: '#F3EEFF',
};
