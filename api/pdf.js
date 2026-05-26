/**
 * Vercel Serverless Function — Export PDF via Puppeteer
 *
 * - Route : POST /api/pdf
 * - Body  : { html: string, filename?: string }
 * - Retour: application/pdf (blob binaire)
 *
 * Utilise @sparticuz/chromium (Chromium léger pour serverless) + puppeteer-core.
 * Les polices Google Fonts sont chargées via import CSS — on attend document.fonts.ready.
 * Région configurée dans vercel.json : cdg1 (Paris).
 */

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb', // le HTML complet avec images encodées peut être lourd
    },
  },
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { html, filename = 'cv.pdf' } = req.body || {};
  if (!html) return res.status(400).json({ error: 'Paramètre html manquant.' });

  let browser;
  try {
    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(),
      headless:        chromium.headless,
    });

    const page = await browser.newPage();

    // Injecter le HTML complet (inclut le CSS inline et la data-URI photo)
    await page.setContent(html, { waitUntil: 'load' });

    // Attendre que toutes les polices (Google Fonts) soient prêtes
    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(Buffer.from(pdfBuffer));

  } catch (err) {
    console.error('[api/pdf] error:', err);
    if (browser) {
      try { await browser.close(); } catch {}
    }
    return res.status(500).json({ error: err.message });
  }
}
