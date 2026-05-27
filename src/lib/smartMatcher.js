// ─── SMART MATCHER — Analyse de correspondance offre/CV ──────────────────────

const STOP_WORDS = new Set([
  'le','la','les','un','une','des','de','du','en','et','ou','à','au','aux',
  'par','pour','dans','sur','avec','son','sa','ses','ce','cette','ces','qui',
  'que','dont','être','avoir','faire','nous','vous','ils','notre','votre',
  'leur','plus','très','bien','tout','tous','peut','doit','sera','pas','ne',
  'ni','aussi','mais','donc','car','si','comme','entre','sous','sans',
  'après','avant','depuis','même','autre','chaque','plusieurs','peu',
  'beaucoup','trop','fois','type','profil','recherche','poste','contrat',
  'société','missions','mission','expérience','formation','diplôme',
  'minimum','idéalement','recherchons','candidat','entreprise','activités',
  'bac','vers','chez','contre','lors','dont','donc','puis','afin','selon',
  'lors','dès','soit','cela','celle','celui','ceux','celles','voici',
  'sera','seront','seraient','avons','avez','avaient','sont','était',
  'étaient','sera','serait','seraient',
]);

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ─── Stemmer français simplifié ───────────────────────────────────────────────
// Réduit les formes fléchies à une racine commune pour améliorer la correspondance.
// Ex: développement → developp, commerciale → commercial, analysons → analys
const SUFFIXES = [
  // Noms déverbaux / déadjectivaux — les plus longs d'abord
  'isation','isations','ification','ifications',
  'issement','issements',
  'ellement','ations','ements','ement','ation','ation',
  'istes','iste','iques','ique','eurs','euses','euse','eur',
  'ages','age','ures','ure','tions','tion',
  'ives','ive','ifs','tifs','tive','tives','tif',
  'ales','aux','ale','elles','elle',
  // Verbes — infinitifs et participes
  'issant','issante','ant','ante','ants','antes',
  'ées','ée','és','é','er','ir','oir',
  'ais','ait','aient','ions','iez',
  // Pluriels simples
  'ux','s',
];

export function stem(raw) {
  const word = normalize(raw);
  if (word.length <= 4) return word;
  for (const suf of SUFFIXES) {
    if (word.endsWith(suf)) {
      const root = word.slice(0, word.length - suf.length);
      if (root.length >= 4) return root;
    }
  }
  return word;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüÿçœæ\-]/g, ' ')
    .split(/\s+/)
    .map(normalize)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
}

function freq(tokens) {
  return tokens.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
}

// Correspondance étendue : exact OU partiel (préfixe) OU racine commune
function flexMatch(a, b) {
  if (a === b) return true;
  const minLen = Math.min(a.length, b.length);
  // Préfixe long commun (≥ 5 chars, 75% du plus court)
  if (minLen >= 5) {
    const prefixLen = Math.max(4, Math.floor(minLen * 0.75));
    if (a.slice(0, prefixLen) === b.slice(0, prefixLen)) return true;
  }
  // Racines communes (stemming)
  if (stem(a) === stem(b)) return true;
  return false;
}

/**
 * analyzeMatch(offerText, cvData)
 * Analyse locale (synchrone) — retourne { present, missing, score, total }
 */
export function analyzeMatch(offerText, cvData) {
  if (!offerText || offerText.trim().length < 30 || !cvData) {
    return { present: [], missing: [], score: 0, total: 0 };
  }

  // 1. Extraire top 30 mots-clés de l'offre
  const offerTokens   = tokenize(offerText);
  const offerFreq     = freq(offerTokens);
  const offerKeywords = Object.entries(offerFreq)
    .filter(([w]) => !STOP_WORDS.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => w);

  // 2. Construire le corpus texte du CV
  const cvText = [
    cvData.poste,
    cvData.accroche,
    ...(cvData.experiences || []).flatMap(e => [
      e.poste, e.entreprise, ...(e.missions || []),
    ]),
    ...(cvData.formations || []).map(f => [f.titre, f.etablissement]).flat(),
    ...(cvData.competences?.techniques       || []),
    ...(cvData.competences?.comportementales || []),
    ...(cvData.competences?.outils           || []),
    ...(cvData.langues || []).map(l => l.langue),
    ...(cvData.centresInteret || []),
  ].filter(Boolean).join(' ');

  const cvTokens = [...new Set(tokenize(cvText))];

  // 3. Classifier avec correspondance flexible (exact + préfixe + stemming)
  const present = [];
  const missing = [];

  offerKeywords.forEach(kw => {
    const inCV = cvTokens.some(t => flexMatch(kw, t));
    if (inCV) present.push(kw);
    else      missing.push(kw);
  });

  const score = offerKeywords.length > 0
    ? Math.round((present.length / offerKeywords.length) * 100)
    : 0;

  return { present, missing, score, total: offerKeywords.length };
}

