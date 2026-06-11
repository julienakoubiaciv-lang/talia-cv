/**
 * workCodes — « Codes de l'entreprise » : tests de jugement situationnel (SJT).
 *
 * Le simulateur d'entretien prépare AVANT l'embauche ; ce module prépare le
 * savoir-être une fois EN POSTE (codes implicites, communication, hiérarchie,
 * premiers jours…). Comble le déficit de soft skills, cœur de la mission.
 *
 * Mécanique SJT : pour chaque situation, plusieurs réactions possibles, notées
 * 0/1/2 (à éviter / acceptable / idéal). On ne cherche pas LA bonne réponse mais
 * le MEILLEUR réflexe — plus proche des tests réels des recruteurs.
 */

export const CODE_THEMES = {
  ponctualite:   { label: 'Ponctualité & fiabilité', emoji: '🕘', color: '#1539B7' },
  communication: { label: 'Communication & emails',  emoji: '💬', color: '#0CA678' },
  hierarchie:    { label: 'Hiérarchie & feedback',   emoji: '🤝', color: '#7048E8' },
  savoirvivre:   { label: 'Savoir-vivre au bureau',  emoji: '🧹', color: '#E8590C' },
  premiersjours: { label: 'Tes premiers jours',      emoji: '🚀', color: '#1098AD' },
};

/** Points par qualité de réaction. */
export const SCORE_XP = [0, 25, 50]; // index = score (0/1/2)
export const PASS_MARK = 12;          // note /20 pour « valider » les codes

/** Métadonnées d'affichage selon le score d'une réaction. */
export const SCORE_META = {
  2: { label: 'Réflexe idéal', tone: 'good' },
  1: { label: 'Acceptable',    tone: 'mid'  },
  0: { label: 'À éviter',      tone: 'bad'  },
};

const base = (theme) => ({ theme });

