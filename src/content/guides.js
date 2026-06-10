/**
 * guides — Contenu des guides piliers SEO (rendus en pages statiques au build).
 *
 * Chaque guide cible une requête à fort volume et renvoie vers les outils.
 * `html` des sections/FAQ est injecté tel quel (HTML léger autorisé : <a>, <b>, <ul>).
 */
export const GUIDES = [
  {
    slug: 'comment-faire-un-cv',
    eyebrow: 'Guide CV',
    title: 'Comment faire un CV en 2026 : le guide complet (gratuit)',
    description: "Toutes les étapes pour faire un CV qui décroche des entretiens : rubriques essentielles, structure idéale, erreurs à éviter, CV sans expérience et compatibilité ATS. Crée ton CV gratuitement.",
    h1: 'Comment faire un CV qui décroche des entretiens',
    intro: "Un bon CV n'est pas une liste de tout ce que tu as fait : c'est une réponse claire à une question — « pourquoi toi, pour ce poste ». Voici, étape par étape, comment construire un CV efficace, même sans expérience.",
    sections: [
      { h2: 'Les rubriques essentielles', html: `<p>Un CV se compose de quelques blocs incontournables :</p>
        <ul class="clean">
          <li><b>En-tête</b> : prénom, nom, intitulé du poste visé, ville, email et téléphone (pas de date de naissance ni de photo obligatoire).</li>
          <li><b>Accroche</b> : 2-3 lignes qui résument qui tu es et ce que tu apportes.</li>
          <li><b>Expériences</b> : poste, entreprise, dates, et 2-3 missions <b>orientées résultat</b>.</li>
          <li><b>Formation</b> : diplômes et formations utiles au poste.</li>
          <li><b>Compétences</b> : techniques (outils, logiciels) et humaines (soft skills).</li>
          <li><b>Langues &amp; centres d'intérêt</b> (en bonus, s'ils servent ta candidature).</li>
        </ul>` },
      { h2: 'La structure idéale (et la longueur)', html: `<p>Une seule page suffit dans la grande majorité des cas, surtout en début de carrière. Mets en haut ce qui compte le plus pour <b>ce poste précis</b> : si tu vises un métier technique, fais remonter tes compétences ; si tu as une expérience marquante, mets-la en avant.</p>
        <p>Reste lisible : une police simple, des marges aérées, des titres clairs. Un recruteur scanne un CV en quelques secondes — il doit comprendre l'essentiel d'un coup d'œil.</p>` },
      { h2: 'Décrire ses expériences (la méthode qui marche)', html: `<p>Ne te contente pas de décrire des tâches : montre l'<b>impact</b>. Commence chaque mission par un verbe d'action et, quand c'est possible, ajoute un chiffre.</p>
        <ul class="clean">
          <li>❌ « Accueil des clients »</li>
          <li>✅ « Accueilli et conseillé jusqu'à 80 clients/jour, +15 % de ventes additionnelles »</li>
        </ul>` },
      { h2: 'Faire un CV sans expérience', html: `<p>Pas d'expérience pro ? Tu as plus à valoriser que tu ne crois : stages, jobs d'été, projets scolaires, engagement associatif, projets personnels. Mets en avant les <b>compétences</b> que ces expériences ont développées (organisation, travail en équipe, autonomie) et ta <b>motivation</b>. Une accroche soignée et un CV propre compensent largement le manque d'années.</p>` },
      { h2: 'Adapter son CV à l\'offre (et passer les filtres ATS)', html: `<p>De nombreuses entreprises trient les CV avec un logiciel (ATS) avant qu'un humain les lise. Pour passer ce filtre : reprends les <b>mots-clés de l'annonce</b> (intitulé, compétences attendues), garde une mise en page simple (pas d'images ni de colonnes exotiques), et nomme clairement tes rubriques.</p>
        <p>Astuce : avec Altio CV, tu peux <a href="/analyse">analyser ton CV face à une offre</a> pour voir les mots-clés manquants et ta compatibilité ATS.</p>` },
      { h2: 'Les erreurs à éviter', html: `<ul class="clean warn">
          <li>Les fautes d'orthographe (relis, fais relire).</li>
          <li>Un CV générique envoyé partout sans adaptation.</li>
          <li>Trop d'informations : va à l'essentiel.</li>
          <li>Une adresse email peu sérieuse.</li>
          <li>Mentir : ça finit toujours par se voir en entretien.</li>
        </ul>` },
    ],
    faq: [
      { q: 'Faut-il mettre une photo sur son CV ?', a: 'Ce n\'est pas obligatoire en France et c\'est même déconseillé pour limiter les biais. Mets-en une seulement si elle est professionnelle et adaptée au secteur.' },
      { q: 'Quelle longueur pour un CV ?', a: 'Une page en début de carrière. Deux pages maximum si tu as plusieurs années d\'expérience pertinente.' },
      { q: 'Comment faire un CV quand on n\'a aucune expérience ?', a: 'Valorise tes stages, jobs, projets scolaires et associatifs, et surtout les compétences qu\'ils ont développées. Une accroche claire et une bonne présentation font la différence.' },
    ],
    cta: { title: 'Crée ton CV en quelques minutes', text: 'Choisis un modèle, l\'app te guide rubrique par rubrique — gratuitement.', links: [{ label: 'Créer mon CV', href: '/generate', primary: true }, { label: 'Analyser mon CV face à une offre', href: '/analyse' }] },
  },

  {
    slug: 'reussir-son-entretien',
    eyebrow: 'Guide entretien',
    title: "Réussir son entretien d'embauche : préparation, questions et réponses",
    description: "Comment préparer ton entretien d'embauche : se présenter, répondre aux questions fréquentes et aux questions pièges, quoi demander, et la relance après. Entraîne-toi gratuitement.",
    h1: "Réussir son entretien d'embauche",
    intro: "Un entretien se gagne avant tout dans la préparation. Voici comment arriver confiant, répondre aux questions clés et faire bonne impression — du premier bonjour à la relance.",
    sections: [
      { h2: 'Avant l\'entretien : la préparation', html: `<p>Renseigne-toi sur l'entreprise (activité, actualités, valeurs) et relis l'offre. Prépare 2-3 <b>exemples concrets</b> de réussites que tu pourras ressortir. Anticipe les questions classiques et entraîne-toi à voix haute — c'est ce qui fait la différence le jour J.</p>` },
      { h2: 'Se présenter en 2 minutes', html: `<p>La question « parlez-moi de vous » ouvre presque tous les entretiens. Structure ta réponse : qui tu es, ton parcours en quelques étapes, et ce que tu cherches (relié au poste). Reste synthétique et finis sur ta motivation pour <b>ce</b> poste.</p>` },
      { h2: 'Les questions fréquentes (et comment y répondre)', html: `<ul class="clean">
          <li><b>« Pourquoi ce poste / cette entreprise ? »</b> → relie tes valeurs et tes envies à un besoin réel de l'entreprise.</li>
          <li><b>« Vos qualités / défauts ? »</b> → un vrai défaut + ce que tu fais pour progresser.</li>
          <li><b>« Parlez-moi d'une réussite / d'un échec »</b> → méthode STAR : Situation, Tâche, Action, Résultat.</li>
          <li><b>« Où vous voyez-vous dans 3 ans ? »</b> → montre de l'ambition cohérente avec le poste.</li>
        </ul>` },
      { h2: 'Gérer les questions pièges', html: `<p>Face à une question déstabilisante, prends une seconde pour respirer. Reste honnête, ne dénigre jamais un ancien employeur, et transforme une faiblesse en axe de progrès. Mieux vaut un « je ne sais pas encore, mais voici comment je m'y prendrais » qu'un bluff.</p>` },
      { h2: 'Les questions à poser au recruteur', html: `<p>À la fin, on te demandera si tu as des questions — réponds <b>toujours oui</b>. Prépares-en 2-3 : sur le poste, l'équipe, les prochaines étapes. Ça montre ton intérêt et ton sérieux.</p>` },
      { h2: 'Le langage du corps', html: `<p>Une poignée de main franche, un contact visuel, une posture droite et un sourire valent autant que les mots. Parle posément, évite les « euh » à répétition — t'entraîner à l'oral aide énormément à les réduire.</p>` },
      { h2: 'Après l\'entretien : la relance', html: `<p>Un court email de remerciement dans les 24-48 h laisse une bonne impression. Sans réponse au bout d'une à deux semaines, une relance polie est tout à fait légitime. Altio CV peut générer ces messages pour toi.</p>` },
    ],
    faq: [
      { q: 'Comment se présenter en entretien ?', a: 'En 2 minutes : qui tu es, ton parcours en quelques étapes, et ce que tu recherches en lien avec le poste. Termine sur ta motivation pour ce poste précis.' },
      { q: 'Quelles questions poser au recruteur ?', a: 'Sur le poste (missions, attentes), l\'équipe, la culture et les prochaines étapes du recrutement. Évite de commencer par le salaire.' },
      { q: 'Faut-il relancer après un entretien ?', a: 'Oui : un email de remerciement sous 48 h, puis une relance polie après 1 à 2 semaines sans réponse.' },
    ],
    cta: { title: 'Entraîne-toi comme dans un vrai entretien', text: 'Questions personnalisées, feedback immédiat, et même un mode oral — gratuitement.', links: [{ label: 'M\'entraîner à l\'entretien', href: '/entretien', primary: true }, { label: 'Tester l\'oral', href: '/entretien-oral' }] },
  },

  {
    slug: 'lettre-de-motivation',
    eyebrow: 'Guide lettre',
    title: 'Lettre de motivation : structure, exemple et erreurs à éviter',
    description: "Comment écrire une lettre de motivation efficace : la structure en 3 parties, un exemple, le mail de relance et de remerciement, et les erreurs à éviter. Génère ta lettre gratuitement.",
    h1: 'Écrire une lettre de motivation qui donne envie',
    intro: "La lettre de motivation n'est pas un résumé du CV : c'est l'endroit où tu relies ton profil au besoin de l'entreprise. Voici comment la structurer pour qu'elle soit lue jusqu'au bout.",
    sections: [
      { h2: 'À quoi sert vraiment la lettre de motivation', html: `<p>Elle répond à une question simple : <b>pourquoi toi, pour ce poste, dans cette entreprise</b> ? Le CV montre ce que tu as fait ; la lettre montre ta motivation et ta compréhension du besoin. Une bonne lettre est courte, personnalisée et orientée vers l'employeur.</p>` },
      { h2: 'La structure en 3 parties', html: `<ul class="clean">
          <li><b>L'accroche (vous)</b> : parle de l'entreprise et du poste, pas de toi d'abord. Montre que tu as compris leur besoin.</li>
          <li><b>Le corps (moi)</b> : 1-2 atouts concrets reliés à ce besoin, avec une preuve (une réalisation, un résultat).</li>
          <li><b>La conclusion (nous)</b> : projette-toi dans l'entreprise et propose un entretien, avec une formule de politesse adaptée.</li>
        </ul>` },
      { h2: 'Un exemple de trame', html: `<p><i>« Vivement intéressé(e) par le poste de [X] au sein de [entreprise], je… Au cours de [expérience], j'ai [résultat concret], une compétence directement utile à [besoin du poste]. Rejoindre [entreprise] me permettrait de… Je serais ravi(e) de vous en dire plus lors d'un entretien. »</i></p>
        <p>Adapte chaque crochet à l'offre : une lettre générique se repère immédiatement.</p>` },
      { h2: 'Mail de relance et de remerciement', html: `<p>Au-delà de la lettre, deux messages font la différence : le <b>mail de remerciement</b> après un entretien (sous 48 h) et le <b>mail de relance</b> si une candidature reste sans réponse (après 1 à 2 semaines). Courts, polis, et toujours personnalisés.</p>` },
      { h2: 'Les erreurs à éviter', html: `<ul class="clean warn">
          <li>Recopier son CV en paragraphes.</li>
          <li>Commencer par « Je » au lieu de parler de l'entreprise.</li>
          <li>Les formules creuses (« dynamique et motivé »).</li>
          <li>Une lettre identique pour toutes les offres.</li>
          <li>Les fautes : relis-toi systématiquement.</li>
        </ul>` },
    ],
    faq: [
      { q: 'Quelle longueur pour une lettre de motivation ?', a: 'Une demi-page à une page maximum. Mieux vaut court et percutant que long et générique.' },
      { q: 'Comment commencer une lettre de motivation ?', a: 'Par l\'entreprise et le poste, pas par toi : montre d\'abord que tu as compris leur besoin, puis explique ce que tu apportes.' },
      { q: 'Faut-il une lettre différente pour chaque offre ?', a: 'Oui. La personnalisation est ce qui fait la différence — au minimum l\'accroche et les atouts mis en avant.' },
    ],
    cta: { title: 'Génère ta lettre en quelques secondes', text: 'Lettre, mail de relance ou de remerciement, personnalisés à partir de ton CV.', links: [{ label: 'Générer ma lettre', href: '/lettre', primary: true }] },
  },

  {
    slug: 'decrocher-une-alternance',
    eyebrow: 'Guide alternance',
    title: 'Décrocher une alternance : le guide complet (CV, entreprise, entretien)',
    description: "Comment trouver et décrocher une alternance : avantages, trouver une entreprise, CV et lettre adaptés, réussir l'entretien et comprendre le rythme. Prépare-toi gratuitement.",
    h1: 'Décrocher une alternance : le guide complet',
    intro: "L'alternance, c'est le meilleur des deux mondes : un diplôme et de l'expérience, payée. Mais la difficulté n'est pas l'école — c'est de trouver l'entreprise. Voici comment t'y prendre.",
    sections: [
      { h2: 'Pourquoi l\'alternance change la donne', html: `<p>Tu es <b>rémunéré</b>, ta formation est souvent prise en charge, et tu sors avec une vraie expérience (et un réseau). C'est aussi une porte d'entrée vers l'embauche : beaucoup d'alternants sont recrutés à la fin de leur contrat.</p>` },
      { h2: 'Trouver une entreprise', html: `<p>La recherche d'entreprise est un job à part entière. Multiplie les canaux : jobboards spécialisés, candidatures spontanées, salons, LinkedIn, et le réseau de ton école. Vise large, relance, et ne te décourage pas aux premiers refus — c'est un jeu de volume.</p>` },
      { h2: 'Le CV et la lettre pour l\'alternance', html: `<p>En alternance, le recruteur ne cherche pas un expert : il cherche de la <b>motivation</b>, du sérieux et un bon état d'esprit. Mets en avant tes stages, jobs, projets et tes soft skills. Dans la lettre, explique pourquoi ce métier et pourquoi cette entreprise. Découvre les <a href="/guides-metiers">compétences attendues par métier</a> pour bien cibler.</p>` },
      { h2: 'Réussir l\'entretien d\'alternance', html: `<p>On testera surtout ta motivation et ta capacité à apprendre. Montre que tu connais l'entreprise, que tu comprends le métier, et que tu es prêt à t'investir. Prépare des exemples concrets et entraîne-toi à te présenter. Notre <a href="/guide/reussir-son-entretien">guide entretien</a> couvre tout ça.</p>` },
      { h2: 'Comprendre le rythme', html: `<p>L'alternance suit un rythme (par ex. quelques jours en entreprise / quelques jours en cours, ou des semaines alternées). Organise-toi : c'est exigeant, mais c'est cette double casquette qui te rend opérationnel et recherché.</p>` },
    ],
    faq: [
      { q: 'Comment trouver une entreprise en alternance ?', a: 'Multiplie les canaux (jobboards, candidatures spontanées, LinkedIn, réseau de l\'école, salons), candidate en volume et relance. C\'est la partie la plus longue : commence tôt.' },
      { q: 'Que mettre sur un CV d\'alternance sans expérience ?', a: 'Tes stages, jobs, projets scolaires et associatifs, et surtout tes compétences et ta motivation. Le recruteur cherche un bon état d\'esprit avant un expert.' },
      { q: 'Qu\'attend un recruteur en entretien d\'alternance ?', a: 'De la motivation, du sérieux, de la curiosité et une vraie envie d\'apprendre — plus que des compétences déjà maîtrisées.' },
    ],
    cta: { title: 'Prépare ta candidature en alternance', text: 'CV, lettre, entretien : tous les outils pour décrocher ton contrat, gratuitement.', links: [{ label: 'Créer mon CV', href: '/generate', primary: true }, { label: 'Voir les métiers', href: '/guides-metiers' }, { label: 'M\'entraîner à l\'entretien', href: '/entretien' }] },
  },
];
