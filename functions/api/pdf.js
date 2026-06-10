/**
 * Cloudflare Pages Function — POST /api/pdf
 *
 * Le rendu PDF serveur (Puppeteer + Chromium, cf. ancien api/pdf.js Vercel) n'est
 * PAS disponible sur le tier gratuit Cloudflare (les Workers n'exécutent pas un
 * Chromium complet). On renvoie 501 → le front bascule automatiquement sur le
 * rendu PDF côté client (html2canvas + jsPDF, voir src/lib/pdfClient.js, qui gère
 * déjà l'échec de /api/pdf).
 *
 * Pour réactiver un PDF serveur haute qualité (texte vectoriel, ATS-friendly) :
 *   → Cloudflare Browser Rendering (Workers Paid ~5 $/mois) + binding `BROWSER`,
 *     puis implémenter le rendu Puppeteer ici via @cloudflare/puppeteer.
 */
export async function onRequest(context) {
  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  return new Response(
    JSON.stringify({ error: 'server_pdf_unavailable', fallback: 'client' }),
    { status: 501, headers: cors }
  );
}
