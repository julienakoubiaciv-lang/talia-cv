/**
 * demoResponses — Réponses IA SIMULÉES (mode démo, sans backend).
 *
 * Tant que l'Edge Function claude-proxy n'est pas déployée, ce module renvoie
 * des réponses réalistes en local pour que toute l'app soit jouable de bout en
 * bout (lettre, test de recrutement, entretien oral, sessions IA, optimisation).
 *
 * `mockClaudeResponse()` imite la forme d'une réponse Anthropic :
 *   { content: [{ type:'text', text }], usage:{...}, demo:true }
 * Le `text` est du JSON/texte que les parsers de chaque feature savent lire.
 */

// Pas de latence simulée pendant les tests (suite rapide).
const IS_TEST = typeof process !== 'undefined' && !!process.env?.VITEST;
const delay = (ms) => (IS_TEST ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
const wrap = (text) => ({
  id: `demo-${Date.now()}`,
  type: 'message',
  role: 'assistant',
  model: 'demo',
  demo: true,
  content: [{ type: 'text', text: String(text) }],
  usage: { input_tokens: 0, output_tokens: 0 },
});

const pick = (arr, n) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return n ? a.slice(0, n) : a;
};
const userText = (messages) => (messages || []).map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n');
const grab = (text, re) => { const m = String(text).match(re); return m ? m[1].trim() : ''; };

/** Point d'entrée : renvoie une réponse simulée selon metadata.feature. */
export async function mockClaudeResponse({ action, messages, metadata } = {}) {
  await delay(700 + Math.random() * 900); // latence réaliste
  const feature = metadata?.feature || action || '';
  const u = userText(messages);

  switch (feature) {
    case 'cover_letter':     return wrap(demoCoverLetter(metadata, u));
    case 'recruit_test':     return wrap(JSON.stringify(demoRecruitTest(metadata, u)));
    case 'oral_interview_gen': return wrap(JSON.stringify(demoOralQuestions(metadata, u)));
    case 'oral_interview_eval': return wrap(JSON.stringify(demoOralEval(metadata, u)));
    case 'ai_interview':     return wrap(JSON.stringify(demoAiInterview(metadata, u)));
    case 'cv_optimize':      return wrap(JSON.stringify(demoCvOptimize(u)));
    default:                 return wrap(JSON.stringify({ note: 'Réponse simulée (mode démo).' }));
  }
}

// ── Cible (entreprise / poste) extraite du prompt ─────────────────────────────
function targetOf(u) {
  const company = grab(u, /Entreprise\s*:\s*(.+)/i) || 'votre entreprise';
  const role = grab(u, /(?:Intitulé du poste|Type de poste visé|Poste visé)\s*:\s*(.+)/i) || 'le poste proposé';
  return { company, role };
}

