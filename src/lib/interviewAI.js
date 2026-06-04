/**
 * interviewAI — Sessions d'entretien personnalisées (PRO), générées par Claude.
 *
 * À partir du CV du candidat (+ offre visée optionnelle), génère une série de
 * questions d'entretien sur-mesure, au MÊME format que la banque statique
 * (situation / question / options[{text,correct}] / explanation / tip), donc
 * directement jouable par le moteur du simulateur.
 *
 * Passe par l'Edge Function claude-proxy via l'action 'coach' (déjà gérée par le
 * quota côté serveur) → aucune modification serveur nécessaire.
 */
import { callClaude } from '@/lib/claudeClient';
import { cvDataToText } from '@/lib/cvFeedback';
import { shuffle } from '@/lib/interviewBank';
import { CATEGORIES } from '@/lib/interviewCategories';

const VALID_CATS = Object.keys(CATEGORIES);

const SESSION_SYSTEM = `Tu es un recruteur expérimenté qui prépare un candidat à SON entretien.
À partir de son CV et, si fournie, de l'offre visée, génère des questions d'entretien
personnalisées, réalistes et progressives (du comportemental au plus pointu).

RÈGLES STRICTES :
- Réponds UNIQUEMENT par un tableau JSON valide, sans texte autour, sans balises Markdown.
- Chaque élément du tableau a EXACTEMENT cette forme :
  {
    "category": "<un de: ${VALID_CATS.join(', ')}>",
    "difficulty": 1|2|3,
    "situation": "la question posée par le recruteur, ou la mise en situation",
    "question": "la consigne (ex: 'Quelle est la meilleure réponse ?')",
    "options": [
      {"text": "...", "correct": true},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false}
    ],
    "explanation": "pourquoi la bonne réponse est la meilleure (1-2 phrases pédagogiques)",
    "tip": "un conseil court et actionnable"
  }
- EXACTEMENT 4 options, une SEULE avec "correct": true.
- Les mauvaises réponses doivent être plausibles mais piégeuses (erreurs fréquentes,
  tics de langage, attitudes inadaptées).
- Personnalise vraiment : appuie-toi sur le parcours, les compétences et le poste visé.
- Français, ton bienveillant et concret. Pas de question hors-sujet.`;

/**
 * Valide et normalise la sortie brute de Claude en questions jouables.
 * Tolérante : ignore les questions mal formées plutôt que de tout rejeter.
 * @param {any} raw  - tableau (ou objet {questions:[...]}) renvoyé par l'IA
 * @param {number} count - nombre max de questions à conserver
 * @returns {Array} questions normalisées (format moteur)
 */
export function normalizeAISession(raw, count = 8) {
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.questions) ? raw.questions : []);
  const out = [];

  arr.forEach((q, i) => {
    if (!q || typeof q !== 'object') return;

    // Options : texte non vide, dédupliquées, exactement 1 correcte, 3-4 au total
    let options = (Array.isArray(q.options) ? q.options : [])
      .filter((o) => o && typeof o.text === 'string' && o.text.trim())
      .map((o) => ({ text: o.text.trim(), correct: !!o.correct }));

    const seen = new Set();
    options = options.filter((o) => {
      const k = o.text.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (options.length < 3 || options.length > 6) {
      if (options.length > 6) options = options.slice(0, 4);
      else return;
    }
    if (options.filter((o) => o.correct).length !== 1) return;

    const situation = String(q.situation || q.question || '').trim();
    const question = String(q.question || 'Quelle est la meilleure réponse ?').trim();
    const explanation = String(q.explanation || '').trim();
    if (!situation || explanation.length < 8) return;

    const category = VALID_CATS.includes(q.category) ? q.category : 'parcours';
    const difficulty = [1, 2, 3].includes(q.difficulty) ? q.difficulty : 2;
    const tip = String(q.tip || '').trim() || 'Prépare un exemple concret pour appuyer ta réponse.';
    const context = typeof q.context === 'string' && q.context.trim() ? q.context.trim() : undefined;

    out.push({
      sector: 'general', category, kind: 'mcq', difficulty,
      id: `ai-${Date.now()}-${i}`,
      situation, question,
      options: shuffle(options),
      explanation, tip,
      ...(context ? { context } : {}),
    });
  });

  return out.slice(0, count);
}

/**
 * Génère une session d'entretien personnalisée via Claude.
 * @param {object} opts
 * @param {object} opts.cvData     - données CV du candidat
 * @param {string} [opts.offerText]- texte de l'offre visée (optionnel)
 * @param {number} [opts.count]    - nombre de questions souhaité (défaut 8)
 * @returns {Promise<Array>} questions jouables par le moteur
 * @throws {Error|QuotaError|ClaudeProxyError}
 */
export async function generateInterviewSession({ cvData, offerText = '', count = 8 }) {
  const cvText = cvDataToText(cvData);
  if (!cvText.trim()) {
    throw new Error('CV vide : génère ou sélectionne d\'abord un CV avant de lancer une session personnalisée.');
  }

  const offer = (offerText || '').trim();
  const userContent =
    `POSTE / OFFRE VISÉE :\n${offer ? offer.slice(0, 4000) : '(non précisée — déduis le poste le plus probable à partir du CV)'}\n\n` +
    `CV DU CANDIDAT :\n${cvText}\n\n` +
    `Génère ${count} questions d'entretien personnalisées pour ce candidat.`;

  const res = await callClaude({
    action: 'coach',
    model: 'claude-haiku-4-5',
    max_tokens: 3500,
    system: SESSION_SYSTEM,
    messages: [{ role: 'user', content: userContent }],
    metadata: { feature: 'ai_interview', hasOffer: !!offer, count, cvLength: cvText.length },
  });

  let text = (res?.content || []).map((b) => b.text || '').join('').trim();
  text = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Récupère le premier tableau (ou objet) JSON présent dans la réponse
    const a = text.indexOf('['), b = text.lastIndexOf(']');
    if (a >= 0 && b > a) {
      parsed = JSON.parse(text.slice(a, b + 1));
    } else {
      const o = text.indexOf('{'), c = text.lastIndexOf('}');
      if (o >= 0 && c > o) parsed = JSON.parse(text.slice(o, c + 1));
      else throw new Error('Réponse de l\'IA illisible. Réessaie dans un instant.');
    }
  }

  const session = normalizeAISession(parsed, count);
  if (!session.length) {
    throw new Error('La génération n\'a produit aucune question exploitable. Réessaie.');
  }
  return session;
}
