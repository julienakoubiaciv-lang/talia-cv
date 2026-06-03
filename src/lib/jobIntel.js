/**
 * jobIntel — « Décrypte les métiers » : couche d'intelligence métier au-dessus
 * de la taxonomie CV existante (cvData : FORMATIONS / POSTES / COMP_TECH / COMP_SOFT).
 *
 * Objectif : faire comprendre, de façon ludique, les compétences clés que les
 * recruteurs valorisent vraiment pour CHAQUE poste, et les subtilités du rôle.
 *
 * On n'écrit ici QUE l'enrichissement « jeu » (pitch, compétences clés + pourquoi,
 * ce que cherche le recruteur, pièges, situations). Le reste (libellé du parcours,
 * postes visés, hard/soft skills) est lu depuis cvData → zéro duplication.
 *
 * Clé = identifiant de parcours (`FORMATIONS[].v`), ce qui donne le lien CV
 * automatique : l'historique stocke `formation`, on retrouve donc le bon métier.
 */
import { FORMATIONS, POSTES, COMP_TECH, COMP_SOFT } from './cvData.js';

// Caractères Windows-1252 de la plage 0x80–0x9F (le double-encodage de cvData est
// passé par CP1252, pas Latin1 : ex. l'octet 0x89 de « É » devient « ‰ »).
const CP1252 = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
  '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
  '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

/**
 * Répare un texte double-encodé en UTF-8 (mojibake « Ã© », « â€“ », « Ã‰ »…),
 * tel qu'on en trouve dans les données héritées de cvData (encodage CP1252).
 * Sans effet sur un texte déjà correct.
 * (Bug de fond à corriger un jour à la source dans cvData.js.)
 */
export function fixMojibake(s) {
  if (typeof s !== 'string' || !/[ÃÂ]|â€/.test(s)) return s;
  try {
    const bytes = Uint8Array.from([...s], (c) => {
      const code = c.charCodeAt(0);
      return code <= 0xff ? code : (CP1252[c] ?? 0x3f);
    });
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return s;
  }
}
const fixList = (arr) => (Array.isArray(arr) ? arr.map(fixMojibake) : []);

