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

  // ── Ressources Humaines — Chargé de recrutement ─────────────────────────────
  'rh-charge-recrutement': {
    label: 'Chargé de recrutement',
    sector: 'Ressources Humaines',
    emoji: '🧲',
    profile: 'Bac+4/5 — Master RH ou École de Commerce.',
    trend: "Face à la pénurie de talents, le recrutement s'appuie sur l'IA pour le sourcing et sur la marque employeur (LinkedIn).",
    pitch: "Tu trouves les bons profils et tu donnes envie de rejoindre l'entreprise : sourcing augmenté par l'IA, entretiens, marque employeur. Tu es la première image que le candidat a de la boîte.",
    keySkills: [
      { name: 'Sourcing & approche directe', why: "Les meilleurs profils ne postulent pas : il faut aller les chercher (CVthèques, LinkedIn, Boolean search)." },
      { name: "Recrutement augmenté par l'IA", why: "Trier et qualifier les candidatures plus vite, sans perdre en qualité." },
      { name: 'Expérience candidat', why: "Un candidat bien traité, même refusé, parle en bien de l'entreprise : c'est la marque employeur." },
      { name: 'Communication & marque employeur', why: "Des contenus qui valorisent la vie de l'entreprise attirent les candidatures spontanées." },
    ],
    recruiterLooksFor: [
      "Une vraie curiosité pour les outils (ATS, IA, LinkedIn Recruiter)",
      "Le sens de la confidentialité et de l'éthique",
      "De l'aisance à l'oral pour les pré-entretiens",
      "Le souci du détail dans les feedbacks candidats",
    ],
    pitfalls: [
      "Trier uniquement sur le diplôme et passer à côté de bons profils atypiques",
      "Laisser des candidats sans réponse (ça abîme la marque employeur)",
      "Diffuser la même offre partout sans l'optimiser",
    ],
    situations: [
      { situation: "Tu as 80 candidatures pour une offre et 2 jours pour présélectionner.", skill: "Recrutement augmenté par l'IA" },
      { situation: "Le poste est difficile à pourvoir, personne ne postule.", skill: 'Sourcing & approche directe' },
      { situation: "Un candidat refusé demande pourquoi sa candidature n'a pas abouti.", skill: 'Expérience candidat' },
    ],
    hard: ['ATS (Welcome to the Jungle, Teamtailor)', 'LinkedIn Recruiter', 'Boolean search', 'Sourcing assisté par IA', 'Canva'],
    soft: ['Écoute active', 'Aisance orale et écrite', 'Curiosité technologique', 'Sens de la confidentialité'],
  },

  // ── Marketing — Growth marketer / Chef de projet digital ────────────────────
  'mkt-growth': {
    label: 'Growth marketer / Chef de projet digital',
    sector: 'Marketing & Communication',
    emoji: '🚀',
    profile: 'Bac+3 à Bac+5 — BUT TC, Master Marketing Digital ou École de Commerce.',
    trend: "Le marketing traditionnel s'efface au profit du Growth : générer des leads qualifiés en combinant créativité et data.",
    pitch: "Tu fais grandir l'entreprise en attirant des prospects : publicité en ligne, SEO, contenu, automation… et tu mesures tout. Créativité ET obsession du résultat.",
    keySkills: [
      { name: 'Acquisition de trafic (paid & SEO)', why: "Sans visiteurs qualifiés, pas de prospects ni de ventes." },
      { name: 'Marketing automation', why: "Des scénarios d'emailing nourrissent les prospects jusqu'à l'achat, automatiquement." },
      { name: "Création de contenu (avec l'IA)", why: "Articles, visuels, vidéos courtes : produire plus et plus vite grâce aux prompts." },
      { name: 'Analyse de données (analytics)', why: "Lire les tunnels de vente pour savoir quoi optimiser, pas au feeling." },
    ],
    recruiterLooksFor: [
      "Une obsession du ROI et des chiffres",
      "La culture du test (A/B testing)",
      "De l'autonomie et de la curiosité sur les outils",
      "Un esprit créatif autant qu'analytique",
    ],
    pitfalls: [
      "Lancer des campagnes sans objectif mesurable",
      "Créer du contenu sans regarder ce qui convertit",
      "Se disperser sur tous les canaux à la fois",
    ],
    situations: [
      { situation: "Ta campagne Meta Ads coûte cher et ne convertit pas.", skill: 'Analyse de données (analytics)' },
      { situation: "Tu dois produire 8 posts et 2 vidéos cette semaine.", skill: "Création de contenu (avec l'IA)" },
      { situation: "Les prospects s'inscrivent mais n'achètent jamais.", skill: 'Marketing automation' },
    ],
    hard: ['Google Ads', 'Meta / LinkedIn Ads', 'GA4', 'Looker Studio', 'HubSpot / Brevo', 'SEO', 'ChatGPT / Midjourney', 'WordPress / Webflow'],
    soft: ['Esprit analytique', 'Créativité', 'Culture du test', 'Autonomie'],
  },

  // ── Administratif — Office manager ──────────────────────────────────────────
  'admin-office-manager': {
    label: 'Office manager',
    sector: 'Administratif',
    emoji: '🗂️',
    profile: 'Bac+2 à Bac+3 — BTS GPME, SAM ou BUT GEA.',
    trend: "L'assistant administratif devient le moteur de l'organisation en mode hybride : il fluidifie et automatise.",
    pitch: "Tu fais tourner l'entreprise au quotidien : organisation, logistique, support à la direction, et tu automatises les tâches répétitives pour faire gagner du temps à tout le monde.",
    keySkills: [
      { name: 'Organisation & priorités', why: "Tout passe par toi : sans méthode, l'entreprise s'enraye." },
      { name: 'Support à la direction', why: "Agendas complexes, déplacements, réunions : tu fais gagner du temps aux décideurs." },
      { name: 'Digitalisation des process', why: "Automatiser les tâches chronophages (Notion, Zapier) libère toute l'équipe." },
      { name: 'Sens du service & diplomatie', why: "Tu es l'interface entre tous : gérer les demandes et les imprévus avec tact." },
    ],
    recruiterLooksFor: [
      "Une organisation à toute épreuve",
      "De la réactivité face aux imprévus",
      "De la diplomatie et de la discrétion",
      "Le goût des outils qui font gagner du temps",
    ],
    pitfalls: [
      "Tout faire à la main au lieu d'automatiser",
      "Oublier de prioriser et se laisser déborder",
      "Manquer de discrétion sur des informations sensibles",
    ],
    situations: [
      { situation: "Trois personnes te demandent une urgence en même temps.", skill: 'Organisation & priorités' },
      { situation: "La même tâche administrative te prend 2 h chaque semaine.", skill: 'Digitalisation des process' },
      { situation: "Le dirigeant a un agenda surchargé et un déplacement à organiser.", skill: 'Support à la direction' },
    ],
    hard: ['Office 365 / Google Workspace', 'Notion / Trello / Asana', 'Zapier / Make', 'Pennylane / Sellsy'],
    soft: ['Sens du service', 'Ultra-organisé', 'Diplomatie', 'Réactivité'],
  },

  // ── Finance & Gestion — Assistant contrôleur de gestion ─────────────────────
  'fin-controle-gestion': {
    label: 'Assistant contrôleur de gestion',
    sector: 'Finance & Gestion',
    emoji: '📊',
    profile: 'Bac+3 à Bac+5 — DCG, Master Finance / Contrôle de gestion ou École de Commerce.',
    trend: "La finance ne saisit plus les chiffres, elle les fait parler : la Business Intelligence aide la direction à décider en temps réel.",
    pitch: "Tu transformes les chiffres en décisions : clôtures, analyse des écarts budget/réel, tableaux de bord. Tu aides la direction à piloter l'entreprise.",
    keySkills: [
      { name: 'Analyse des écarts budget / réel', why: "Repérer les dérives tôt permet de réagir avant qu'il soit trop tard." },
      { name: 'Reporting & fiabilité des données', why: "Une décision ne vaut que si les chiffres derrière sont justes." },
      { name: 'Business Intelligence (tableaux de bord)', why: "Des dashboards clairs font gagner un temps fou à la direction." },
      { name: 'Vulgarisation des chiffres', why: "Expliquer simplement à des non-financiers, c'est ce qui rend l'analyse utile." },
    ],
    recruiterLooksFor: [
      "Une vraie rigueur et de l'esprit de synthèse",
      "L'aisance sur Excel (et l'envie d'apprendre Power BI)",
      "La capacité à alerter et à argumenter",
      "De la curiosité pour le business, pas que les chiffres",
    ],
    pitfalls: [
      "Produire des chiffres sans les expliquer ni alerter",
      "Faire confiance à une donnée sans la fiabiliser",
      "Se noyer dans Excel au lieu d'automatiser",
    ],
    situations: [
      { situation: "Les dépenses d'un service dépassent largement le budget prévu.", skill: 'Analyse des écarts budget / réel' },
      { situation: "La direction veut un suivi clair de la rentabilité chaque mois.", skill: 'Business Intelligence (tableaux de bord)' },
      { situation: "Un manager non-financier ne comprend pas ton tableau.", skill: 'Vulgarisation des chiffres' },
    ],
    hard: ['Excel (Power Query, macros)', 'Power BI / Tableau', 'ERP (SAP, Sage, Dynamics)', 'Comptabilité analytique'],
    soft: ['Esprit de synthèse', 'Rigueur', 'Pédagogie', "Esprit d'analyse"],
  },

  // ── Commerce / Vente — Business developer / Inside sales (B2B) ───────────────
  'com-business-developer': {
    label: 'Business developer / Inside sales',
    sector: 'Commerce / Vente',
    emoji: '💼',
    profile: 'Bac+3 à Bac+5 — BTS NDRC, BUT TC, Master Commerce ou École de Commerce.',
    trend: "Le commerce moderne repose sur le social selling et l'analyse des données pour cibler le bon client au bon moment.",
    pitch: "Tu vas chercher les clients : prospection multicanale, social selling, rendez-vous de découverte. Mental d'acier et goût du résultat.",
    keySkills: [
      { name: 'Prospection multicanale', why: "Cold-call, emails, LinkedIn : multiplier les contacts pour décrocher des rendez-vous." },
      { name: 'Social selling', why: "Être visible sur LinkedIn fait venir les prospects à toi (inbound)." },
      { name: 'Découverte & qualification', why: "Comprendre le vrai besoin avant de pitcher, sinon on vend à côté." },
      { name: 'Pilotage du CRM & des KPIs', why: "Tracer ses échanges et lire son taux de conversion pour progresser." },
    ],
    recruiterLooksFor: [
      "Une résilience à toute épreuve face au refus",
      "Le goût du défi et des objectifs chiffrés",
      "Une excellente communication orale",
      "De la rigueur dans le suivi (CRM)",
    ],
    pitfalls: [
      "Pitcher la solution avant d'avoir cerné le besoin",
      "Lâcher après un premier « non »",
      "Négliger la traçabilité dans le CRM",
    ],
    situations: [
      { situation: "Tu enchaînes les « non » depuis ce matin au téléphone.", skill: 'Prospection multicanale' },
      { situation: "Un prospect te dit « envoyez-moi une doc » pour t'éviter.", skill: 'Découverte & qualification' },
      { situation: "Ton manager te demande ton taux de conversion du mois.", skill: 'Pilotage du CRM & des KPIs' },
    ],
    hard: ['CRM (Salesforce, HubSpot)', 'Sales Navigator', 'Dropcontact / Lusha', 'SPIN Selling / MEDDIC'],
    soft: ['Résilience', 'Goût du défi', 'Communication orale', 'Écoute active'],
  },

  // ── Ressources Humaines — Assistant RH ──────────────────────────────────────
  'rh-assistant': {
    label: 'Assistant RH',
    sector: 'Ressources Humaines',
    emoji: '📋',
    profile: 'Bac+2 à Bac+3 — BTS SAM, Licence Pro RH ou BUT GEA.',
    pitch: "Tu es le bras droit de l'équipe RH au quotidien : contrats, dossiers du personnel, congés, paie, recrutement. La rigueur et la discrétion sont ta marque de fabrique.",
    keySkills: [
      { name: 'Administration du personnel', why: "Contrats, DPAE, dossiers salariés : une erreur ici peut coûter cher à l'entreprise." },
      { name: 'Gestion des temps & absences', why: "Congés, arrêts, éléments variables de paie : tout doit être suivi sans rien oublier." },
      { name: 'Support au recrutement', why: "Publier, trier, planifier : tu fais avancer les recrutements concrètement." },
      { name: 'Bases en droit du travail', why: "Connaître le cadre légal évite les erreurs et sécurise l'entreprise." },
    ],
    recruiterLooksFor: [
      "Une rigueur et un sens du détail irréprochables",
      "La discrétion absolue sur des données sensibles",
      "Le sens de l'accueil et du service",
      "De l'aisance avec Excel et Word",
    ],
    pitfalls: [
      "Laisser traîner une déclaration (DPAE) ou un contrat",
      "Parler d'informations confidentielles en dehors du service",
      "Saisir les éléments de paie sans double-vérifier",
    ],
    situations: [
      { situation: "Un nouveau salarié arrive lundi : il faut son contrat et sa DPAE.", skill: 'Administration du personnel' },
      { situation: "Plusieurs demandes de congés se chevauchent dans l'équipe.", skill: 'Gestion des temps & absences' },
      { situation: "Le responsable te demande de présélectionner 20 CV pour demain.", skill: 'Support au recrutement' },
    ],
    hard: ['Pack Office (Word, Excel)', 'Bases en droit du travail', 'Jobboards', 'Gestion administrative', 'OPCO'],
    soft: ['Rigueur', 'Discrétion', "Sens de l'accueil", 'Organisation'],
  },

  // ── Marketing — Assistant marketing & communication ─────────────────────────
  'mkt-assistant-com': {
    label: 'Assistant marketing & communication',
    sector: 'Marketing & Communication',
    emoji: '📣',
    profile: 'Bac+2 à Bac+3 — BTS Communication, BTS MCO ou BUT TC.',
    pitch: "Tu donnes vie au plan de com : supports, événements, newsletter, réseaux. Polyvalence et créativité au service de la marque.",
    keySkills: [
      { name: 'Création de supports', why: "Plaquettes, catalogues, présentations : ce sont les vitrines de l'entreprise." },
      { name: 'Organisation événementielle', why: "Salons et événements : la logistique fait la réussite (ou l'échec)." },
      { name: 'Animation des canaux digitaux', why: "Newsletter, site, réseaux : garder la marque vivante et visible." },
      { name: 'Veille concurrentielle', why: "Surveiller la concurrence nourrit les bonnes décisions marketing." },
    ],
    recruiterLooksFor: [
      "Une orthographe irréprochable",
      "De la polyvalence et de la débrouillardise",
      "Un œil créatif (mise en page, visuels)",
      "Le sens de l'organisation",
    ],
    pitfalls: [
      "Publier un support avec des fautes",
      "Sous-estimer la logistique d'un salon",
      "Négliger la régularité sur les réseaux",
    ],
    situations: [
      { situation: "Le catalogue produits doit être prêt pour le salon dans 3 jours.", skill: 'Création de supports' },
      { situation: "Le stand du salon arrive mais le matériel n'est pas livré.", skill: 'Organisation événementielle' },
      { situation: "La newsletter du mois n'est toujours pas partie.", skill: 'Animation des canaux digitaux' },
    ],
    hard: ['Pack Office / PowerPoint', 'PAO (Photoshop ou équivalent)', "Outils d'emailing", 'Réseaux sociaux', 'Mise à jour de site'],
    soft: ['Polyvalence', 'Créativité', "Esprit d'équipe", 'Organisation'],
  },

  // ── Administratif — Assistant de gestion administrative ──────────────────────
  'admin-assistant-gestion': {
    label: 'Assistant de gestion administrative',
    sector: 'Administratif',
    emoji: '📇',
    profile: 'Bac+2 — BTS GPME ou BTS SAM.',
    pitch: "Tu es le pivot du bureau : accueil, courrier, agendas, documents, fournitures. Tu fais circuler l'information et tu fluidifies tout.",
    keySkills: [
      { name: 'Accueil & secrétariat', why: "Premier contact de l'entreprise : l'image passe par toi." },
      { name: 'Gestion des agendas & déplacements', why: "Réunions, salles, billets : tu fais gagner du temps à toute l'équipe." },
      { name: 'Traitement & archivage des documents', why: "Un document bien classé est un document retrouvé en 10 secondes." },
      { name: 'Services généraux', why: "Sans fournitures ni suivi des commandes, le bureau s'arrête." },
    ],
    recruiterLooksFor: [
      "Une excellente expression orale et écrite",
      "Une présentation soignée",
      "De la ponctualité et de la fiabilité",
      "Le sens des priorités",
    ],
    pitfalls: [
      "Oublier de transmettre un message ou un courrier important",
      "Laisser l'archivage s'accumuler",
      "Se laisser déborder sans hiérarchiser les urgences",
    ],
    situations: [
      { situation: "Le téléphone sonne pendant que tu accueilles un client au comptoir.", skill: 'Accueil & secrétariat' },
      { situation: "Deux réunions sont planifiées dans la même salle au même créneau.", skill: 'Gestion des agendas & déplacements' },
      { situation: "Un collègue cherche un compte-rendu d'il y a 6 mois.", skill: 'Traitement & archivage des documents' },
    ],
    hard: ['Outlook', 'Word', 'Excel', 'Gestion du courrier', 'Suivi des fournisseurs'],
    soft: ['Présentation soignée', 'Ponctualité', 'Organisation', 'Sens des priorités'],
  },

  // ── Finance & Gestion — Assistant comptable ─────────────────────────────────
  'fin-assistant-comptable': {
    label: 'Assistant comptable',
    sector: 'Finance & Gestion',
    emoji: '🧾',
    profile: 'Bac+2 à Bac+3 — BTS CG, DCG ou BUT GEA option comptabilité.',
    pitch: "Tu tiens les comptes au quotidien : factures fournisseurs et clients, banque, rapprochements. Rigueur et goût des chiffres sont indispensables.",
    keySkills: [
      { name: 'Comptabilité fournisseurs', why: "Enregistrer et vérifier les achats évite les erreurs de paiement." },
      { name: 'Comptabilité clients & relances', why: "Facturer et relancer à temps, c'est la trésorerie de l'entreprise." },
      { name: 'Trésorerie & rapprochements bancaires', why: "Coller les comptes à la banque garantit des chiffres justes." },
      { name: 'Classement & justificatifs', why: "Une pièce manquante peut bloquer un contrôle ou une clôture." },
    ],
    recruiterLooksFor: [
      "Une rigueur extrême et de la méthode",
      "L'aisance avec les chiffres",
      "La maîtrise (ou l'envie d'apprendre) un logiciel comptable",
      "De la concentration sur la durée",
    ],
    pitfalls: [
      "Saisir une facture sans vérifier le bon de commande",
      "Oublier de relancer une facture impayée",
      "Classer ses pièces « plus tard » et s'y perdre",
    ],
    situations: [
      { situation: "Une facture fournisseur ne correspond pas au bon de commande.", skill: 'Comptabilité fournisseurs' },
      { situation: "Plusieurs clients ont des factures en retard de paiement.", skill: 'Comptabilité clients & relances' },
      { situation: "Le solde comptable ne colle pas avec le relevé bancaire.", skill: 'Trésorerie & rapprochements bancaires' },
    ],
    hard: ['Comptabilité générale (débit/crédit)', 'Logiciel comptable (Sage, EBP, Cegid)', 'Excel', 'Rapprochement bancaire'],
    soft: ['Rigueur', 'Méthode', 'Esprit logique', 'Concentration'],
  },

  // ── Commerce / Vente — Assistant commercial / ADV ───────────────────────────
  'com-assistant-adv': {
    label: 'Assistant commercial / ADV',
    sector: 'Commerce / Vente',
    emoji: '📦',
    profile: 'Bac+2 à Bac+3 — BTS NDRC, BTS MCO ou BUT TC.',
    pitch: "Tu fais le lien entre les clients et les commerciaux : commandes, devis, suivi, facturation, livraison. Tu es la colonne vertébrale de la relation client.",
    keySkills: [
      { name: 'Gestion des commandes', why: "Une commande mal saisie, c'est un client mécontent et une livraison ratée." },
      { name: 'Suivi de la relation client', why: "Informer sur les délais et la disponibilité rassure et fidélise le client." },
      { name: 'Devis & dossiers commerciaux', why: "Des devis justes et rapides aident les commerciaux à conclure." },
      { name: 'Facturation & logistique', why: "Factures et bons de livraison : le dernier maillon avant le paiement." },
    ],
    recruiterLooksFor: [
      "De l'aisance au téléphone",
      "Un vrai sens commercial et du service",
      "De la réactivité face aux imprévus",
      "De la rigueur dans le suivi (ERP, fichiers)",
    ],
    pitfalls: [
      "Saisir une commande sans la vérifier",
      "Laisser un client sans réponse sur son délai",
      "Promettre un délai que la logistique ne peut pas tenir",
    ],
    situations: [
      { situation: "Un client appelle, furieux : sa commande n'est pas arrivée.", skill: 'Suivi de la relation client' },
      { situation: "Un commercial te demande un devis pour cet après-midi.", skill: 'Devis & dossiers commerciaux' },
      { situation: "Une commande urgente vient d'arriver par email.", skill: 'Gestion des commandes' },
    ],
    hard: ['ERP / gestion commerciale', 'Excel', 'Facturation', 'Anglais commercial'],
    soft: ['Sens commercial', 'Réactivité', 'Résistance au stress', 'Diplomatie'],
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

/**
 * Liste tous les postes (débouchés) regroupés par secteur, libellés nettoyés.
 * Source : FORMATIONS (secteur) + POSTES (débouchés) de cvData. Dédupliqué et trié.
 * Sert à cibler un contenu « par type de poste » (ex. lettre de motivation).
 * @returns {Object<string, string[]>} { secteur: [poste, ...] }
 */
export function listPostesBySector() {
  const acc = {};
  for (const f of FORMATIONS) {
    const sector = fixMojibake(f.f) || 'Autre';
    (acc[sector] = acc[sector] || new Set());
    (POSTES[f.v] || []).forEach((p) => acc[sector].add(fixMojibake(p)));
  }
  const out = {};
  Object.keys(acc).sort((a, b) => a.localeCompare(b, 'fr')).forEach((s) => {
    out[s] = [...acc[s]].sort((a, b) => a.localeCompare(b, 'fr'));
  });
  return out;
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
    const hist = JSON.parse(localStorage.getItem('ALTIO_CV_hist') || '[]');
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
