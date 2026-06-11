/**
 * commerceDemo — Parcours guidé « Ton 1er entretien » (thème Vente / Commerce).
 *
 * Mini-session scénarisée de 3 étapes qui met en scène les 3 typologies
 * d'exercices façon Duolingo. Volontairement HORS de la banque `QUESTIONS`
 * (jouée via `buildDemoSession`) car elle mélange plusieurs `kind` :
 *   - 'mcq'        : scénario à choix multiples (Type A)
 *   - 'translator' : « Traducteur Pro » — ordonner des blocs (Type B)
 *   - 'boss'       : mise en situation à fort enjeu (Type C), XP majoré
 *
 * Le coach « Sam » s'exprime dans `explanation`/`tip`. Les mauvaises réponses
 * ciblent de vrais tics de langage (« ouais », « je sais pas », « relous »…).
 */
const DEMO_QUESTIONS = [
  // ── Étape 1 — L'arrivée (Type A : QCM) ─────────────────────────────────────
  {
    id: 'demo-arrivee', sector: 'commerce', type: 'comportemental', kind: 'mcq', difficulty: 1,
    context:
      "Boutique de prêt-à-porter, poste de vendeur(se). La responsable se lève, " +
      "te tend la main et te fait entrer dans son bureau.",
    situation: "« Bonjour, installez-vous. Vous voulez bien vous présenter ? »",
    question: "Tu viens d'entrer. Quelle entrée en matière fait la meilleure impression ?",
    options: [
      {
        text: "« Bonjour, merci de me recevoir. » Sourire, poignée de main franche, et j'attends qu'on m'invite à m'asseoir.",
        correct: true,
      },
      { text: "« Ouais salut, c'est pour le taf de vendeur quoi. »", correct: false },
      { text: "Je m'assois directement et je pose mon téléphone sur le bureau.", correct: false },
      { text: "« Voilà bah… je sais pas trop quoi dire en fait. »", correct: false },
    ],
    explanation:
      "La première impression se joue en 7 secondes : un bonjour clair, un sourire, " +
      "une poignée de main franche et le contact visuel posent tout de suite une image " +
      "pro et sympathique. Trop familier (« ouais », « le taf »), tu casses le cadre ; " +
      "trop hésitant, tu sembles peu motivé.",
    tip: "Coupe ton téléphone AVANT d'entrer, et attends qu'on t'invite à t'asseoir.",
  },

  // ── Étape 2 — Le Traducteur Pro (Type B : ordonner des blocs) ──────────────
  {
    id: 'demo-traducteur', sector: 'commerce', type: 'situation', kind: 'translator', difficulty: 2,
    situation: "Un client s'énerve à la caisse. Le recruteur te demande comment tu réagis.",
    casual: "Moi je m'en fous des clients relous, je leur crie pas dessus.",
    question: "Reformule cette phrase en langage pro : remets les blocs dans le bon ordre.",
    // Ordre correct attendu (les blocs seront mélangés à l'écran).
    blocks: [
      'Je garde mon calme',
      'et je reste poli',
      'pour désamorcer',
      'la situation.',
    ],
    target: 'Je garde mon calme et je reste poli pour désamorcer la situation.',
    explanation:
      "Même idée, ton radicalement différent. « Je m'en fous » et « relous » te font " +
      "passer pour quelqu'un qui méprise les clients — rédhibitoire en vente. La version " +
      "pro montre du sang-froid et le sens du service : exactement ce qu'un recruteur " +
      "commercial cherche.",
    tip: "Bannis les mots qui jugent le client (« relous », « lourd »). Parle de TON attitude.",
  },

  // ── Étape 3 — Le test du stylo (Type C : Boss final, XP majoré) ────────────
  {
    id: 'demo-stylo', sector: 'commerce', type: 'situation', kind: 'boss', difficulty: 3,
    context:
      "Dernière question. La responsable sort un stylo de sa poche, le pose devant toi " +
      "et te regarde droit dans les yeux.",
    situation: "« Allez, dernier test : vendez-moi ce stylo. »",
    question: "Quel argumentaire choisis-tu pour décrocher le poste ?",
    options: [
      {
        text: "Je commence par une question : « Dans quelles situations prenez-vous des notes au quotidien ? » pour proposer LE stylo adapté à votre usage.",
        correct: true,
      },
      { text: "« Ce stylo est le moins cher du marché, prenez-le, c'est une bonne affaire. »", correct: false },
      { text: "« Bah… c'est un stylo, ça écrit, comme tous les stylos. Vous en voulez un ? »", correct: false },
      { text: "« Tout le monde en a un, faut suivre la tendance quoi. »", correct: false },
    ],
    explanation:
      "Le test du stylo n'évalue pas le produit, mais TA méthode de vente. Le réflexe " +
      "gagnant : découvrir le besoin AVANT d'argumenter. En posant une question, tu " +
      "personnalises ta vente — c'est le cœur du métier de commercial. Casser le prix ou " +
      "réciter une évidence ne crée aucune valeur.",
    tip: "En vente, on écoute d'abord, on argumente ensuite. Le besoin guide l'argument.",
  },
];

export default DEMO_QUESTIONS;
