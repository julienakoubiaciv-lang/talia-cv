/**
 * watermark — Injection conditionnelle d'un watermark dans le HTML CV.
 *
 * Logique :
 *   - Tier Free  + non-owner → watermark visible (incite à upgrade)
 *   - Tier Personal/Business → pas de watermark
 *   - Owner/Admin           → jamais de watermark (bypass)
 *
 * Le watermark est injecté dans le HTML envoyé au serveur Puppeteer
 * (donc visible sur le PDF téléchargé) ET aussi en aperçu live dans l'iframe.
 *
 * Stratégie technique : on injecte une div fixed en bas de page + un texte
 * diagonal très léger en fond. La div fixed disparait en print sauf forcé
 * via @media print → on force la visibilité.
 */

const WATERMARK_HTML = `
<div class="talia-watermark-bottom" aria-hidden="true">
  Généré gratuitement avec
  <a href="https://taliacv.app" target="_blank" rel="noopener" style="color:#1539B7;text-decoration:none;font-weight:700;">Altio CV</a>
  · Passe Personnel pour le retirer
</div>
`;

const WATERMARK_CSS = `
.talia-watermark-bottom {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #E5E7EB;
  padding: 6px 14px;
  font-size: 10px;
  color: #6B7280;
  text-align: center;
  font-family: 'Manrope', system-ui, sans-serif;
  letter-spacing: 0.01em;
  z-index: 9999;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
@media print {
  .talia-watermark-bottom {
    position: fixed !important;
    bottom: 0 !important;
    display: block !important;
  }
}
`;

/**
 * Injecte le watermark dans une string HTML.
 * @param {string} html  - HTML complet (avec <head> et <body>)
 * @param {boolean} apply - false = retourne le HTML inchangé
 * @returns {string}
 */
export function injectWatermark(html, apply) {
  if (!apply || !html) return html;
  // Évite la double-injection si déjà présent
  if (html.includes('talia-watermark-bottom')) return html;

  // Injecte le CSS dans <head>
  const withCSS = html.includes('</head>')
    ? html.replace('</head>', `<style>${WATERMARK_CSS}</style></head>`)
    : `<style>${WATERMARK_CSS}</style>` + html;

  // Injecte le HTML juste avant </body>
  const withHTML = withCSS.includes('</body>')
    ? withCSS.replace('</body>', `${WATERMARK_HTML}</body>`)
    : withCSS + WATERMARK_HTML;

  return withHTML;
}

/**
 * Décide si le watermark doit être appliqué.
 * @param {object} params
 * @param {string} params.tier        - 'free' | 'personal' | 'business'
 * @param {boolean} params.isStaff    - true si owner ou admin
 * @returns {boolean}
 */
export function shouldWatermark({ tier, isStaff }) {
  if (isStaff) return false;          // Owner/admin : bypass total
  if (tier === 'free') return true;   // Free : watermark
  return false;                        // Personal/Business : pas de watermark
}
