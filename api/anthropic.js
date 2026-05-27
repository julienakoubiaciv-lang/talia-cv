/**
 * Vercel Serverless Function — Proxy Anthropic API
 *
 * - Route: POST /api/anthropic
 * - La clé API est lue depuis la requête (x-api-key) ou depuis la variable
 *   d'environnement ANTHROPIC_API_KEY (priorité à celle du client pour garder
 *   le modèle "clé utilisateur" existant).
 * - Permet de supprimer l'en-tête "anthropic-dangerous-direct-browser-access"
 *   et de ne jamais exposer la clé dans le bundle front.
 *
 * Région configurée dans vercel.json : cdg1 (Paris) pour la conformité RGPD.
 */

export default async function handler(req, res) {
  // CORS — restreint à la même origine en production
  const origin = req.headers.origin || '';
  const allowed = process.env.NODE_ENV !== 'production' || origin.includes('talia');
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin || '*' : '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clé : priorité à la clé fournie par l'utilisateur, fallback env var
  const apiKey =
    req.headers['x-api-key'] ||
    process.env.ANTHROPIC_API_KEY ||
    '';

  if (!apiKey) {
    return res.status(401).json({
      error: 'Clé API Anthropic manquante. Configurez ANTHROPIC_API_KEY dans les variables d\'environnement Vercel ou renseignez votre clé dans les paramètres.',
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[api/anthropic] upstream error:', err);
    return res.status(502).json({ error: err.message });
  }
}