export const SCENARIOS = [
  // ── 🕘 PONCTUALITÉ & FIABILITÉ ─────────────────────────────────────────────
  {
    ...base('ponctualite'), id: 'pon-1',
    situation: "Ton train est bloqué, tu vas arriver 20 min en retard à ta 2e journée.",
    options: [
      { text: "Tu préviens ton manager dès maintenant, brièvement, avec ton heure d'arrivée estimée", score: 2, feedback: "Prévenir tôt et donner une estimation montre fiabilité et respect : ton équipe peut s'organiser." },
      { text: "Tu envoies un message une fois arrivé pour t'excuser", score: 1, feedback: "Mieux que rien, mais trop tard : on prévient AVANT, pas après." },
      { text: "Tu ne dis rien, 20 min ce n'est pas grave", score: 0, feedback: "Le silence donne l'impression que tu n'assumes pas. Un retard non signalé inquiète." },
    ],
    tip: "Un retard prévenu à l'avance passe ; un retard subi en silence marque.",
  },
  {
    ...base('ponctualite'), id: 'pon-2',
    situation: "On t'a confié une tâche pour vendredi. Mercredi, tu réalises que tu ne finiras pas à temps.",
    options: [
      { text: "Tu alertes ton responsable dès mercredi et proposes un nouveau délai ou de l'aide", score: 2, feedback: "Alerter tôt permet d'ajuster. L'anticipation est une marque de fiabilité, pas un aveu de faiblesse." },
      { text: "Tu attends vendredi en espérant te rattraper", score: 0, feedback: "Attendre la deadline pour annoncer un retard met tout le monde en difficulté." },
      { text: "Tu bâcles pour rendre quelque chose à temps", score: 1, feedback: "Tenir le délai compte, mais un travail bâclé peut coûter plus cher qu'un délai renégocié." },
    ],
    tip: "Un délai menacé se signale tôt : on préfère un report annoncé à une mauvaise surprise.",
  },
  {
    ...base('ponctualite'), id: 'pon-3',
    situation: "Tu es malade et ne peux pas venir travailler aujourd'hui.",
    options: [
      { text: "Tu préviens ton manager au plus tôt, selon la procédure, et envoies ton justificatif", score: 2, feedback: "Prévenir vite et suivre la procédure (arrêt, justificatif) est la base. L'équipe peut se réorganiser." },
      { text: "Tu envoies un SMS à un collègue pour qu'il transmette", score: 1, feedback: "L'info passe, mais c'est à toi de prévenir directement la bonne personne." },
      { text: "Tu ne préviens pas, tu expliqueras demain", score: 0, feedback: "Une absence non signalée est une faute : on s'inquiète et le travail n'est pas couvert." },
    ],
    tip: "Absence = prévenir le plus tôt possible, soi-même, la bonne personne.",
  },
  {
    ...base('ponctualite'), id: 'pon-4',
    situation: "Une réunion d'équipe commence à 9h. Il est 8h58 et tu arrives juste.",
    options: [
      { text: "Tu vises toujours 5-10 min d'avance pour les réunions importantes", score: 2, feedback: "Arriver un peu en avance, installé et prêt, montre du sérieux et évite de faire attendre." },
      { text: "Pile à l'heure, c'est bon", score: 1, feedback: "Acceptable, mais le 'pile à l'heure' laisse zéro marge au moindre imprévu." },
      { text: "Quelques minutes de retard, ça arrive à tout le monde", score: 0, feedback: "Faire attendre toute une équipe, même 5 min, coûte cher et agace." },
    ],
    tip: "Pour une réunion, 5 min d'avance = 0 stress et bonne image.",
  },
  {
    ...base('ponctualite'), id: 'pon-5',
    situation: "Tu as promis un document à un collègue « en fin de matinée ». Tu es débordé.",
    options: [
      { text: "Tu le préviens que ce sera plutôt en début d'après-midi", score: 2, feedback: "Tenir ses engagements OU renégocier honnêtement : c'est ça, la fiabilité." },
      { text: "Tu envoies un document incomplet à midi pile", score: 1, feedback: "Tu respectes l'heure mais pas la qualité : préviens plutôt d'un léger décalage." },
      { text: "Tu le rends quand tu peux, sans rien dire", score: 0, feedback: "Une promesse non tenue et non communiquée érode la confiance." },
    ],
    tip: "Tenir parole, c'est aussi prévenir quand on ne peut pas.",
  },

  // ── 💬 COMMUNICATION & EMAILS ──────────────────────────────────────────────
  {
    ...base('communication'), id: 'com-1',
    situation: "Tu écris ton premier email à un client important.",
    options: [
      { text: "Objet clair, formule de politesse, message concis et relu sans fautes", score: 2, feedback: "Un email pro soigné reflète l'image de l'entreprise. La clarté et l'orthographe priment." },
      { text: "Tu vas droit au but, sans formule de politesse mais poli", score: 1, feedback: "Efficace en interne, mais avec un client externe on garde les formules d'usage." },
      { text: "Tu écris comme à un pote, avec des abréviations", score: 0, feedback: "Le registre familier (« slt », « ct ») décrédibilise immédiatement." },
    ],
    tip: "Email client = objet clair + politesse + zéro faute.",
  },
  {
    ...base('communication'), id: 'com-2',
    situation: "Tu ne comprends pas une consigne que ton manager vient de te donner.",
    options: [
      { text: "Tu reformules pour vérifier (« si je comprends bien, tu veux… ? »)", score: 2, feedback: "Reformuler évite les erreurs et montre que tu écoutes. Personne n'attend que tu devines." },
      { text: "Tu fais à ta façon en espérant que c'est bon", score: 0, feedback: "Partir sur une mauvaise compréhension fait perdre du temps à tout le monde." },
      { text: "Tu demandes à un collègue ce que le manager voulait dire", score: 1, feedback: "Utile parfois, mais le plus fiable est de clarifier directement à la source." },
    ],
    tip: "Dans le doute, reformule : « pour être sûr de bien faire… ».",
  },
  {
    ...base('communication'), id: 'com-3',
    context: "Tu es ajouté à un fil d'email avec 12 personnes. Quelqu'un pose une question qui ne te concerne pas.",
    situation: "Faut-il répondre « à tous » ?",
    options: [
      { text: "Tu ne réponds que si c'est utile, et à la bonne personne (pas 'répondre à tous' inutilement)", score: 2, feedback: "Le 'répondre à tous' abusif pollue les boîtes. On répond ciblé et seulement si on apporte quelque chose." },
      { text: "Tu réponds à tous pour montrer que tu suis", score: 0, feedback: "Répondre à tous pour 'exister' agace et fait du bruit inutile." },
      { text: "Tu ignores, ça ne te concerne pas", score: 1, feedback: "Souvent correct, mais reste attentif si une partie te concerne malgré tout." },
    ],
    tip: "« Répondre à tous » : seulement si tout le monde a besoin de ta réponse.",
  },
  {
    ...base('communication'), id: 'com-4',
    situation: "En réunion, tu n'es pas d'accord avec une idée proposée par un collègue.",
    options: [
      { text: "Tu exposes ton point de vue avec respect, en argumentant", score: 2, feedback: "Le désaccord est sain quand il est exprimé avec tact et arguments. C'est attendu." },
      { text: "Tu gardes ton avis pour toi pour éviter les tensions", score: 1, feedback: "Parfois prudent, mais t'effacer systématiquement te rend invisible et prive l'équipe de ton apport." },
      { text: "Tu coupes la parole pour dire que c'est une mauvaise idée", score: 0, feedback: "Couper et juger frontalement braque tout le monde, même si tu as raison." },
    ],
    tip: "Pas d'accord ? « Je vois les choses autrement, parce que… ».",
  },
  {
    ...base('communication'), id: 'com-5',
    situation: "Un collègue te demande un service par message alors que tu es concentré sur une tâche urgente.",
    options: [
      { text: "Tu réponds brièvement que tu t'en occupes après ta tâche, en donnant un délai", score: 2, feedback: "Rester joignable tout en protégeant sa concentration : on répond avec un délai clair." },
      { text: "Tu lâches tout pour l'aider immédiatement", score: 1, feedback: "Serviable, mais sacrifier une urgence pour chaque sollicitation nuit à ton travail." },
      { text: "Tu ignores le message", score: 0, feedback: "Ignorer sans un mot laisse le collègue dans le flou et abîme la relation." },
    ],
    tip: "« Je termine un truc urgent, je reviens vers toi à 14h » : parfait.",
  },

  // ── 🤝 HIÉRARCHIE & FEEDBACK ───────────────────────────────────────────────
  {
    ...base('hierarchie'), id: 'hie-1',
    situation: "Ton manager te fait une remarque sur une erreur que tu as commise.",
    options: [
      { text: "Tu écoutes, tu remercies pour le retour et tu corriges", score: 2, feedback: "Accueillir un feedback sans se braquer et corriger : c'est la marque d'un bon professionnel." },
      { text: "Tu te justifies longuement pour expliquer que ce n'est pas ta faute", score: 0, feedback: "Se défendre frontalement donne l'impression de ne pas assumer. Écoute d'abord." },
      { text: "Tu acquiesces mais tu n'es pas d'accord et tu n'en dis rien", score: 1, feedback: "Mieux vaut, si tu es en désaccord, le dire avec tact plutôt que de ruminer." },
    ],
    tip: "Le feedback est un cadeau : « merci, je corrige » ouvre des portes.",
  },
  {
    ...base('hierarchie'), id: 'hie-2',
    situation: "Tu as terminé tes tâches plus tôt que prévu.",
    options: [
      { text: "Tu proposes ton aide ou demandes une nouvelle mission à ton manager", score: 2, feedback: "La proactivité (anticiper, proposer) est très valorisée, surtout en début de carrière." },
      { text: "Tu attends discrètement la fin de la journée", score: 0, feedback: "Faire semblant d'être occupé se voit vite et plombe ta réputation." },
      { text: "Tu en profites pour te former sur un sujet utile", score: 1, feedback: "Bonne initiative ; encore mieux si tu le signales pour rester aligné avec l'équipe." },
    ],
    tip: "« J'ai fini, je peux aider sur quoi ? » fait toujours bonne impression.",
  },
  {
    ...base('hierarchie'), id: 'hie-3',
    context: "Ton manager te demande de faire quelque chose que tu trouves inutile, mais ce n'est ni illégal ni grave.",
    situation: "Comment réagis-tu ?",
    options: [
      { text: "Tu exécutes, et tu partages ensuite ton point de vue avec tact si pertinent", score: 2, feedback: "Tu peux donner ton avis, mais en début de poste on respecte la décision puis on en discute calmement." },
      { text: "Tu refuses parce que ça ne sert à rien selon toi", score: 0, feedback: "Refuser une consigne légitime parce qu'on la juge inutile passe très mal." },
      { text: "Tu le fais en traînant des pieds", score: 1, feedback: "Tu obéis, mais la mauvaise volonté visible nuit à l'image que tu renvoies." },
    ],
    tip: "On peut questionner une consigne… après l'avoir respectée, et avec tact.",
  },
  {
    ...base('hierarchie'), id: 'hie-4',
    situation: "Tu as une idée d'amélioration pour un processus de ton équipe.",
    options: [
      { text: "Tu la proposes à ton manager, simplement, avec le bénéfice attendu", score: 2, feedback: "Proposer une amélioration argumentée montre de l'engagement. Même refusée, l'initiative est notée." },
      { text: "Tu la mets en place toi-même sans prévenir personne", score: 0, feedback: "Changer un process sans concertation peut désorganiser et froisser." },
      { text: "Tu la gardes pour toi, ce n'est pas ton rôle", score: 1, feedback: "Dommage : les bonnes idées des nouveaux sont souvent les bienvenues." },
    ],
    tip: "Une idée se propose (« et si on… ? »), elle ne s'impose pas en solo.",
  },
  {
    ...base('hierarchie'), id: 'hie-5',
    situation: "Tu ne sais pas faire une tâche qu'on vient de te confier.",
    options: [
      { text: "Tu le dis honnêtement et demandes comment faire ou de l'aide", score: 2, feedback: "Reconnaître une limite et demander de l'aide est plus pro que bluffer. On n'attend pas que tu saches tout." },
      { text: "Tu fais semblant et tu improvises", score: 0, feedback: "Bluffer mène souvent à une erreur coûteuse qui se découvre plus tard." },
      { text: "Tu cherches seul pendant des heures sans oser demander", score: 1, feedback: "L'autonomie est bien, mais s'enliser sans demander fait perdre du temps." },
    ],
    tip: "« Je ne sais pas encore, peux-tu me montrer ? » : zéro honte, que du pro.",
  },

  // ── 🧹 SAVOIR-VIVRE AU BUREAU ──────────────────────────────────────────────
  {
    ...base('savoirvivre'), id: 'sav-1',
    situation: "Tu prends une pause-café dans l'espace commun. La cafetière est vide.",
    options: [
      { text: "Tu la relances / la nettoies pour le suivant", score: 2, feedback: "Prendre soin des espaces partagés est un marqueur fort de savoir-vivre collectif." },
      { text: "Tu te sers d'autre chose et tu laisses comme c'est", score: 1, feedback: "Pas grave une fois, mais laisser systématiquement aux autres se remarque." },
      { text: "Tu laisses la cafetière vide et sale", score: 0, feedback: "Laisser la saleté pour les autres est l'un des comportements les plus mal vus en open space." },
    ],
    tip: "Espaces communs : on les laisse comme on aimerait les trouver.",
  },
  {
    ...base('savoirvivre'), id: 'sav-2',
    situation: "Tu es en open space et tu dois passer un appel personnel un peu long.",
    options: [
      { text: "Tu sors de l'open space (couloir, salle) pour ne pas déranger", score: 2, feedback: "Préserver le calme des autres est essentiel en espace partagé." },
      { text: "Tu parles doucement à ta place", score: 1, feedback: "Mieux que rien, mais un appel perso long, même à voix basse, gêne." },
      { text: "Tu prends l'appel normalement à ton bureau", score: 0, feedback: "Imposer sa conversation perso à tout l'open space agace rapidement." },
    ],
    tip: "Appel perso = on s'isole, par respect pour les autres.",
  },
  {
    ...base('savoirvivre'), id: 'sav-3',
    situation: "Pendant une réunion, ton téléphone vibre sans arrêt.",
    options: [
      { text: "Tu l'as mis en silencieux avant la réunion et tu restes attentif", score: 2, feedback: "Couper son téléphone avant une réunion est la base du respect de l'échange." },
      { text: "Tu jettes un œil discret de temps en temps", score: 1, feedback: "Ça reste perçu comme un manque d'attention." },
      { text: "Tu réponds à tes messages sous la table", score: 0, feedback: "Être sur son téléphone en réunion est très mal vu, même 'discrètement'." },
    ],
    tip: "Réunion = téléphone en silencieux, rangé.",
  },
  {
    ...base('savoirvivre'), id: 'sav-4',
    situation: "Un collègue te raconte un ragot sur une autre personne de l'équipe.",
    options: [
      { text: "Tu restes neutre et tu ne propages pas", score: 2, feedback: "Ne pas alimenter les ragots protège l'ambiance et ta réputation." },
      { text: "Tu écoutes mais tu ne dis rien à personne", score: 1, feedback: "Acceptable, tant que tu ne relaies pas ; reste vigilant à ne pas être entraîné." },
      { text: "Tu ajoutes ce que tu sais et tu le répètes ailleurs", score: 0, feedback: "Colporter des ragots détruit la confiance et finit toujours par se retourner contre toi." },
    ],
    tip: "Les ragots, on n'alimente pas : ça revient toujours à l'envoyeur.",
  },
  {
    ...base('savoirvivre'), id: 'sav-5',
    situation: "Tu hésites sur la tenue à porter pour ton premier jour.",
    options: [
      { text: "Tu observes les codes de l'entreprise (ou demandes), et tu t'habilles proprement et adapté", score: 2, feedback: "S'adapter aux codes vestimentaires du lieu montre du respect et du discernement." },
      { text: "Tu mets ta tenue la plus habillée par sécurité", score: 1, feedback: "Mieux vaut trop habillé que trop relâché, mais l'idéal est de coller aux codes du lieu." },
      { text: "Tu viens en tenue très décontractée, « pour être à l'aise »", score: 0, feedback: "Une tenue trop relâchée le premier jour envoie un mauvais signal." },
    ],
    tip: "Premier jour : propre, soigné, et adapté aux codes de la boîte.",
  },

  // ── 🚀 TES PREMIERS JOURS ──────────────────────────────────────────────────
  {
    ...base('premiersjours'), id: 'pre-1',
    situation: "C'est ton premier jour. On te présente plein de monde, tu oublies des prénoms.",
    options: [
      { text: "Tu notes discrètement les noms/rôles et n'hésites pas à redemander poliment", score: 2, feedback: "Noter et oser redemander montre de l'intérêt. Personne ne t'en voudra le premier jour." },
      { text: "Tu fais comme si tu te souvenais de tout", score: 1, feedback: "Tu risques des moments gênants ; mieux vaut assumer et redemander." },
      { text: "Tu évites les gens dont tu as oublié le nom", score: 0, feedback: "Éviter les collègues t'isole dès le départ." },
    ],
    tip: "Carnet + « pardon, ton prénom déjà ? » : parfaitement normal au début.",
  },
  {
    ...base('premiersjours'), id: 'pre-2',
    situation: "On ne t'a pas confié grand-chose pour ta première journée.",
    options: [
      { text: "Tu prends de l'avance : tu lis la doc, tu observes, tu poses des questions utiles", score: 2, feedback: "Se rendre utile et curieux dès le départ marque positivement." },
      { text: "Tu attends qu'on vienne te chercher", score: 1, feedback: "Compréhensible le jour 1, mais l'initiative est mieux perçue." },
      { text: "Tu passes le temps sur ton téléphone", score: 0, feedback: "Être sur son téléphone faute de tâche donne une très mauvaise première impression." },
    ],
    tip: "Pas de tâche ? Observe, lis, demande : la curiosité paie.",
  },
  {
    ...base('premiersjours'), id: 'pre-3',
    situation: "Tu ne connais pas encore les habitudes de l'équipe (pauses, horaires souples, rituels).",
    options: [
      { text: "Tu observes et tu t'alignes sur les codes de l'équipe avant d'imposer les tiens", score: 2, feedback: "S'imprégner de la culture avant de prendre ses aises facilite l'intégration." },
      { text: "Tu fais comme dans ton ancien stage/école", score: 1, feedback: "Chaque équipe a ses codes ; observe avant de transposer tes habitudes." },
      { text: "Tu imposes tout de suite tes propres habitudes", score: 0, feedback: "Arriver en imposant ses règles braque l'équipe en place." },
    ],
    tip: "Nouveau venu : on observe la culture avant de la bousculer.",
  },
  {
    ...base('premiersjours'), id: 'pre-4',
    context: "Première semaine. Un collègue t'invite à déjeuner avec l'équipe.",
    situation: "Tu es fatigué et tu préfères manger seul.",
    options: [
      { text: "Tu acceptes : les premiers déjeuners sont précieux pour t'intégrer", score: 2, feedback: "Les moments informels accélèrent énormément l'intégration. Quelques efforts au début comptent." },
      { text: "Tu déclines poliment cette fois mais montres de l'intérêt pour une prochaine", score: 1, feedback: "Correct si c'est ponctuel ; ne décline pas systématiquement au début." },
      { text: "Tu refuses sans explication", score: 0, feedback: "Refuser sèchement les invitations te coupe de l'équipe dès le départ." },
    ],
    tip: "Les premiers déjeuners d'équipe valent de l'or pour s'intégrer.",
  },
  {
    ...base('premiersjours'), id: 'pre-5',
    situation: "À la fin de ta première semaine, ton tuteur te demande comment ça se passe.",
    options: [
      { text: "Tu fais un retour honnête et constructif, et tu poses tes questions en suspens", score: 2, feedback: "Un point d'étape sincère aide ton tuteur à t'accompagner et montre ton implication." },
      { text: "Tu réponds « tout va bien » même si tu es perdu", score: 0, feedback: "Cacher tes difficultés t'empêche d'être aidé et les problèmes s'accumulent." },
      { text: "Tu listes uniquement ce qui ne va pas", score: 1, feedback: "Le retour est utile, mais équilibre : ce qui va, ce qui coince, tes questions." },
    ],
    tip: "Point d'étape : sois honnête, c'est fait pour t'aider.",
  },
];

