/**
 * interviewBank — Banque de scénarios d'entretien (jeu gratuit, zéro coût API).
 *
 * Format "code de la route" : une situation, une question, 3-4 options,
 * une seule bonne réponse, une explication pédagogique. `context` (optionnel)
 * = mise en situation immersive.
 *
 * Organisation : un fichier par thème dans ./interview/ (rédigés par lots).
 * Les thèmes non encore étoffés à 30 restent définis inline ci-dessous en
 * attendant leur lot dédié.
 */
import presentationQuestions from './interview/presentation.js';
import motivationQuestions   from './interview/motivation.js';
import commerceQuestions     from './interview/commerce.js';
import { CATEGORIES, SECTORS, TYPES } from './interviewCategories.js';

// Re-export pour compat : les modules qui importaient ces métadonnées depuis
// interviewBank continuent de fonctionner.
export { CATEGORIES, SECTORS, TYPES };

// Thèmes encore en cours d'étoffement (seront déplacés vers ./interview/ par lots).
const PENDING_QUESTIONS = [
  // ── Parcours / STAR ───────────────────────────────────────────────────────
  {
    id: 'star-1', category: 'parcours', difficulty: 2,
    situation: "« Donnez-moi un exemple d'un problème que vous avez résolu. »",
    question: "Comment structurer une réponse percutante ?",
    options: [
      { text: "Méthode STAR : Situation, Tâche, Action, Résultat", correct: true },
      { text: "Rester vague pour ne pas se tromper", correct: false },
      { text: "Parler du problème sans dire comment on l'a résolu", correct: false },
      { text: "Dire « Je n'ai jamais eu de problème »", correct: false },
    ],
    explanation: "La méthode STAR rend une anecdote claire et mémorable, et met en valeur ton action et le résultat chiffré obtenu.",
    tip: "Termine toujours par un résultat concret, si possible chiffré.",
  },
  {
    id: 'star-2', category: 'parcours', difficulty: 3,
    situation: "Vous décrivez une réussite d'équipe à laquelle vous avez participé.",
    question: "Quelle formulation est la plus juste ?",
    options: [
      { text: "Tout attribuer à soi : « j'ai tout fait »", correct: false },
      { text: "Dire « on a fait » sans jamais préciser son rôle", correct: false },
      { text: "Valoriser le collectif ET clarifier sa contribution personnelle", correct: true },
      { text: "Minimiser son rôle par modestie", correct: false },
    ],
    explanation: "Le recruteur évalue TA contribution. On crédite l'équipe mais on précise ce qu'on a personnellement apporté.",
    tip: "« Mon rôle a été de… » est une formule clé.",
  },
  {
    id: 'mes-1', category: 'parcours', difficulty: 3,
    context: "Vous postulez comme chargé(e) de clientèle dans une banque. Le recruteur, directeur d'agence, cherche quelqu'un capable de gérer la pression d'un guichet. Il se penche en avant : « Racontez-moi une fois où un client était furieux. »",
    situation: "Un client mécontent hausse le ton devant les autres clients.",
    question: "Quelle réponse démontre le mieux votre sang-froid ?",
    options: [
      { text: "« Je l'aurais ignoré, ce n'est pas mon problème »", correct: false },
      { text: "Décrire (STAR) comment vous l'avez isolé, écouté, puis proposé une solution concrète", correct: true },
      { text: "« Je serais allé chercher mon manager immédiatement »", correct: false },
      { text: "« Je lui aurais dit de se calmer ou de partir »", correct: false },
    ],
    explanation: "Face à un conflit client, on attend de l'écoute active, de la désescalade (isoler, reformuler) et une solution. La méthode STAR rend l'exemple crédible.",
    tip: "Montre que tu gardes le client ET l'image de l'entreprise.",
  },

  // ── Forces & faiblesses ───────────────────────────────────────────────────
  {
    id: 'faib-1', category: 'faiblesses', difficulty: 2,
    situation: "« Quel est votre principal défaut ? »",
    question: "La meilleure réponse :",
    options: [
      { text: "« Je suis perfectionniste » (cliché déguisé en qualité)", correct: false },
      { text: "« Je n'ai aucun défaut »", correct: false },
      { text: "Un vrai défaut maîtrisé + ce qu'on fait pour progresser", correct: true },
      { text: "Un défaut rédhibitoire pour le poste", correct: false },
    ],
    explanation: "On veut de l'honnêteté et de la lucidité : un défaut réel mais non bloquant, accompagné d'une démarche d'amélioration. Les faux défauts sonnent faux.",
    tip: "Choisis un défaut sans rapport direct avec le cœur du poste.",
  },
  {
    id: 'faib-2', category: 'faiblesses', difficulty: 1,
    situation: "« Quelles sont vos forces ? »",
    question: "Comment les présenter ?",
    options: [
      { text: "Lister 10 qualités génériques en rafale", correct: false },
      { text: "2-3 forces clés illustrées par un exemple concret", correct: true },
      { text: "« Je suis le meilleur dans tout »", correct: false },
      { text: "Rester très modeste et n'en citer aucune", correct: false },
    ],
    explanation: "Mieux vaut 2-3 forces prouvées par un exemple qu'une liste creuse. La preuve par l'exemple est ce qui convainc.",
    tip: "Pour chaque force, prépare une mini-anecdote.",
  },
  {
    id: 'mes-3', category: 'faiblesses', difficulty: 3,
    context: "Poste de développeur junior. L'entretien est mené par le lead technique, plutôt direct. Après vos réponses techniques, il vous fixe : « Qu'est-ce qui vous met le plus en difficulté dans le code ? »",
    situation: "On vous demande une vraie faiblesse technique.",
    question: "La meilleure manière de répondre :",
    options: [
      { text: "« Rien, je gère tout »", correct: false },
      { text: "Citer un domaine précis encore en apprentissage + comment vous progressez", correct: true },
      { text: "« Je déteste les tests, je n'en fais jamais »", correct: false },
      { text: "Détourner la question vers vos points forts", correct: false },
    ],
    explanation: "Un technique senior valorise la lucidité et la capacité d'apprentissage plus que la perfection. Nommer une zone de progrès + sa démarche inspire confiance.",
    tip: "« En ce moment je monte en compétence sur… via… » montre une dynamique.",
  },

  // ── Connaissance entreprise ───────────────────────────────────────────────
  {
    id: 'entr-1', category: 'entreprise', difficulty: 1,
    situation: "« Que savez-vous de notre entreprise ? »",
    question: "Avant l'entretien, vous auriez dû :",
    options: [
      { text: "Ne rien préparer, improviser sur le moment", correct: false },
      { text: "Lire le site, l'actu récente, les produits et la culture", correct: true },
      { text: "Apprendre par cœur le chiffre d'affaires uniquement", correct: false },
      { text: "Regarder seulement le logo", correct: false },
    ],
    explanation: "Se renseigner est non négociable. Connaître l'actualité récente, les produits et les valeurs montre un intérêt sincère et te démarque.",
    tip: "Note 2-3 faits récents à glisser pendant l'échange.",
  },
  {
    id: 'entr-2', category: 'entreprise', difficulty: 2,
    situation: "Le poste correspond à plusieurs entreprises où vous postulez.",
    question: "Comment éviter l'effet « candidature copiée-collée » ?",
    options: [
      { text: "Donner exactement les mêmes réponses partout", correct: false },
      { text: "Personnaliser : pourquoi CETTE entreprise précisément", correct: true },
      { text: "Dire qu'on postule partout pour maximiser ses chances", correct: false },
      { text: "Mentir en disant que c'est sa seule candidature", correct: false },
    ],
    explanation: "Le recruteur veut sentir un intérêt spécifique. Un argument propre à l'entreprise (mission, projet, valeurs) fait la différence.",
    tip: "Une phrase « ce qui m'attire chez VOUS, c'est… » personnalisée.",
  },

  // ── Salaire ───────────────────────────────────────────────────────────────
  {
    id: 'sal-1', category: 'salaire', difficulty: 3,
    situation: "« Quelles sont vos prétentions salariales ? »",
    question: "La meilleure stratégie :",
    options: [
      { text: "Donner un chiffre au hasard", correct: false },
      { text: "Annoncer une fourchette préparée selon le marché et son profil", correct: true },
      { text: "« Je prends ce que vous donnez »", correct: false },
      { text: "Exiger le double sans justification", correct: false },
    ],
    explanation: "Une fourchette argumentée (étude du marché + ton niveau) montre que tu connais ta valeur sans bloquer la discussion. Ni se brader, ni être déconnecté.",
    tip: "Renseigne-toi sur les grilles du secteur avant l'entretien.",
  },
  {
    id: 'sal-2', category: 'salaire', difficulty: 2,
    situation: "On vous propose un salaire un peu en dessous de vos attentes.",
    question: "La bonne réaction :",
    options: [
      { text: "Accepter immédiatement sans discuter", correct: false },
      { text: "Négocier calmement ou évoquer les avantages annexes", correct: true },
      { text: "Se vexer et quitter l'entretien", correct: false },
      { text: "Mentir sur son salaire actuel", correct: false },
    ],
    explanation: "La négociation est attendue et professionnelle. On peut discuter le fixe, mais aussi les avantages (primes, télétravail, formation, évolution).",
    tip: "Le package total compte autant que le salaire brut.",
  },

  // ── Posture / savoir-être ─────────────────────────────────────────────────
  {
    id: 'post-1', category: 'posture', difficulty: 1,
    situation: "Vous arrivez à l'entretien.",
    question: "Quel comportement fait la meilleure première impression ?",
    options: [
      { text: "Arriver pile à l'heure ou 5-10 min en avance, sourire, poignée franche", correct: true },
      { text: "Arriver 20 min en retard sans prévenir", correct: false },
      { text: "Garder son téléphone à la main", correct: false },
      { text: "S'asseoir avant d'y être invité", correct: false },
    ],
    explanation: "La première impression se joue en quelques secondes : ponctualité, sourire, contact visuel et politesse posent immédiatement le ton.",
    tip: "Coupe ton téléphone AVANT d'entrer.",
  },
  {
    id: 'post-2', category: 'posture', difficulty: 2,
    situation: "Le recruteur pose une question dont vous ignorez la réponse.",
    question: "Que faire ?",
    options: [
      { text: "Inventer une réponse au culot", correct: false },
      { text: "Rester honnête, montrer son raisonnement ou sa capacité à apprendre", correct: true },
      { text: "Rester muet et paniquer", correct: false },
      { text: "Changer de sujet brutalement", correct: false },
    ],
    explanation: "Personne ne sait tout. L'honnêteté et la capacité à réfléchir à voix haute valent mieux qu'un bluff qui s'effondre à la question suivante.",
    tip: "« Je ne maîtrise pas encore, mais voici comment j'aborderais… »",
  },
  {
    id: 'post-3', category: 'posture', difficulty: 2,
    situation: "Entretien en visioconférence.",
    question: "Quel est le point le plus important à soigner ?",
    options: [
      { text: "Cadre, lumière, connexion stable et regard vers la caméra", correct: true },
      { text: "Être allongé dans son lit", correct: false },
      { text: "Multiplier les onglets ouverts pour lire ses notes", correct: false },
      { text: "Couper sa caméra pour être à l'aise", correct: false },
    ],
    explanation: "En visio, l'environnement technique fait partie du professionnalisme : bonne lumière, fond neutre, connexion testée et regard caméra pour créer le contact.",
    tip: "Teste ton matériel 10 min avant le rendez-vous.",
  },

  // ── Clôture / relance ─────────────────────────────────────────────────────
  {
    id: 'clot-1', category: 'cloture', difficulty: 1,
    situation: "« Avez-vous des questions ? » en fin d'entretien.",
    question: "La meilleure attitude :",
    options: [
      { text: "« Non, tout est clair » et partir", correct: false },
      { text: "Poser 1-2 questions préparées et pertinentes", correct: true },
      { text: "Demander uniquement les congés et avantages", correct: false },
      { text: "Poser 15 questions pour montrer son intérêt", correct: false },
    ],
    explanation: "Ne pas avoir de question signale un manque d'intérêt. 1-2 questions pertinentes (équipe, enjeux du poste, prochaines étapes) montrent l'engagement.",
    tip: "Garde une question en réserve même si tout a été abordé.",
  },
  {
    id: 'clot-2', category: 'cloture', difficulty: 2,
    situation: "L'entretien est terminé depuis 2 jours, sans nouvelles.",
    question: "Quelle est la bonne pratique ?",
    options: [
      { text: "Relancer 10 fois par jour", correct: false },
      { text: "Envoyer un email de remerciement, puis relancer poliment après le délai annoncé", correct: true },
      { text: "Ne jamais relancer, attendre indéfiniment", correct: false },
      { text: "Appeler le soir sur le portable personnel du recruteur", correct: false },
    ],
    explanation: "Un mail de remerciement le jour même est un vrai plus. La relance se fait avec tact, après le délai indiqué, sans harceler.",
    tip: "Le mail de remerciement post-entretien est trop peu utilisé.",
  },
];

