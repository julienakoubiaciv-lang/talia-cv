/**
 * Vercel Serverless Function — Import CV depuis un PDF
 *
 * - Route : POST /api/parse-pdf
 * - Body  : { pdf: string (base64), apiKey?: string }
 * - Retour: { data: CvData } — JSON correspondant au schéma cvData.js
 *
 * Utilise la capacité "document" de Claude (PDF vision) : pas besoin de
 * bibliothèque de parsing tierce. Le PDF est envoyé directement comme
 * content block à l'API Anthropic.
 *
 * Région configurée dans vercel.json : cdg1 (Paris).
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb', // PDF pouvant contenir des images embarquées
    },
  },
  maxDuration: 60,
};

const EXTRACTION_PROMPT = `Tu es un expert en lecture de CV et extraction de données structurées. Analyse le CV en PDF ci-joint et extrais TOUTES les informations visibles. Retourne UNIQUEMENT un objet JSON valide — aucun texte avant ou après, aucun bloc markdown.

SCHÉMA EXACT À RESPECTER :
{
  "prenom": "string",
  "nom": "string",
  "poste": "string — titre du poste actuel ou métier recherché. Si absent, déduis-le du parcours.",
  "accroche": "string — résumé professionnel ou objectif du CV (texte brut, 2-5 phrases). Laisse vide si absent.",
  "email": "string",
  "telephone": "string — format tel que trouvé dans le CV",
  "adresse": "string — ville ou adresse (ex: Paris 75011, Lyon, France)",
  "linkedin": "string — URL LinkedIn complète ou 'linkedin.com/in/...' ou handle seul",
  "dateNaissance": "string — format JJ/MM/AAAA si présent, sinon chaîne vide",
  "experiences": [
    {
      "poste": "string — intitulé exact du poste",
      "entreprise": "string",
      "lieu": "string — ville ou pays",
      "periode": "string — ex: 'Jan. 2022 - Déc. 2023' ou 'Depuis mars 2024'",
      "missions": ["string — phrase d'action courte commençant par un verbe à l'infinitif"]
    }
  ],
  "formations": [
    {
      "titre": "string — intitulé complet du diplôme ou de la formation",
      "etablissement": "string — nom de l'école ou organisme",
      "periode": "string — ex: '2020 - 2022' ou 'Sept. 2023'",
      "isTalia": false
    }
  ],
  "competences": {
    "techniques": ["string — savoir-faire métier, méthodes, domaines d'expertise (PAS des outils)"],
    "comportementales": ["string — soft skills, qualités humaines, aptitudes relationnelles"],
    "outils": ["string — logiciels, applications, langages, plateformes, outils numériques"]
  },
  "langues": [
    { "langue": "string", "niveau": "string — ex: Natif, Bilingue, Courant, B2, Intermédiaire, Notions" }
  ],
  "centresInteret": ["string — loisirs, activités, passions mentionnées"]
}

RÈGLES D'EXTRACTION :
1. Extrais TOUTES les expériences et formations dans l'ordre chronologique inverse (plus récent en premier)
2. Missions : une phrase par bullet point d'origine — commence par un verbe à l'infinitif, max 18 mots, conserve les chiffres et résultats concrets
3. Compétences — sépare strictement :
   • techniques = ce qu'on SAIT FAIRE (ex: Gestion de projet, Comptabilité, Analyse de données)
   • outils = ce qu'on UTILISE (ex: Excel, Salesforce, Python, Figma, SAP)
   • comportementales = ce qu'on EST (ex: Rigueur, Esprit d'équipe, Autonomie)
4. Si un champ est absent du CV : chaîne vide "" pour les strings, tableau vide [] pour les arrays
5. Ne fabrique AUCUNE information absente du document
6. Retourne UNIQUEMENT le JSON brut, sans balise markdown ni commentaire`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pdf, apiKey: clientKey } = req.body || {};

  if (!pdf) return res.status(400).json({ error: 'Paramètre pdf (base64) manquant.' });

  const apiKey = clientKey || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) {
    return res.status(401).json({
      error: 'Clé API Anthropic manquante. Renseignez votre clé dans les paramètres de l\'éditeur.',
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'document',
              source: {
                type:       'base64',
                media_type: 'application/pdf',
                data:       pdf,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        }],
      }),
    });

    if (!upstream.ok) {
      const errBody = await upstream.text();
      console.error('[api/parse-pdf] Anthropic error:', errBody);
      return res.status(upstream.status).json({ error: `Erreur Anthropic : ${upstream.status}` });
    }

    const result = await upstream.json();
    const raw    = result.content?.[0]?.text || '';

    // Extraire le JSON de la réponse (Claude peut l'entourer de ```json ... ```)
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/```\s*([\s\S]*?)```/);
    const jsonStr   = jsonMatch ? jsonMatch[1].trim() : raw.trim();

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[api/parse-pdf] JSON parse error:', parseErr, '\nRaw:', raw);
      return res.status(422).json({ error: 'Claude n\'a pas retourné un JSON valide.', raw });
    }

    return res.status(200).json({ data });

  } catch (err) {
    console.error('[api/parse-pdf] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
