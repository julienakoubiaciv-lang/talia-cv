/**
 * cvFeedback — Avis recruteur IA sur un CV (feature payante).
 *
 * Complémentaire du Banana Score (bananaScore.js) :
 *   - Banana Score = complétude structurelle (champs remplis), gratuit, client-side.
 *   - Avis recruteur = analyse qualitative par Claude, vue "30 secondes de lecture RH".
 *
 * Gating : passe par l'action 'coach' (quota_limits free=0) → verrouillé pour le Free.
 * Si quota dépassé, la QuotaError remonte telle quelle pour ouvrir l'UpgradeModal.
 *
 * Usage :
 *   import { getRecruiterFeedback } from '@/lib/cvFeedback';
 *   const fb = await getRecruiterFeedback({ cvData, offerText });
 *   // fb = { score, verdict, strengths[], weaknesses[], keywordsMissing[], improvements[] }
 */
import { callClaude } from '@/lib/claudeClient';

// Prompt système statique → mis en cache automatiquement par le proxy (économie tokens).
const RECRUITER_SYSTEM = `Tu es un recruteur senior expérimenté (15 ans en cabinet et en entreprise). On te présente un CV et tu donnes ton avis franc et constructif, exactement comme tu le ferais après l'avoir lu 30 secondes.

Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, structure EXACTE :
{
  "score": 0,                  // note globale sur 100, honnête et exigeante
  "verdict": "string",         // 1 à 2 phrases : ta première impression de recruteur, ton direct
  "strengths": ["string"],     // 2 à 4 points forts concrets, repérables dans le CV
  "weaknesses": ["string"],    // 2 à 4 faiblesses concrètes qui freinent une convocation
  "keywordsMissing": ["string"], // mots-clés/compétences attendus mais absents (vide [] si pas d'offre)
  "improvements": [            // 3 actions priorisées, concrètes, actionnables immédiatement
    { "priority": "haute", "action": "string", "why": "string" }
  ]
}

RÈGLES :
- Sois précis et concret : cite des éléments réels du CV, pas des généralités creuses.
- "priority" vaut uniquement "haute", "moyenne" ou "basse".
- Le score reflète la probabilité d'être convoqué : sois exigeant (un CV moyen tourne autour de 55-65).
- Si une offre d'emploi est fournie, évalue l'adéquation CV ↔ offre et remplis keywordsMissing.
- Si aucune offre, keywordsMissing reste un tableau vide [].
- Écris en français, ton professionnel mais direct, comme un vrai retour de recruteur.
- Réponds UNIQUEMENT avec le JSON.`;

/**
 * Construit le texte lisible du CV à soumettre au recruteur.
 * On envoie une version structurée plutôt que le HTML pour économiser des tokens.
 */
export function cvDataToText(d = {}) {
  if (!d) return '';
  const lines = [];
  const push = (label, val) => { if (val && String(val).trim()) lines.push(`${label}: ${val}`); };

  push('Nom', [d.prenom, d.nom].filter(Boolean).join(' '));
  push('Poste visé', d.poste);
  push('Accroche', d.accroche);

  if (Array.isArray(d.experiences) && d.experiences.length) {
    lines.push('\nEXPÉRIENCES:');
    d.experiences.forEach((e) => {
      lines.push(`- ${[e.poste, e.entreprise, e.lieu, e.periode].filter(Boolean).join(' | ')}`);
      (e.missions || []).filter((m) => m && m.trim()).forEach((m) => lines.push(`    • ${m}`));
    });
  }

  if (Array.isArray(d.formations) && d.formations.length) {
    lines.push('\nFORMATIONS:');
    d.formations.forEach((f) => {
      lines.push(`- ${[f.titre, f.etablissement, f.periode].filter(Boolean).join(' | ')}${f.isTalia ? ' (Talia)' : ''}`);
    });
  }

  const c = d.competences || {};
  const comp = [...(c.techniques || []), ...(c.comportementales || []), ...(c.outils || [])];
  if (comp.length) lines.push(`\nCOMPÉTENCES: ${comp.join(', ')}`);

  if (Array.isArray(d.langues) && d.langues.length) {
    lines.push(`LANGUES: ${d.langues.map((l) => [l.langue, l.niveau].filter(Boolean).join(' ')).join(', ')}`);
  }
  if (Array.isArray(d.centresInteret) && d.centresInteret.length) {
    lines.push(`INTÉRÊTS: ${d.centresInteret.join(', ')}`);
  }

  return lines.join('\n');
}

/** Normalise/valide la réponse du modèle, avec garde-fous. */
function normalizeFeedback(raw) {
  const clampPriority = (p) => (['haute', 'moyenne', 'basse'].includes(p) ? p : 'moyenne');
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => x && String(x).trim()) : []);

  let score = Number(raw?.score);
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    verdict: String(raw?.verdict || '').trim(),
    strengths: arr(raw?.strengths),
    weaknesses: arr(raw?.weaknesses),
    keywordsMissing: arr(raw?.keywordsMissing),
    improvements: arr(raw?.improvements)
      .map((i) => ({
        priority: clampPriority(i?.priority),
        action: String(i?.action || '').trim(),
        why: String(i?.why || '').trim(),
      }))
      .filter((i) => i.action),
  };
}

/**
 * Demande un avis recruteur à Claude.
 * @param {object} opts
 * @param {object} opts.cvData       - données structurées du CV
 * @param {string} [opts.offerText]  - texte d'une offre d'emploi (optionnel, active le matching)
 * @returns {Promise<{score,verdict,strengths,weaknesses,keywordsMissing,improvements}>}
 * @throws {QuotaError} si le quota 'coach' est dépassé (UI → UpgradeModal)
 */
export async function getRecruiterFeedback({ cvData, offerText = '' }) {
  const cvText = cvDataToText(cvData);
  if (!cvText.trim()) {
    throw new Error('CV vide : remplis au moins ton identité et une expérience avant de demander un avis.');
  }

  const offer = (offerText || '').trim();
  const userContent = offer
    ? `OFFRE D'EMPLOI VISÉE:\n${offer.slice(0, 4000)}\n\nCV DU CANDIDAT:\n${cvText}`
    : `CV DU CANDIDAT (aucune offre fournie, évalue dans l'absolu):\n${cvText}`;

  const res = await callClaude({
    action: 'coach',
    model: 'claude-haiku-4-5',
    max_tokens: 1200,
    system: RECRUITER_SYSTEM,
    messages: [{ role: 'user', content: userContent }],
    metadata: { hasOffer: !!offer, cvLength: cvText.length },
  });

  let text = (res?.content || []).map((b) => b.text || '').join('').trim();
  text = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const first = text.indexOf('{'), last = text.lastIndexOf('}');
    if (first >= 0 && last > first) parsed = JSON.parse(text.slice(first, last + 1));
    else throw new Error('Réponse du recruteur illisible. Réessaie dans un instant.');
  }

  return normalizeFeedback(parsed);
}
