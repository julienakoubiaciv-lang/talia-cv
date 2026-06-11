/**
 * Cloudflare Worker — sert le SPA (assets statiques) + gère /api/pdf.
 *
 * Le rendu PDF serveur (Puppeteer/Chromium) n'existe pas sur Workers gratuit :
 * /api/pdf renvoie 501 → le front bascule sur le rendu PDF client-side
 * (html2canvas + jsPDF, cf. src/lib/pdfClient.js).
 * Pour un PDF serveur haute qualité plus tard : Cloudflare Browser Rendering
 * (Workers Paid ~5 $/mois) + binding `BROWSER`, à implémenter ici.
 *
 * Tout le reste est délégué aux assets statiques (binding ASSETS), avec
 * fallback SPA (not_found_handling: single-page-application dans wrangler.jsonc).
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/pdf') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }
      return new Response(
        JSON.stringify({ error: 'server_pdf_unavailable', fallback: 'client' }),
        { status: 501, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    // SPA + fichiers statiques
    return env.ASSETS.fetch(request);
  },
};