// ── Lettre / kit de candidature ───────────────────────────────────────────────
function demoCoverLetter(metadata, u) {
  const { company, role } = targetOf(u);
  const type = metadata?.messageType || 'motivation';

  if (type === 'relance') {
    return JSON.stringify({
      subject: `Suivi de ma candidature — ${role}`,
      paragraphs: [
        `Bonjour,`,
        `Je me permets de revenir vers vous concernant ma candidature au poste de ${role}, transmise il y a quelques jours. Je reste très motivé(e) à l'idée de rejoindre ${company} et de contribuer à vos projets.`,
        `Je me tiens bien sûr à votre disposition pour vous fournir tout complément d'information ou pour échanger lors d'un entretien.`,
        `Vous remerciant pour l'attention portée à ma candidature, je vous prie d'agréer mes salutations distinguées.`,
      ],
    });
  }
  if (type === 'remerciement') {
    return JSON.stringify({
      subject: `Merci pour notre échange — ${role}`,
      paragraphs: [
        `Bonjour,`,
        `Je tenais à vous remercier pour le temps que vous m'avez accordé lors de notre entretien pour le poste de ${role}. Notre échange a renforcé mon intérêt pour ${company} et pour les missions présentées.`,
        `J'ai particulièrement apprécié d'en apprendre davantage sur vos enjeux ; je suis convaincu(e) que mon profil et mon implication pourraient y répondre concrètement.`,
        `Restant à votre disposition pour la suite du processus, je vous adresse mes salutations les meilleures.`,
      ],
    });
  }
  return JSON.stringify({
    subject: `Candidature au poste de ${role}`,
    paragraphs: [
      `Madame, Monsieur,`,
      `Vivement intéressé(e) par le poste de ${role} au sein de ${company}, je vous soumets ma candidature. Mon parcours m'a permis de développer des compétences directement utiles à cette fonction, que je serais ravi(e) de mettre à votre service.`,
      `Au fil de mes expériences, j'ai appris à allier rigueur, sens du collectif et orientation résultat. J'ai notamment su prendre des responsabilités concrètes et m'adapter rapidement à de nouveaux environnements — des atouts qui correspondent, je crois, à vos attentes.`,
      `Rejoindre ${company} représenterait pour moi une réelle opportunité de m'investir durablement et de contribuer à vos objectifs. Je serais heureux(se) de vous en dire plus lors d'un entretien.`,
      `Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
    ],
  });
}

// ── Test de recrutement ───────────────────────────────────────────────────────
const RT_BANK = {
  logique: [
    { question: 'Quelle est la suite logique : 2, 4, 8, 16, … ?', options: [['32', true], ['24', false], ['20', false], ['18', false]], explanation: 'Chaque terme est le double du précédent : 16 × 2 = 32.' },
    { question: 'Si tous les A sont des B, et que certains B sont des C, alors :', options: [['Certains A peuvent être des C', true], ['Tous les A sont des C', false], ['Aucun A n\'est un C', false], ['Tous les C sont des A', false]], explanation: 'On ne peut affirmer qu\'une possibilité : rien ne garantit que les A concernés soient des C.' },
    { question: 'Intrus : Lundi, Mardi, Juillet, Jeudi ?', options: [['Juillet', true], ['Lundi', false], ['Mardi', false], ['Jeudi', false]], explanation: 'Juillet est un mois ; les autres sont des jours de la semaine.' },
  ],
  numerique: [
    { question: 'Un article à 80 € subit une remise de 25 %. Quel est son prix ?', options: [['60 €', true], ['55 €', false], ['65 €', false], ['75 €', false]], explanation: '25 % de 80 = 20 €, donc 80 − 20 = 60 €.' },
    { question: 'Une équipe traite 120 dossiers en 4 jours. Combien en 7 jours au même rythme ?', options: [['210', true], ['180', false], ['240', false], ['200', false]], explanation: '120 / 4 = 30 par jour, donc 30 × 7 = 210.' },
    { question: 'Quel nombre représente 0,2 sous forme de fraction ?', options: [['1/5', true], ['1/2', false], ['2/5', false], ['1/4', false]], explanation: '0,2 = 2/10 = 1/5.' },
  ],
  verbal: [
    { question: 'Quel mot est le synonyme de « rigoureux » ?', options: [['Méthodique', true], ['Approximatif', false], ['Hésitant', false], ['Désinvolte', false]], explanation: '« Méthodique » exprime la rigueur ; les autres en sont l\'opposé.' },
    { question: 'Quelle phrase est correctement orthographiée ?', options: [['Je vous joins le document.', true], ['Je vous joint le document.', false], ['Je vous joinds le document.', false], ['Je vous joing le document.', false]], explanation: 'À la 1re personne : « je joins » (verbe joindre).' },
    { question: 'Le contraire de « concis » est :', options: [['Verbeux', true], ['Bref', false], ['Clair', false], ['Précis', false]], explanation: '« Verbeux » signifie trop long ; « concis » signifie bref et dense.' },
  ],
  metier: [
    { question: 'Face à une demande client dont vous ignorez la réponse, la meilleure attitude est :', options: [['Reconnaître ne pas savoir et proposer de vérifier puis recontacter', true], ['Inventer une réponse pour ne pas paraître incompétent', false], ['Renvoyer le client sans solution', false], ['Ignorer la question', false]], explanation: 'L\'honnêteté et le suivi rassurent le client et préservent la crédibilité.' },
    { question: 'Quel indicateur suit-on en priorité pour mesurer la satisfaction client ?', options: [['Le taux de satisfaction (NPS / CSAT)', true], ['Le nombre d\'emails envoyés', false], ['La taille de l\'équipe', false], ['Le nombre de réunions', false]], explanation: 'Le NPS/CSAT mesure directement la perception du client.' },
    { question: 'Avant d\'envoyer un livrable important, le réflexe professionnel est de :', options: [['Le relire et vérifier qu\'il répond bien à la demande', true], ['L\'envoyer au plus vite sans relecture', false], ['Attendre qu\'on vous le redemande', false], ['Le transmettre sans contexte', false]], explanation: 'La relecture évite les erreurs et montre votre fiabilité.' },
  ],
  situation: [
    { question: 'Deux tâches urgentes tombent en même temps. Vous :', options: [['Priorisez selon l\'impact et prévenez les parties prenantes', true], ['Traitez au hasard', false], ['Attendez que quelqu\'un décide pour vous', false], ['Abandonnez la plus difficile', false]], explanation: 'Prioriser par l\'impact et communiquer est la réaction la plus professionnelle.' },
    { question: 'Un collègue ne respecte pas un engagement qui vous bloque. Vous :', options: [['Lui en parlez directement et calmement pour trouver une solution', true], ['Le critiquez devant l\'équipe', false], ['Ne dites rien et accumulez le retard', false], ['Alertez aussitôt la direction sans lui parler', false]], explanation: 'Le dialogue direct et factuel règle la plupart des blocages sans tension inutile.' },
    { question: 'Vous recevez un feedback négatif sur votre travail. La bonne réaction :', options: [['Écouter, remercier et identifier comment vous améliorer', true], ['Vous justifier longuement', false], ['Le prendre personnellement', false], ['L\'ignorer', false]], explanation: 'Accueillir le feedback avec ouverture est un marqueur de professionnalisme.' },
  ],
};

function demoRecruitTest(metadata, u) {
  const all = ['logique', 'numerique', 'verbal', 'metier', 'situation'];
  const wanted = (metadata?.categories ? String(metadata.categories).split(',').filter(Boolean) : all)
    .filter((c) => all.includes(c));
  const cats = wanted.length ? wanted : all;
  const count = Math.max(1, Math.min(15, metadata?.count || 10));
  const role = targetOf(u).role;

  const out = [];
  let i = 0;
  while (out.length < count) {
    const cat = cats[i % cats.length];
    const bank = RT_BANK[cat];
    const q = bank[Math.floor(i / cats.length) % bank.length];
    let question = q.question;
    if ((cat === 'metier' || cat === 'situation') && role && role !== 'le poste proposé') {
      question = `Dans le cadre du poste de ${role} : ${question.charAt(0).toLowerCase()}${question.slice(1)}`;
    }
    out.push({
      category: cat,
      difficulty: cat === 'logique' || cat === 'numerique' ? 2 : 1,
      question,
      options: q.options.map(([text, correct]) => ({ text, correct })),
      explanation: q.explanation,
    });
    i++;
    if (i > 200) break;
  }
  return out;
}

// ── Entretien oral : génération de questions ──────────────────────────────────
const ORAL_BANK = [
  { category: 'presentation', question: 'Pouvez-vous vous présenter en deux minutes ?', hint: 'Le recruteur évalue votre clarté et votre capacité à aller à l\'essentiel.' },
  { category: 'motivation', question: 'Pourquoi avez-vous postulé à ce poste précisément ?', hint: 'Montrez que votre motivation est réfléchie et reliée à l\'entreprise.' },
  { category: 'parcours', question: 'Décrivez une réalisation dont vous êtes fier, avec la méthode STAR.', hint: 'Situation, Tâche, Action, Résultat : structurez votre réponse.' },
  { category: 'faiblesses', question: 'Quelle est votre principale qualité, et un défaut sur lequel vous travaillez ?', hint: 'Restez honnête et montrez votre capacité à progresser.' },
  { category: 'entreprise', question: 'Que savez-vous de notre entreprise et de nos activités ?', hint: 'Le recruteur vérifie que vous vous êtes renseigné.' },
  { category: 'posture', question: 'Comment réagissez-vous face à une critique de votre travail ?', hint: 'Valorisez l\'écoute et l\'amélioration continue.' },
  { category: 'cloture', question: 'Avez-vous des questions à nous poser ?', hint: 'Préparez 1 à 2 questions pertinentes : c\'est un signe d\'intérêt.' },
];

function demoOralQuestions(metadata, u) {
  const count = Math.max(1, Math.min(7, metadata?.count || 5));
  // garde la présentation en 1re, puis varie
  const rest = pick(ORAL_BANK.filter((q) => q.category !== 'presentation'), count - 1);
  return [ORAL_BANK[0], ...rest].slice(0, count);
}

// ── Entretien oral : évaluation d'une réponse ────────────────────────────────
function demoOralEval(metadata, u) {
  const transcript = (u.split(/transcription\)\s*:/i)[1] || u).trim();
  const words = (transcript.match(/[\p{L}\p{N}'’-]+/gu) || []).length;

  if (words < 8) {
    return {
      score: 2,
      verdict: 'Réponse trop courte pour convaincre.',
      strengths: ['Tu t\'es lancé(e), c\'est déjà un premier pas.'],
      improvements: ['Développe en 4-5 phrases minimum.', 'Donne un exemple concret pour appuyer ton propos.'],
      model: 'Je commencerais par poser le contexte, puis je donnerais un exemple précis de ce que j\'ai accompli, avec un résultat mesurable, avant de conclure sur ce que cela m\'a appris.',
    };
  }
  if (words < 35) {
    return {
      score: 6,
      verdict: 'Réponse correcte mais à étoffer.',
      strengths: ['Propos clair et compréhensible.', 'Tu réponds bien à la question posée.'],
      improvements: ['Ajoute un exemple concret et chiffré.', 'Structure davantage (situation → action → résultat).'],
      model: 'Par exemple : « Lors de mon dernier stage, j\'ai pris en charge X, ce qui a permis d\'obtenir Y en Z semaines. J\'en retiens surtout… ».',
    };
  }
  return {
    score: 8,
    verdict: 'Bonne réponse, structurée et convaincante.',
    strengths: ['Réponse structurée et fluide.', 'Tu illustres avec un exemple concret.', 'Bonne énergie et clarté.'],
    improvements: ['Conclus par ce que l\'expérience t\'a appris pour renforcer l\'impact.'],
    model: 'Tu peux finir par une phrase de synthèse : « Cette expérience m\'a confirmé l\'intérêt pour ce métier et m\'a appris à… ».',
  };
}

// ── Sessions IA d'entretien (QCM) ─────────────────────────────────────────────
function demoAiInterview(metadata, u) {
  const count = Math.max(1, Math.min(8, metadata?.count || 8));
  const bank = [
    { category: 'presentation', difficulty: 1, situation: 'Le recruteur ouvre l\'entretien : « Présentez-vous brièvement. »', question: 'Quelle est la meilleure entrée en matière ?', options: [['Un résumé clair : qui je suis, mon parcours, ce que je cherche', true], ['Toute ma vie depuis le lycée en détail', false], ['« Tout est sur mon CV »', false], ['Une liste de mes loisirs', false]], explanation: 'Une présentation synthétique et orientée poste donne le ton.', tip: 'Prépare un pitch de 60-90 secondes.' },
    { category: 'motivation', difficulty: 2, situation: '« Pourquoi notre entreprise ? »', question: 'Quelle réponse est la plus forte ?', options: [['Relier ses valeurs/projets à un besoin réel de l\'entreprise', true], ['« Parce que vous recrutez »', false], ['« Pour le salaire »', false], ['« Je postule partout »', false]], explanation: 'Une motivation reliée à l\'entreprise montre un intérêt sincère et préparé.', tip: 'Cite un projet précis de l\'entreprise.' },
    { category: 'faiblesses', difficulty: 2, situation: '« Quel est votre principal défaut ? »', question: 'La meilleure approche :', options: [['Un vrai défaut + ce que tu fais pour progresser', true], ['« Je suis perfectionniste » sans plus', false], ['« Je n\'ai pas de défaut »', false], ['Un défaut rédhibitoire pour le poste', false]], explanation: 'Montrer de la lucidité et une démarche de progrès rassure.', tip: 'Choisis un défaut non bloquant pour le poste.' },
    { category: 'parcours', difficulty: 2, situation: '« Parlez-moi d\'un échec. »', question: 'Quelle structure adopter ?', options: [['Décrire l\'échec, ce que j\'ai appris et changé', true], ['Nier avoir déjà échoué', false], ['Blâmer les autres', false], ['Minimiser sans rien en tirer', false]], explanation: 'Assumer et tirer une leçon démontre de la maturité.', tip: 'Termine toujours sur l\'apprentissage.' },
  ];
  const out = [];
  let i = 0;
  while (out.length < count) {
    const b = bank[i % bank.length];
    out.push({ ...b, options: b.options.map(([text, correct]) => ({ text, correct })) });
    i++;
    if (i > 50) break;
  }
  return out;
}

// ── Optimisation CV pour une offre ────────────────────────────────────────────
function demoCvOptimize(u) {
  let cv = {};
  try {
    const o = u.indexOf('{', u.indexOf('CV ACTUEL'));
    if (o >= 0) cv = JSON.parse(u.slice(o, u.lastIndexOf('}') + 1));
  } catch { cv = {}; }

  const missing = (grab(u, /MOTS-CLÉS MANQUANTS[^:]*:\s*([^\n]+)/i) || '')
    .split(/[,;]/).map((s) => s.trim()).filter((s) => s && !/aucun/i.test(s)).slice(0, 4);

  const experiences = (cv.experiences || []).map((e) => ({
    missions: (e.missions && e.missions.length ? e.missions : ['Contribué aux missions du poste'])
      .map((m) => {
        const t = String(m).trim();
        return /^[A-ZÀ-Ü]/.test(t) ? t : `Réalisé : ${t}`;
      }),
  }));

  return {
    accroche: `Profil motivé et orienté résultat, je mets mes compétences au service de vos objectifs${missing.length ? `, notamment autour de ${missing.slice(0, 2).join(' et ')}` : ''}. Rigoureux et adaptable, je m'investis durablement dans mes missions.`,
    experiences,
    competencesAjoutees: missing,
  };
}