/** Enrichissement métier, par id de parcours. (MVP : secteur Commerce / Vente.) */
export const JOB_INTEL = {
  // ── Manager des Unités Marchandes (vente / retail) ──────────────────────────
  'tp-manager-um': {
    label: 'Vente & conseil en magasin',
    emoji: '🛍️',
    pitch:
      "Tu fais vivre le magasin : accueil, conseil, vente et tenue du rayon. " +
      "Tu es le visage de l'enseigne face au client — la première impression, c'est toi.",
    keySkills: [
      { name: 'Sens du service client', why: 'Un client bien accueilli et conseillé revient et achète davantage.' },
      { name: 'Techniques de vente', why: 'Questionner, argumenter et conclure fait toute la différence sur le chiffre.' },
      { name: 'Tenue et merchandising du rayon', why: 'Un rayon propre et attractif déclenche l\'achat, même sans vendeur.' },
      { name: 'Résistance au stress', why: 'Les pics d\'affluence (soldes, fêtes) testent ton sang-froid.' },
    ],
    recruiterLooksFor: [
      'Une présentation soignée et le sourire',
      'L\'orientation résultat (panier moyen, ventes additionnelles)',
      'La fiabilité sur les horaires et la caisse',
      'L\'esprit d\'équipe pendant les coups de feu',
    ],
    pitfalls: [
      'Rester derrière le comptoir au lieu d\'aller vers le client',
      'Réciter un argumentaire sans écouter le besoin',
      'Négliger la tenue du rayon quand c\'est calme',
    ],
    situations: [
      { situation: "C'est l'heure de pointe, la file s'allonge en caisse.", skill: 'Résistance au stress' },
      { situation: "Un client cherche un cadeau mais ne sait pas quoi prendre.", skill: 'Sens du service client' },
      { situation: "Le rayon est en désordre après le passage des clients.", skill: 'Tenue et merchandising du rayon' },
    ],
  },

  // ── Négociateur Technico-Commercial (prospection / B2B) ─────────────────────
  'tp-ntc': {
    label: 'Négociateur technico-commercial',
    emoji: '🤝',
    pitch:
      "Tu vas chercher le client : prospection, négociation, fidélisation. " +
      "Ton terrain de jeu, c'est le résultat commercial — et il se mérite.",
    keySkills: [
      { name: 'Sens de la négociation', why: 'Défendre la marge tout en concluant la vente.' },
      { name: 'Prospection / chasse', why: 'Pas de clients sans démarche active pour aller les chercher.' },
      { name: 'Résilience face aux refus', why: 'On essuie beaucoup de « non » avant un « oui ».' },
      { name: 'Écoute active', why: 'Comprendre le besoin réel pour proposer la bonne solution.' },
    ],
    recruiterLooksFor: [
      'Le goût du challenge et des objectifs chiffrés',
      'La ténacité face aux refus',
      'L\'autonomie dans l\'organisation de ses tournées',
      'La capacité à créer une relation de confiance',
    ],
    pitfalls: [
      'Parler du produit avant d\'avoir cerné le besoin',
      'Lâcher après un premier refus',
      'Brader le prix pour conclure à tout prix',
    ],
    situations: [
      { situation: "Un prospect répond « je vais réfléchir » pour la 3e fois.", skill: 'Résilience face aux refus' },
      { situation: "Le client trouve ton prix trop élevé.", skill: 'Sens de la négociation' },
      { situation: "Ton fichier de prospects est presque vide ce mois-ci.", skill: 'Prospection / chasse' },
    ],
  },

  // ── Bachelor Commerce France & International (business dev) ──────────────────
  'bachelor-commerce': {
    label: 'Business development',
    emoji: '📈',
    pitch:
      "Tu développes le chiffre d'affaires : ouverture de comptes, stratégie " +
      "commerciale, parfois à l'international. On attend de la vision ET des résultats.",
    keySkills: [
      { name: 'Capacité à convaincre et négocier', why: 'Closing de deals à plus forte valeur.' },
      { name: 'Vision stratégique', why: 'Choisir les bons marchés et les comptes à prioriser.' },
      { name: 'Orientation résultats', why: 'Tout se mesure en pipeline et en CA généré.' },
      { name: 'Analyse et prise de décision', why: 'Lire les chiffres pour ajuster son plan d\'action.' },
    ],
    recruiterLooksFor: [
      'Le sens du résultat et des KPIs',
      'La capacité à porter une stratégie, pas seulement exécuter',
      'L\'aisance relationnelle à haut niveau',
      'Un anglais opérationnel pour l\'international',
    ],
    pitfalls: [
      'Se disperser sur trop de pistes au lieu de prioriser',
      'Négliger le suivi (CRM) de ses opportunités',
      'Promettre au client ce que l\'entreprise ne peut pas livrer',
    ],
    situations: [
      { situation: "Tu as 30 pistes mais peu de temps : par où commencer ?", skill: 'Vision stratégique' },
      { situation: "Un grand compte hésite à signer un contrat important.", skill: 'Capacité à convaincre et négocier' },
      { situation: "Ton manager te demande où tu en es de tes objectifs.", skill: 'Orientation résultats' },
    ],
  },
};

/** Profil métier complet (intel + données cvData fusionnées), ou null si non couvert. */
export function getJob(v) {
  const intel = JOB_INTEL[v];
  if (!intel) return null;
  const f = FORMATIONS.find((x) => x.v === v) || {};
  return {
    v,
    label: intel.label || fixMojibake(f.l) || v,
    sector: fixMojibake(f.f) || 'Autre',
    duration: f.d || '',
    postes: fixList(POSTES[v]),
    hard: fixList(COMP_TECH[v]),
    soft: fixList(COMP_SOFT[v]),
    ...intel,
  };
}

/** Tous les métiers couverts (avec intel), prêts à l'affichage. */
export function listJobs() {
  return Object.keys(JOB_INTEL).map(getJob).filter(Boolean);
}

/** Métiers regroupés par secteur (famille de parcours). */
export function listJobsBySector() {
  const bySector = {};
  for (const job of listJobs()) {
    (bySector[job.sector] = bySector[job.sector] || []).push(job);
  }
  return bySector;
}

/**
 * Détecte le métier visé à partir du dernier CV généré (historique local).
 * L'historique stocke `formation` (= clé de parcours) → mapping direct.
 * @returns {string|null} l'id de parcours couvert, ou null.
 */
export function detectTargetJob() {
  try {
    const hist = JSON.parse(localStorage.getItem('talia_cv_hist') || '[]');
    if (!Array.isArray(hist) || !hist.length) return null;
    // Plus récent d'abord (id = timestamp).
    const sorted = [...hist].sort((a, b) => Number(b.id) - Number(a.id));
    for (const item of sorted) {
      if (item.formation && JOB_INTEL[item.formation]) return item.formation;
    }
    return null;
  } catch {
    return null;
  }
}
