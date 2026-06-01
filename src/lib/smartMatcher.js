// ─── SMART MATCHER — Analyse de correspondance offre/CV ──────────────────────

import { callClaude } from '@/lib/claudeClient';

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

// ─── Analyse sémantique via Claude (Edge Function claude-proxy) ───────────────
//
// Migration V0 : plus aucun fetch direct à /api/anthropic.
// Tout passe par callClaude() avec auth JWT + quota serveur + prompt caching.

/**
 * Prompt système (cacheable — invariant entre appels). Les instructions
 * structurelles sont placées ici pour bénéficier du prompt caching Anthropic.
 */
const SEMANTIC_SYSTEM = `Tu es un expert en recrutement spécialisé dans l'analyse de correspondance offre/profil.

Tu reçois :
  - une OFFRE D'EMPLOI
  - un PROFIL CANDIDAT (résumé)
  - une LISTE DE MOTS-CLÉS extraits de l'offre

Pour chaque mot-clé, classifie-le en :
  - PRESENT  : couvert littéralement par le profil (même mot ou racine évidente)
  - SEMANTIQUE : couvert par un concept équivalent mais avec un vocabulaire différent
                 (ex: "gérer" → "management", "développer" → "développement")
  - ABSENT   : vraiment absent du profil

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans commentaires :
{
  "present":  ["mot1", "mot2"],
  "semantic": { "mot3": "raison courte (≤ 8 mots)", "mot4": "raison courte" },
  "absent":   ["mot5", "mot6"],
  "conseil":  "1 phrase actionnable pour améliorer la correspondance"
}`;

/**
 * analyzeMatchSemantic(offerText, cvData)
 *
 * Appel Claude pour une analyse sémantique profonde.
 * L'authentification + les quotas sont gérés côté Edge Function.
 *
 * Retourne { present, missing, semantic, score, total, explanation }
 *   present     : mots-clés couverts (exact ou sémantique)
 *   missing     : mots-clés vraiment absents du profil
 *   semantic    : { mot: "raison" } pour les matchs sémantiques uniquement
 *   score       : 0-100
 *   explanation : conseil bref de Claude
 *
 * @throws {QuotaError} si quota dépassé (à intercepter côté UI pour upgrade modal)
 */
export async function analyzeMatchSemantic(offerText, cvData) {
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

  // Message utilisateur : variables uniquement (le système est en cache)
  const userPrompt = `OFFRE D'EMPLOI :
${offerText.slice(0, 2000)}

PROFIL DU CANDIDAT :
${cvSummary}

MOTS-CLÉS À ANALYSER : ${allKeywords.join(', ')}`;

  // Appel Edge Function — auth JWT + quota check + log usage automatiques.
  // La QuotaError éventuelle remonte telle quelle pour que l'UI ouvre la modal upgrade.
  const data = await callClaude({
    action:     'smart_match',
    model:      'claude-haiku-4-5',
    max_tokens: 600,
    system:     SEMANTIC_SYSTEM,
    messages:   [{ role: 'user', content: userPrompt }],
    metadata:   {
      keywordCount: allKeywords.length,
      offerLength:  offerText.length,
      localScore:   local.score,
    },
  });

  const raw = data.content?.[0]?.text || '';

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
