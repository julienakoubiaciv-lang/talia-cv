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

// Correspondance partielle : stem simplifié (prefixe commun ≥5 chars)
function partialMatch(a, b) {
  if (a === b) return true;
  const minLen = Math.min(a.length, b.length);
  if (minLen < 5) return false;
  const stem = Math.max(4, Math.floor(minLen * 0.75));
  return a.slice(0, stem) === b.slice(0, stem);
}

/**
 * analyzeMatch(offerText, cvData)
 * Retourne { present, missing, score, total }
 */
export function analyzeMatch(offerText, cvData) {
  if (!offerText || offerText.trim().length < 30 || !cvData) {
    return { present: [], missing: [], score: 0, total: 0 };
  }

  // 1. Extraire top 30 mots-clés de l'offre
  const offerTokens  = tokenize(offerText);
  const offerFreq    = freq(offerTokens);
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
    ...(cvData.competences?.techniques     || []),
    ...(cvData.competences?.comportementales || []),
    ...(cvData.competences?.outils         || []),
    ...(cvData.langues || []).map(l => l.langue),
    ...(cvData.centresInteret || []),
  ].filter(Boolean).join(' ');

  const cvTokens = [...new Set(tokenize(cvText))];

  // 3. Classifier
  const present = [];
  const missing = [];

  offerKeywords.forEach(kw => {
    const inCV = cvTokens.some(t => partialMatch(kw, t));
    if (inCV) present.push(kw);
    else      missing.push(kw);
  });

  const score = offerKeywords.length > 0
    ? Math.round((present.length / offerKeywords.length) * 100)
    : 0;

  return { present, missing, score, total: offerKeywords.length };
}
