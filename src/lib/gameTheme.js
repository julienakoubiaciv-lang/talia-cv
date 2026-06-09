/**
 * gameTheme — Tokens de design partagés (charte vivante Altio CV).
 *
 * Palette + police + échelle typo + rayons/ombres communs aux modules (entretien,
 * métiers, parcours, lettre, codes, test de recrutement, oral, bilan…) et à la
 * page /charte. Source de vérité unique.
 *
 * `C` référence des variables CSS `--altio-*` (définies dans styles/altio-theme.css)
 * → toute l'UI bascule clair/sombre via html[data-theme] (useTheme), sans toucher
 * aux composants. Pour une couleur translucide à partir d'un token, utiliser
 * `alpha(C.green, 20)` (→ color-mix) plutôt que la concaténation hex.
 */
export const FONT  = "'Manrope', system-ui, -apple-system, sans-serif";
export const SERIF = "'Playfair Display', Georgia, serif";

/** Couleurs — référencent les vars CSS de thème (clair/sombre). */
export const C = {
  // Texte
  ink:  'var(--altio-ink)', ink2: 'var(--altio-ink2)', mute: 'var(--altio-mute)',
  // Surfaces / bordures
  line: 'var(--altio-line)', line2: 'var(--altio-line2)', bg: 'var(--altio-bg)',
  card: 'var(--altio-card)', card2: 'var(--altio-card2)', track: 'var(--altio-track)',
  // Bleu de marque
  blue: 'var(--altio-blue)', blueSoft: 'var(--altio-blue-soft)', blueHover: 'var(--altio-blue-hover)',
  // États
  green: 'var(--altio-green)', greenSoft: 'var(--altio-green-soft)',
  red:   'var(--altio-red)',   redSoft:   'var(--altio-red-soft)',
  amber: 'var(--altio-amber)', amberSoft: 'var(--altio-amber-soft)',
  // Accents typés (boss, hard/soft skills)
  boss: 'var(--altio-boss)', bossSoft: 'var(--altio-boss-soft)',
  hard: 'var(--altio-blue)', soft: 'var(--altio-boss)', softBg: 'var(--altio-boss-soft)',
  star: 'var(--altio-star)',
};

/** Ombres nommées (theme-aware). */
export const SH = {
  card: 'var(--altio-shadow-card)',
  cta:  'var(--altio-shadow-cta)',
  pop:  'var(--altio-shadow-pop)',
};

/** Rayons (border-radius). */
export const R = { sm: 9, md: 13, lg: 17, pill: 99 };

/**
 * Couleur translucide à partir d'un token (ou hex), via color-mix.
 * @param {string} color - ex. C.green ('var(--altio-green)') ou '#1539B7'
 * @param {number} pct   - opacité en % (0-100)
 */
export const alpha = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Échelle typographique (UI gamifiée — Manrope). */
export const TYPE = {
  h1:    { fontSize: 32,   fontWeight: 800, letterSpacing: '-1px',   lineHeight: 1.15 },
  h2:    { fontSize: 24,   fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2  },
  h3:    { fontSize: 18,   fontWeight: 700, letterSpacing: '-0.2px', lineHeight: 1.3  },
  body:  { fontSize: 14.5, fontWeight: 500, lineHeight: 1.6 },
  label: { fontSize: 11.5, fontWeight: 800, letterSpacing: '0.6px', lineHeight: 1.4, textTransform: 'uppercase' },
};

/** Couleur d'identité par module (chips / épreuves). Hex (non thématisés). */
export const MODULES = {
  recrutement: { label: 'Recrutement', emoji: '🎯', hex: '#1539B7' },
  entretien:   { label: 'Entretien',   emoji: '🎤', hex: '#0CA678' },
  softskills:  { label: 'Soft-skills', emoji: '🧠', hex: '#7048E8' },
  cv:          { label: 'CV',          emoji: '📄', hex: '#E8590C' },
  reseau:      { label: 'Réseau',      emoji: '🤝', hex: '#1098AD' },
  motivation:  { label: 'Motivation',  emoji: '🔥', hex: '#C2255C' },
};
