/**
 * pdfClient — Fallback PDF côté client (html2canvas + jsPDF).
 *
 * Stratégie utilisée en cas d'échec de /api/pdf (Puppeteer serveur) :
 *   - en dev local : /api/pdf n'est pas proxifié → toujours en échec
 *   - en prod : si Vercel timeout / crash, on a un secours
 *
 * Le rendu est moins fidèle que Puppeteer (le navigateur du client utilise
 * son propre moteur) mais reste très acceptable pour A4 portrait.
 *
 * Les libs sont importées dynamiquement (lazy) pour ne pas alourdir le bundle.
 *
 * Usage :
 *   await renderPdfFromIframe(iframe, 'CV_Jean.pdf');
 */

const A4_W_PT = 595.28;  // largeur A4 en points
const A4_H_PT = 841.89;  // hauteur A4 en points

/**
 * Génère un PDF depuis le document d'un iframe et déclenche le download.
 * @param {HTMLIFrameElement} iframe
 * @param {string} filename
 */
export async function renderPdfFromIframe(iframe, filename = 'CV.pdf') {
  const doc = iframe?.contentDocument;
  if (!doc) throw new Error('Iframe introuvable');

  // Lazy-load les 2 libs (html2canvas via CDN existant, jsPDF via npm)
  await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  const { jsPDF } = await import('jspdf');

  const cvEl = doc.querySelector('.cv-wrap') || doc.body;

  // Style anti-overflow pour éviter de couper le contenu
  doc.designMode = 'off';
  const tmpStyle = doc.createElement('style');
  tmpStyle.id = 'dsim-print-fallback';
  tmpStyle.textContent = `
    .section-title { margin-top: 20px !important; padding-top: 5px !important; }
    .section-title:first-child { margin-top: 0 !important; }
    .exp-block, .form-block, .form-talia { margin-bottom: 9px !important; }
  `;
  doc.head.appendChild(tmpStyle);

  try {
    await new Promise(r => setTimeout(r, 80));

    // Capture le CV en canvas haute résolution
    const canvas = await window.html2canvas(cvEl, {
      scale:           2,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: '#fff',
      logging:         false,
    });

    // Création du PDF A4 portrait
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit:        'pt',
      format:      'a4',
      compress:    true,
    });

    // Calcul des dimensions pour fit A4 sans déformation
    const imgWidth  = A4_W_PT;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    // Si le contenu dépasse une page → split sur plusieurs pages
    if (imgHeight <= A4_H_PT) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      let pos = 0;
      while (pos < imgHeight) {
        pdf.addImage(imgData, 'JPEG', 0, -pos, imgWidth, imgHeight, undefined, 'FAST');
        pos += A4_H_PT;
        if (pos < imgHeight) pdf.addPage();
      }
    }

    pdf.save(filename);
  } finally {
    tmpStyle.remove();
    doc.designMode = 'on';
  }
}

/**
 * Génère un PDF depuis un string HTML brut (sans iframe disponible).
 * Crée temporairement un iframe caché, render dedans, capture, supprime.
 * Utilisé par Home (PreviewModal) où il n'y a pas d'iframe de l'éditeur.
 *
 * @param {string} html
 * @param {string} filename
 */
export async function renderPdfFromHtml(html, filename = 'CV.pdf') {
  // Crée un iframe caché
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: fixed;
    top: -9999px; left: -9999px;
    width: 794px; height: 1500px;
    border: none; visibility: hidden;
  `;
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();

    // Attendre que les ressources se chargent (polices, images, etc.)
    await new Promise(r => setTimeout(r, 600));
    try { await doc.fonts?.ready; } catch {/* ignore */}

    await renderPdfFromIframe(iframe, filename);
  } finally {
    document.body.removeChild(iframe);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const _loaded = new Set();
function loadScriptOnce(src) {
  if (_loaded.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { _loaded.add(src); return resolve(); }
    const script = document.createElement('script');
    script.src   = src;
    script.async = true;
    script.onload  = () => { _loaded.add(src); resolve(); };
    script.onerror = () => reject(new Error(`Échec chargement ${src}`));
    document.head.appendChild(script);
  });
}
