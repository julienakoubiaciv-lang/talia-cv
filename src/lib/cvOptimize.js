/**
 * cvOptimize — Optimisation IA du CV pour une offre (PRO).
 *
 * À partir du CV + de l'offre + des mots-clés manquants (issus de analyzeMatch),
 * Claude réécrit l'accroche et les missions pour mieux coller à l'offre, SANS
 * RIEN INVENTER, et suggère des compétences déjà implicitement présentes.
 *
 * Passe par claude-proxy (action 'coach') → aucun changement serveur.
 * `applyOptimization` est pur (testable) ; `optimizeCvForOffer` appelle l'IA.
 */
import { callClaude } from '@/lib/claudeClient';

const SYSTEM = `Tu es un expert CV et ATS. On te donne un CV (JSON), une offre d'emploi et des mots-clés manquants.

Ta mission : optimiser le CV pour MIEUX correspondre à l'offre, SANS RIEN INVENTER.
- "accroche" : reformule pour intégrer naturellement les mots-clés PERTINENTS que le candidat possède déjà (déduits de son CV). 2-3 phrases.
- "experiences" : pour chaque expérience (même ordre, même nombre), réécris les "missions" pour faire ressortir les compétences RÉELLES avec le vocabulaire de l'offre.
- "competencesAjoutees" : uniquement des compétences déjà IMPLICITEMENT présentes dans le CV mais non listées (jamais inventées). Peut être vide.

RÈGLES STRICTES :
- N'invente AUCUNE expérience, entreprise, diplôme, ni compétence non déductible du CV.
- Conserve le même nombre d'expériences, dans le même ordre.
- Français impeccable, formulations orientées résultat.
- Réponds UNIQUEMENT en JSON valide, sans texte ni Markdown :
  { "accroche": "...", "experiences": [ { "missions": ["...", "..."] } ], "competencesAjoutees": ["..."] }`;

/** Réduit le CV à l'essentiel envoyé à l'IA (économie de tokens). */
function slimCv(d = {}) {
  return {
    poste: d.poste || '',
    accroche: d.accroche || '',
    experiences: (d.experiences || []).map((e) => ({
      poste: e.poste || '', entreprise: e.entreprise || '', missions: e.missions || [],
    })),
    competences: {
      techniques: d.competences?.techniques || [],
      comportementales: d.competences?.comportementales || [],
    },
    formations: (d.formations || []).map((f) => f.titre || (f.isTalia ? 'Formation Talia' : '')).filter(Boolean),
  };
}

/**
 * Applique une optimisation (objet IA) à un cvData, sans rien inventer.
 * Fonction PURE : ne modifie que accroche, missions (par index) et compétences ajoutées.
 * @returns {object} nouveau cvData
 */
export function applyOptimization(cvData, opt) {
  const next = JSON.parse(JSON.stringify(cvData || {}));
  if (!opt || typeof opt !== 'object') return next;

  if (typeof opt.accroche === 'string' && opt.accroche.trim()) {
    next.accroche = opt.accroche.trim();
  }

  if (Array.isArray(opt.experiences) && Array.isArray(next.experiences)) {
    next.experiences = next.experiences.map((e, i) => {
      const o = opt.experiences[i];
      if (o && Array.isArray(o.missions)) {
        const missions = o.missions.map((m) => String(m).trim()).filter(Boolean);
        if (missions.length) return { ...e, missions };
      }
      return e;
    });
  }

  if (Array.isArray(opt.competencesAjoutees) && opt.competencesAjoutees.length) {
    const existing = next.competences?.techniques || [];
    const seen = new Set(existing.map((x) => String(x).toLowerCase()));
    const add = [];
    for (const c of opt.competencesAjoutees) {
      const s = String(c).trim();
      if (s && !seen.has(s.toLowerCase())) { add.push(s); seen.add(s.toLowerCase()); }
    }
    next.competences = { ...(next.competences || {}), techniques: [...existing, ...add] };
  }

  return next;
}

/**
 * Optimise un CV pour une offre via Claude.
 * @returns {Promise<object>} cvData optimisé
 * @throws {Error|QuotaError|ClaudeProxyError}
 */
export async function optimizeCvForOffer({ cvData, offerText = '', missing = [] }) {
  if (!cvData) throw new Error('Aucun CV à optimiser.');

  const userContent =
    `OFFRE :\n${String(offerText).slice(0, 4000)}\n\n` +
    `MOTS-CLÉS MANQUANTS (à intégrer s'ils sont réels et pertinents) : ${missing.join(', ') || '(aucun)'}\n\n` +
    `CV ACTUEL (JSON) :\n${JSON.stringify(slimCv(cvData))}`;

  const res = await callClaude({
    action: 'coach',
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: userContent }],
    metadata: { feature: 'cv_optimize', missing: missing.length },
  });

  let text = (res?.content || []).map((b) => b.text || '').join('').trim();
  text = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const o = text.indexOf('{'), c = text.lastIndexOf('}');
    if (o >= 0 && c > o) parsed = JSON.parse(text.slice(o, c + 1));
    else throw new Error('Réponse de l\'IA illisible. Réessaie.');
  }

  return applyOptimization(cvData, parsed);
}