/** Mélange (Fisher-Yates) sans muter l'entrée. */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Thèmes disponibles (avec compteurs). */
export function listCodeThemes() {
  return Object.entries(CODE_THEMES).map(([id, meta]) => ({
    id, ...meta,
    count: SCENARIOS.filter((s) => s.theme === id).length,
  })).filter((t) => t.count > 0);
}

/**
 * Construit une session SJT.
 * @param {object} [opts]
 * @param {string} [opts.theme] - id de thème ('all' = mix)
 * @param {number} [opts.size]  - nombre de situations (défaut 8)
 */
export function buildCodesSession({ theme = 'all', size = 8 } = {}) {
  let pool = theme === 'all' ? SCENARIOS : SCENARIOS.filter((s) => s.theme === theme);
  pool = shuffle(pool).slice(0, size);
  return pool.map((s) => ({ ...s, options: shuffle(s.options) }));
}

/** XP gagnée selon le score (0/1/2) d'une réaction. */
export function xpForScore(score) {
  return SCORE_XP[score] ?? 0;
}

/**
 * Note /20 d'une session à partir des scores choisis.
 * @param {number[]} scores - scores (0..2) de chaque réponse
 */
export function computeNote(scores) {
  if (!scores.length) return 0;
  const total = scores.reduce((s, n) => s + (n || 0), 0);
  return Math.round((total / (scores.length * 2)) * 20);
}

// ── Persistance de la maîtrise des codes (meilleure note /20) ─────────────────
const LS_CODES = 'altio_codes_progress';

/** Enregistre le résultat d'une session « codes » (meilleure note conservée). */
export function saveCodesResult(note) {
  try {
    const prev = JSON.parse(localStorage.getItem(LS_CODES) || '{}');
    const n = Math.max(0, Math.min(20, Math.round(note || 0)));
    const data = { bestNote: Math.max(prev.bestNote || 0, n), plays: (prev.plays || 0) + 1 };
    localStorage.setItem(LS_CODES, JSON.stringify(data));
    return data;
  } catch { return null; }
}

/** Meilleure note /20 obtenue aux codes (0 si jamais joué). */
export function getCodesBest() {
  try { return JSON.parse(localStorage.getItem(LS_CODES) || '{}').bestNote || 0; }
  catch { return 0; }
}