// Tronc commun comportemental → secteur 'general' (rubrique = thème comportemental).
const GENERAL_QUESTIONS = [
  ...presentationQuestions,
  ...motivationQuestions,
  ...PENDING_QUESTIONS,
].map((q) => ({ sector: 'general', ...q }));

export const QUESTIONS = [
  ...GENERAL_QUESTIONS,
  ...commerceQuestions,
];

/**
 * Rubrique d'une question : pour 'general' = thème comportemental (q.category) ;
 * pour un secteur métier = type de question (q.type).
 */
export function groupOf(q) {
  return q.sector === 'general' ? q.category : q.type;
}

/** Métadonnées d'affichage (label/emoji/color) d'une question selon sa rubrique. */
export function metaOf(q) {
  return q.sector === 'general' ? CATEGORIES[q.category] : TYPES[q.type];
}

/** Métadonnées d'une rubrique à partir de son id + secteur. */
export function groupMeta(sector, groupId) {
  return sector === 'general' ? CATEGORIES[groupId] : TYPES[groupId];
}

/** Mélange (Fisher-Yates) sans muter l'entrée. */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Secteurs disponibles (avec nb de questions). */
export function listSectors() {
  return Object.entries(SECTORS).map(([id, meta]) => ({
    id, ...meta,
    count: QUESTIONS.filter((q) => q.sector === id).length,
  })).filter((s) => s.count > 0);
}