// ─── Analyse sémantique via Claude API ───────────────────────────────────────

const ANTHROPIC_URL = '/api/anthropic';

/**
 * analyzeMatchSemantic(offerText, cvData, apiKey)
 *
 * Appel Claude pour une analyse sémantique profonde :
 * détecte les correspondances de sens même si le vocabulaire diffère.
 *
 * Retourne { present, missing, semantic, score, total, explanation }
 *   present  : mots-clés couverts (exact ou sémantique)
 *   missing  : mots-clés vraiment absents du profil
 *   semantic : sous-ensemble de present détectés sémantiquement (pas littéraux)
 *   score    : 0-100
 *   explanation : conseil bref de Claude
 */
export async function analyzeMatchSemantic(offerText, cvData, apiKey) {
  const hasServerKey = typeof import.meta !== 'undefined'
    && import.meta.env?.VITE_API_HOSTED === 'true';

  if (!apiKey?.trim() && !hasServerKey) {
    throw new Error('no_key');
  }

  // Résumé compact du CV pour limiter les tokens
  const cvSummary = [
    cvData.poste && `Poste : ${cvData.poste}`,
    cvData.accroche && `Accroche : ${cvData.accroche.slice(0, 200)}`,
    (cvData.experiences || []).length > 0 && `Expériences : ${
      cvData.experiences.slice(0, 3).map(e =>
        `${e.poste} chez ${e.entreprise} — ${(e.missions || []).slice(0, 2).join(', ')}`
      ).join(' | ')
    }`,
    (cvData.competences?.techniques || []).length > 0 &&
      `Compétences techniques : ${(cvData.competences.techniques || []).slice(0, 15).join(', ')}`,
    (cvData.competences?.comportementales || []).length > 0 &&
      `Soft skills : ${(cvData.competences.comportementales || []).slice(0, 8).join(', ')}`,
    (cvData.competences?.outils || []).length > 0 &&
      `Outils : ${(cvData.competences.outils || []).slice(0, 10).join(', ')}`,
  ].filter(Boolean).join('\n');

  // Extraire les mots-clés localement d'abord (pour donner à Claude la liste à analyser)
  const local = analyzeMatch(offerText, cvData);
  const allKeywords = [...local.present, ...local.missing];

  const prompt = `Tu es un expert en recrutement. Analyse la correspondance entre cette offre d'emploi et ce profil de candidat.

OFFRE D'EMPLOI :
${offerText.slice(0, 2000)}

PROFIL DU CANDIDAT :
${cvSummary}

MOTS-CLÉS EXTRAITS DE L'OFFRE : ${allKeywords.join(', ')}

TÂCHE :
Pour chaque mot-clé listé, indique s'il est :
- PRESENT : couvert par le profil (même sens, même concept, même compétence — peu importe si la formulation diffère)
- SEMANTIQUE : couvert sémantiquement mais avec un vocabulaire différent (ex: "gérer" → "management", "développer" → "développement")
- ABSENT : vraiment absent du profil

Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires :
{
  "present": ["mot1", "mot2"],
  "semantic": { "mot3": "raison courte", "mot4": "raison courte" },
  "absent": ["mot5", "mot6"],
  "conseil": "1 phrase de conseil personnalisé pour améliorer la correspondance"
}`;

  const body = {
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  };

  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  if (apiKey?.trim()) headers['x-api-key'] = apiKey.trim();

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`api_error:${res.status}:${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw  = data.content?.[0]?.text || '';

  // Parser le JSON de la réponse
  let parsed;
  try {
    // Extraire le bloc JSON même si Claude a ajouté du texte autour
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    throw new Error('parse_error');
  }

  const semanticMap  = parsed.semantic  || {};
  const presentExact = parsed.present   || [];
  const presentSem   = Object.keys(semanticMap);
  const absent       = parsed.absent    || [];
  const allPresent   = [...new Set([...presentExact, ...presentSem])];
  const total        = allPresent.length + absent.length;
  const score        = total > 0 ? Math.round((allPresent.length / total) * 100) : 0;

  return {
    present:     allPresent,
    missing:     absent,
    semantic:    semanticMap,    // { mot: "raison" } pour les matchs sémantiques
    score,
    total,
    explanation: parsed.conseil || '',
  };
}
