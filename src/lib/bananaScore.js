// ─── BANANA SCORE — Gamification du CV ───────────────────────────────────────

export const SCORE_RULES = [
  // Identité — 28 pts
  { id:'prenom',        pts:4,  check: d => !!d.prenom?.trim() },
  { id:'nom',           pts:4,  check: d => !!d.nom?.trim() },
  { id:'email',         pts:5,  check: d => !!d.email?.trim() },
  { id:'telephone',     pts:4,  check: d => !!d.telephone?.trim() },
  { id:'adresse',       pts:3,  check: d => !!d.adresse?.trim() },
  { id:'poste',         pts:5,  check: d => !!d.poste?.trim() },
  { id:'accrocheShort', pts:3,  check: d => (d.accroche||'').length >= 80 },
  { id:'accrocheFull',  pts:5,  check: d => (d.accroche||'').length >= 200 },
  { id:'linkedin',      pts:2,  check: d => !!d.linkedin?.trim() },

  // Photo — 10 pts
  { id:'photo',         pts:10, check: (_, e) => !!e?.photo },

  // Expériences — 24 pts
  { id:'exp1',          pts:8,  check: d => (d.experiences||[]).length >= 1 },
  { id:'exp2',          pts:5,  check: d => (d.experiences||[]).length >= 2 },
  { id:'expMissions',   pts:7,  check: d =>
      d.experiences?.length > 0 &&
      d.experiences.every(e => (e.missions||[]).filter(m => m.trim()).length >= 2)
  },
  { id:'expPeriodes',   pts:4,  check: d =>
      d.experiences?.length > 0 &&
      d.experiences.every(e => !!e.periode?.trim())
  },

  // Formations — 10 pts
  { id:'formTalia',     pts:6,  check: d => (d.formations||[]).some(f => f.isTalia) },
  { id:'formExtra',     pts:4,  check: d => (d.formations||[]).filter(f => !f.isTalia).length >= 1 },

  // Compétences — 15 pts
  { id:'compTech3',     pts:5,  check: d => (d.competences?.techniques||[]).length >= 3 },
  { id:'compTech6',     pts:2,  check: d => (d.competences?.techniques||[]).length >= 6 },
  { id:'compSoft',      pts:5,  check: d => (d.competences?.comportementales||[]).length >= 3 },
  { id:'compOutils',    pts:3,  check: d => (d.competences?.outils||[]).length >= 1 },

  // Langues & Intérêts — 8 pts
  { id:'langues',       pts:4,  check: d => (d.langues||[]).length >= 1 },
  { id:'interets',      pts:4,  check: d => (d.centresInteret||[]).length >= 2 },
];

const TIPS = {
  prenom:        'Renseigne ton prénom dans l\'onglet Identité',
  nom:           'Renseigne ton nom dans l\'onglet Identité',
  email:         'Ajoute une adresse email professionnelle',
  telephone:     'Ajoute ton numéro de téléphone',
  adresse:       'Indique ta ville ou département',
  poste:         'Définis clairement le poste visé',
  accrocheShort: 'Commence à rédiger ton accroche de motivation',
  accrocheFull:  'Développe ton accroche (200+ caractères recommandés)',
  linkedin:      'Ajoute l\'URL de ton profil LinkedIn',
  photo:         'Ajoute une photo professionnelle (onglet Médias)',
  exp1:          'Ajoute au moins une expérience professionnelle',
  exp2:          'Une 2ème expérience renforce considérablement ton profil',
  expMissions:   'Décris au moins 2 missions concrètes par expérience',
  expPeriodes:   'Précise les dates de début et fin pour chaque poste',
  formTalia:     'Assure-toi que ta formation Talia est bien renseignée',
  formExtra:     'Ajoute ton diplôme précédent (Bac, BTS…)',
  compTech3:     'Liste tes compétences techniques (minimum 3)',
  compTech6:     'Enrichis tes compétences techniques (6+ idéalement)',
  compSoft:      'Ajoute tes soft skills comportementaux (min. 3)',
  compOutils:    'Mentionne les outils que tu maîtrises',
  langues:       'Précise tes langues et niveaux maîtrisés',
  interets:      'Ajoute 2 centres d\'intérêt minimum',
};

const TOTAL_MAX = SCORE_RULES.reduce((s, r) => s + r.pts, 0);

export const BANANA_LEVELS = [
  { min:0,   max:25,  emoji:'🫙', label:'Vide',          color:'#dc2626' },
  { min:25,  max:45,  emoji:'🌱', label:'En pousse',     color:'#f59e0b' },
  { min:45,  max:65,  emoji:'🍌', label:'En mûrissage',  color:'#eab308' },
  { min:65,  max:85,  emoji:'🍌', label:'Presque parfait !', color:'#84cc16' },
  { min:85,  max:101, emoji:'🏆', label:'CV Parfait',    color:'#16a34a' },
];

export function getBananaLevel(pct) {
  return BANANA_LEVELS.find(l => pct >= l.min && pct < l.max) || BANANA_LEVELS[BANANA_LEVELS.length - 1];
}

export function calcBananaScore(cvData, extra = {}) {
  if (!cvData) return { score: 0, pct: 0, max: TOTAL_MAX, rules: [], tips: [] };

  const rules = SCORE_RULES.map(rule => ({
    ...rule,
    achieved: Boolean(rule.check(cvData, extra)),
  }));

  const score = rules.reduce((s, r) => s + (r.achieved ? r.pts : 0), 0);
  const pct   = Math.min(100, Math.round((score / TOTAL_MAX) * 100));

  const tips = rules
    .filter(r => !r.achieved)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 3)
    .map(r => ({ id: r.id, pts: r.pts, tip: TIPS[r.id] || 'Complète cette section' }));

  return { score, pct, max: TOTAL_MAX, rules, tips };
}
