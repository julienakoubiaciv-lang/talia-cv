/* ─── profileData.js ───────────────────────────────────────────────────────
   Gestion des profils personnalité en localStorage.
   Un profil capture QUI est la personne (ton, style, contexte) pour orienter
   les reformulations IA — indépendamment des données brutes du CV.
   ───────────────────────────────────────────────────────────────────────── */

const KEY = 'ALTIO_CV_profiles';

/* ── Structure d'un profil ─────────────────────────────────────────────── */
// {
//   id          : number      — timestamp de création (clé unique)
//   nom         : string      — label donné par l'utilisateur ("Dev Startup")
//   emoji       : string      — emoji choisi pour la carte ("🚀")
//   createdAt   : string      — ISO date
//   personnalite: {
//     mots      : string[]    — 3 adjectifs libres
//     style     : string      — 'execution' | 'reflexion' | 'lien'
//     collegues : string      — texte libre "La personne à qui on vient quand…"
//   }
//   trajectoire : {
//     contexte  : string      — 'premier-emploi' | 'evolution' | 'reconversion' | 'pause'
//     trous     : string      — explication des trous/reconversion
//     fierte    : string      — plus grande fierté professionnelle
//   }
//   cible       : {
//     secteur   : string      — 'startup' | 'grand-groupe' | 'collectivite' | 'freelance' | 'autre'
//     offreType : string      — intitulé du poste ou offre collée
//     eviter    : string      — ce à ne pas mettre en avant
//   }
//   ton         : {
//     style     : string      — 'authentique' | 'professionnel' | 'percutant' | 'creatif'
//     interdits : string[]    — expressions à bannir
//   }
// }

/* ── CRUD ──────────────────────────────────────────────────────────────── */

export function getProfiles() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function saveProfile(profile) {
  const profiles = getProfiles();
  const now = Date.now();
  const entry = { ...profile, id: now, createdAt: new Date().toISOString() };
  profiles.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(profiles));
  return entry.id;
}

export function updateProfile(id, patch) {
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => String(p.id) === String(id));
  if (idx < 0) return false;
  profiles[idx] = { ...profiles[idx], ...patch, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(profiles));
  return true;
}

export function deleteProfile(id) {
  const profiles = getProfiles().filter(p => String(p.id) !== String(id));
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export function getProfile(id) {
  return getProfiles().find(p => String(p.id) === String(id)) || null;
}

/* ── Génère le bloc de contexte injecté dans les prompts IA ────────────── */
export function buildProfileContext(profile) {
  if (!profile) return '';

  const lines = [];

  // Personnalité
  if (profile.personnalite?.mots?.length) {
    lines.push(`- Se décrit comme : ${profile.personnalite.mots.join(', ')}`);
  }
  const styleLabels = {
    execution: "dans l'action — aime livrer et exécuter",
    reflexion: "dans la réflexion — aime concevoir et analyser",
    lien:      "dans le lien — aime fédérer et animer",
  };
  if (profile.personnalite?.style) {
    lines.push(`- Style de travail : ${styleLabels[profile.personnalite.style] || profile.personnalite.style}`);
  }
  if (profile.personnalite?.collegues?.trim()) {
    lines.push(`- Ce que ses collègues disent : "${profile.personnalite.collegues.trim()}"`);
  }

  // Trajectoire
  const contexteLabels = {
    'premier-emploi': 'premier emploi / alternance',
    evolution:        'évolution dans le même domaine',
    reconversion:     'reconversion professionnelle',
    pause:            "retour après une pause",
  };
  if (profile.trajectoire?.contexte) {
    lines.push(`- Contexte : ${contexteLabels[profile.trajectoire.contexte] || profile.trajectoire.contexte}`);
  }
  if (profile.trajectoire?.trous?.trim()) {
    lines.push(`- Contexte à valoriser : "${profile.trajectoire.trous.trim()}"`);
  }
  if (profile.trajectoire?.fierte?.trim()) {
    lines.push(`- Fierté professionnelle : "${profile.trajectoire.fierte.trim()}"`);
  }

  // Cible
  const secteurLabels = {
    startup:       'startup / scale-up',
    'grand-groupe':'grand groupe / corporate',
    collectivite:  'secteur public / collectivité',
    freelance:     'freelance / indépendant',
    autre:         'autre',
  };
  if (profile.cible?.secteur) {
    lines.push(`- Secteur cible : ${secteurLabels[profile.cible.secteur] || profile.cible.secteur}`);
  }
  if (profile.cible?.offreType?.trim()) {
    lines.push(`- Poste / offre visé : "${profile.cible.offreType.trim()}"`);
  }
  if (profile.cible?.eviter?.trim()) {
    lines.push(`- À ne PAS mettre en avant : "${profile.cible.eviter.trim()}"`);
  }

  // Ton
  const tonLabels = {
    authentique:     'authentique — parler vrai, sans jargon corporatiste',
    professionnel:   'professionnel — codes du secteur, structuré',
    percutant:       'percutant — chiffres, impact, résultats mesurables',
    creatif:         'créatif — se démarquer, originalité maîtrisée',
  };
  if (profile.ton?.style) {
    lines.push(`- Ton souhaité : ${tonLabels[profile.ton.style] || profile.ton.style}`);
  }
  if (profile.ton?.interdits?.length) {
    lines.push(`- Expressions à BANNIR : ${profile.ton.interdits.map(e => `"${e}"`).join(', ')}`);
  }

  if (!lines.length) return '';

  return `\n\n=== PROFIL PERSONNALITÉ DU CANDIDAT ===\n${lines.join('\n')}\n========================================\n\nTiens compte de ce profil pour personnaliser la rédaction et éviter un CV générique.`;
}

/* ── Options pour le wizard ────────────────────────────────────────────── */
export const MOT_CHIPS = [
  'Curieux', 'Direct', 'Créatif', 'Rigoureux', 'Empathique',
  'Autonome', 'Organisé', 'Ambitieux', 'Adaptable', 'Fiable',
  'Analytique', 'Pragmatique', 'Enthousiaste', 'Discret', 'Leader',
];

export const EMOJI_CHOICES = [
  '🚀','💡','🎯','🌱','⚡','🔧','🎨','📊','🤝','🌍','🏆','✨','🔬','💼','🌿',
];

export const INTERDITS_SUGGESTIONS = [
  'force de proposition', 'orienté résultats', 'dynamique', 'proactif',
  'passionné par', 'polyvalent', 'motivé', 'esprit d\'équipe',
  'sens des responsabilités', 'rigueur et organisation',
];