/** Rubriques d'un secteur (thèmes pour 'general', types sinon), avec compteurs. */
export function listGroups(sector) {
  const pool = QUESTIONS.filter((q) => q.sector === sector);
  const map = sector === 'general' ? CATEGORIES : TYPES;
  return Object.entries(map).map(([id, meta]) => ({
    id, ...meta,
    count: pool.filter((q) => groupOf(q) === id).length,
  })).filter((g) => g.count > 0);
}

/** Compat : thèmes comportementaux du tronc commun. */
export function listCategories() {
  return listGroups('general');
}

/**
 * Construit une session de jeu.
 * @param {object} [opts]
 * @param {string} [opts.sector] - secteur ('general' par défaut)
 * @param {string} [opts.group]  - rubrique ('all' = mix du secteur)
 * @param {number} [opts.size]   - nombre de questions (défaut 8)
 * @returns {Array} questions, options mélangées, prêtes à jouer
 */
export function buildSession({ sector = 'general', group = 'all', size = 8 } = {}) {
  let pool = QUESTIONS.filter((q) => q.sector === sector);
  if (group !== 'all') pool = pool.filter((q) => groupOf(q) === group);
  pool = shuffle(pool).slice(0, size);
  // Mélange aussi l'ordre des options pour éviter la mémorisation de position.
  return pool.map((q) => ({ ...q, options: shuffle(q.options) }));
}
