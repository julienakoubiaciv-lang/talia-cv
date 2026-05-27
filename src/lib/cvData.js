//â”€â”€â”€ FORMATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const FORMATIONS = [
  { v:'niv-bac-secretaire-assistante', l:'Niveau Bac : TP â€“ SecrÃ©taire Assistante',             n:'tp',       f:'Ressources Humaines',     d:'16 mois' },
  { v:'tp-assistante-direction',       l:'Bac+2 : TP â€“ Assistante de Direction',                 n:'tp',       f:'Ressources Humaines',     d:'16 mois' },
  { v:'tp-assistante-rh',              l:'Bac+2 : TP â€“ Assistante RH',                           n:'tp',       f:'Ressources Humaines',     d:'16 mois' },
  { v:'tp-manager-um',                 l:'Bac+2 : TP â€“ Manager des UnitÃ©s Marchandes',           n:'tp',       f:'Commerce / Vente',        d:'16 mois' },
  { v:'tp-ntc',                        l:'Bac+2 : TP â€“ NÃ©gociateur Technico-Commercial',         n:'tp',       f:'Commerce / Vente',        d:'16 mois' },
  { v:'bachelor-marketing',            l:'Bachelor â€“ ChargÃ© Marketing et Communication',         n:'bachelor', f:'Marketing & Communication', d:'12 mois' },
  { v:'bachelor-commerce',             l:'Bachelor â€“ Commerce France et International',           n:'bachelor', f:'Commerce / Vente',        d:'12 mois' },
  { v:'bachelor-responsable-etablissement', l:"Bachelor â€“ Responsable d'Ã‰tablissement Marchand", n:'bachelor', f:'Commerce / Vente',        d:'12 mois' },
  { v:'mastere-manager-rh',            l:'MastÃ¨re : Manager des Ressources Humaines',            n:'mastere',  f:'Ressources Humaines',     d:'24 mois' },
  { v:'mastere-manager-rh-marketing',  l:'MastÃ¨re : Manager RH / Marketing et Communication',   n:'mastere',  f:'Ressources Humaines',     d:'24 mois' },
  { v:'mastere-manager-performance-financiere', l:'MastÃ¨re : Manager de la Performance FinanciÃ¨re', n:'mastere', f:'Finance & Gestion',   d:'24 mois' },
];

// â”€â”€â”€ DATES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const DATES = {
  tp:       ['Janvier','Avril','Juin','Septembre','Novembre'],
  bachelor: ['Janvier','Avril','Septembre'],
  mastere:  ['Janvier','Avril','Septembre'],
};

// â”€â”€â”€ POSTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const POSTES = {
  'niv-bac-secretaire-assistante': ["Assistante administrative","SecrÃ©taire","HÃ´tesse d'accueil","Agent administratif"],
  'tp-assistante-direction':       ["Assistante administrative","Assistante de direction","SecrÃ©taire de direction","Office manager"],
  'tp-assistante-rh':              ["Assistante RH","ChargÃ© de recrutement junior","Gestionnaire administrative RH"],
  'tp-manager-um':                 ["Conseiller de vente","Equipier polyvalent","Conseiller commercial","Assistant manager"],
  'tp-ntc':                        ["Conseiller commercial","Equipier polyvalent","Technico-commercial junior","ChargÃ© de clientÃ¨le"],
  'bachelor-marketing':            ["Community Manager","Assistant Marketing et Communication","ChargÃ© de communication digitale","Social media manager"],
  'bachelor-commerce':             ["ChargÃ© de dÃ©veloppement commercial","Business developer","AttachÃ© commercial"],
  'bachelor-responsable-etablissement': ["Responsable de rayon","Adjoint responsable de magasin","Manager terrain"],
  'mastere-manager-rh':            ["Responsable RH","ChargÃ© de dÃ©veloppement RH","Responsable recrutement","HR Business Partner"],
  'mastere-manager-rh-marketing':  ["Responsable RH","Responsable marketing & communication","HR Business Partner"],
  'mastere-manager-performance-financiere': ["ContrÃ´leur de gestion junior","ChargÃ© de reporting financier","Analyste financier junior"],
};

// â”€â”€â”€ COMPÃ‰TENCES TECHNIQUES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const COMP_TECH = {
  // Administratif â€” large spectre
  'niv-bac-secretaire-assistante': [
    'Accueil physique et tÃ©lÃ©phonique','Gestion du courrier entrant/sortant',
    'Saisie et archivage de documents','RÃ©daction de courriers et emails professionnels',
    'Bureautique (Word, Excel, PowerPoint)','Gestion des agendas et plannings',
    'Organisation des dÃ©placements','Classement et numÃ©risation',
    'Facturation et suivi des bons de commande','Gestion des fournitures de bureau',
  ],
  'tp-assistante-direction': [
    'Gestion agenda et planning complexe','RÃ©daction de notes, comptes-rendus et rapports',
    'Accueil et orientation des visiteurs et appels','Coordination administrative multi-services',
    'Bureautique avancÃ©e (Suite Office, Google Workspace)','Organisation de rÃ©unions et sÃ©minaires',
    'Gestion des dÃ©placements et notes de frais','PrÃ©paration de dossiers et prÃ©sentations',
    'Suivi des contrats et commandes fournisseurs','Communication interne et externe',
  ],
  'tp-assistante-rh': [
    'Administration du personnel (DPAE, contrats, avenants)','Gestion et suivi des contrats de travail',
    'Recrutement et sourcing (LinkedIn, jobboards)','Gestion de la paie et des charges sociales',
    'Tableaux de bord et reporting RH','Gestion des absences, congÃ©s et plannings',
    'Onboarding et suivi de l\'intÃ©gration','Relations avec les organismes sociaux (URSSAF, CPAM)',
    'Gestion du plan de dÃ©veloppement des compÃ©tences','Suivi disciplinaire et ruptures conventionnelles',
  ],
  // Commerce / Vente â€” large spectre (GD, prÃªt-Ã -porter, services, B2Bâ€¦)
  'tp-manager-um': [
    'Vente conseil en face-Ã -face','Accueil et fidÃ©lisation de la clientÃ¨le',
    'Gestion de caisse (rendu monnaie, TPE, clÃ´ture)','Mise en rayon et facing produits',
    'Merchandising et mise en valeur des vitrines','Gestion des stocks et inventaires tournants',
    'RÃ©ception et contrÃ´le des marchandises','Ã‰tiquetage et mise Ã  jour des prix',
    'Encaissement et gestion des retours/Ã©changes','Animation promotionnelle et PLV',
    'Suivi des indicateurs (CA, taux de transformation, panier moyen)','Gestion des rÃ©clamations et SAV',
  ],
  'tp-ntc': [
    'Prospection B2B et prise de rendez-vous','NÃ©gociation commerciale et closing',
    'Suivi CRM (Salesforce, HubSpot, Zoho)','RÃ©alisation de devis et offres commerciales',
    'Argumentation produits/services','Relance et suivi du pipeline commercial',
    'Gestion et dÃ©veloppement d\'un portefeuille clients','Analyse de marchÃ© et veille concurrentielle',
    'Reporting commercial et suivi des objectifs','PrÃ©sentation produits en rendez-vous client',
    'Gestion des rÃ©clamations et fidÃ©lisation','RÃ©alisation de dÃ©mos et prÃ©sentations',
  ],
  'bachelor-marketing': [
    'Gestion des rÃ©seaux sociaux (Meta, LinkedIn, TikTok)','CrÃ©ation de contenus visuels et vidÃ©o',
    'StratÃ©gie de communication digitale','SEO / SEA (Google Ads, Search Console)',
    'Email marketing et automation (Mailchimp, Brevo)','Analytics (GA4, Meta Insights)',
    'Community management','CrÃ©ation graphique (Canva, Adobe Suite)',
    'Gestion de campagnes publicitaires payantes','Content marketing et storytelling',
    'Veille concurrentielle et benchmark','Briefs crÃ©atifs et coordination avec les agences',
  ],
  'bachelor-commerce': [
    'Ã‰laboration et pilotage d\'une stratÃ©gie commerciale','Commerce international (Import/Export, Incoterms)',
    'Marketing opÃ©rationnel (promotions, Ã©vÃ©nements, trade)','Gestion grands comptes et Key Account Management',
    'CRM et outils de vente (Salesforce, Pipedrive)','Business development et conquÃªte de nouveaux marchÃ©s',
    'Analyse des ventes et reporting','NÃ©gociation et rÃ©daction de contrats commerciaux',
    'E-commerce et marketplaces','Gestion de la relation distributeur',
    'Analyse de la rentabilitÃ© et des marges',
  ],
  'bachelor-responsable-etablissement': [
    'Management et animation d\'Ã©quipe en surface de vente','Gestion des stocks et approvisionnement',
    'Pilotage des KPIs (CA, marge, panier moyen, taux de conversion)','Animation commerciale et Ã©vÃ©nements en magasin',
    'Recrutement, intÃ©gration et formation des vendeurs','Ã‰laboration des plannings et gestion des temps',
    'Visual merchandising et agencement','Suivi des litiges, rÃ©clamations et SAV',
    'Analyse des performances et reporting Ã  la direction','Gestion caisse et contrÃ´le des remises accordÃ©es',
    'Relations avec les fournisseurs et centrale d\'achats',
  ],
  // RH / Marketing avancÃ©
  'mastere-manager-rh': [
    'GPEC et gestion prÃ©visionnelle des emplois','Droit du travail et droit social',
    'Gestion des talents et succession planning','Conduite du changement organisationnel',
    'Pilotage de la stratÃ©gie RH','Dialogue social et relations avec les IRP',
    'Marque employeur et attractivitÃ© des talents','People analytics et SIRH',
  ],
  'mastere-manager-rh-marketing': [
    'GPEC et gestion prÃ©visionnelle des emplois','StratÃ©gie de communication et marketing RH',
    'Management de projets transversaux','Content marketing et personal branding',
    'Pilotage de la marque employeur','Outils SIRH et CRM',
  ],
  'mastere-manager-performance-financiere': [
    'ContrÃ´le de gestion et tableau de bord','Reporting financier et consolidation',
    'Analyse des Ã©carts budget/rÃ©el','Excel avancÃ© (tableaux croisÃ©s, VBA)',
    'Power BI et data visualisation','ComptabilitÃ© analytique',
    'Cash-flow et gestion de trÃ©sorerie','Audit interne et conformitÃ©',
  ],
};

// â”€â”€â”€ COMPÃ‰TENCES SOFT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const COMP_SOFT = {
  'niv-bac-secretaire-assistante': [
    'Rigueur et prÃ©cision','DiscrÃ©tion et confidentialitÃ©',
    'Sens du service et de l\'accueil','PonctualitÃ© et fiabilitÃ©',
    'Esprit d\'Ã©quipe','AdaptabilitÃ©','Polyvalence','Gestion du stress',
  ],
  'tp-assistante-direction': [
    'Rigueur et sens de l\'organisation','DiscrÃ©tion et gestion des prioritÃ©s',
    'ProactivitÃ© et anticipation','Sens du service','Diplomatie et tact',
    'FlexibilitÃ©','Gestion du stress','Esprit de synthÃ¨se',
  ],
  'tp-assistante-rh': [
    'Ã‰coute active et empathie','Rigueur et confidentialitÃ©',
    'Sens du relationnel','PÃ©dagogie et clartÃ©','NeutralitÃ© et impartialitÃ©',
    'Organisation','CapacitÃ© d\'adaptation','Sens des responsabilitÃ©s',
  ],
  'tp-manager-um': [
    'Sens du contact et de l\'accueil','Enthousiasme et dynamisme',
    'Ã‰coute client','RÃ©activitÃ©','Esprit d\'Ã©quipe','Sourire et prÃ©sentation soignÃ©e',
    'Sens du service','Polyvalence','RÃ©sistance au stress et aux pics d\'activitÃ©',
    'Orientation rÃ©sultats','Esprit d\'initiative',
  ],
  'tp-ntc': [
    'PersÃ©vÃ©rance et tÃ©nacitÃ©','Sens de la nÃ©gociation','Ã‰coute active',
    'RÃ©silience face aux refus','Autonomie','GoÃ»t du challenge',
    'AssertivitÃ©','Organisation et rigueur','Excellent relationnel',
    'CuriositÃ© et veille permanente','Sens des prioritÃ©s',
  ],
  'bachelor-marketing': [
    'CrÃ©ativitÃ© et sens esthÃ©tique','CuriositÃ© digitale','Force de proposition',
    'Rigueur et respect des deadlines','Esprit d\'analyse','CapacitÃ© Ã  travailler en Ã©quipe',
    'RÃ©activitÃ© aux tendances','Autonomie','Sens de la communication',
  ],
  'bachelor-commerce': [
    'Leadership et influence','Orientation rÃ©sultats','AdaptabilitÃ©',
    'Esprit d\'initiative','Rigueur','Vision stratÃ©gique',
    'CapacitÃ© Ã  convaincre et nÃ©gocier','Gestion du stress',
    'Sens de la communication','Analyse et prise de dÃ©cision',
  ],
  'bachelor-responsable-etablissement': [
    'Leadership bienveillant','Prise de dÃ©cision','Gestion du stress',
    'Sens des responsabilitÃ©s','Ã‰coute et management collaboratif',
    'ExemplaritÃ©','RÃ©activitÃ©','Organisation','CapacitÃ© fÃ©dÃ©ratrice',
    'Orientation rÃ©sultats',
  ],
  'mastere-manager-rh': [
    'Leadership','Diplomatie et intelligence Ã©motionnelle',
    'Vision stratÃ©gique','PÃ©dagogie','Gestion des conflits',
    'Sens de l\'Ã©quitÃ©','ConfidentialitÃ©','Influence',
  ],
  'mastere-manager-rh-marketing': [
    'Leadership crÃ©atif','Vision stratÃ©gique','AdaptabilitÃ©',
    'Sens de la communication','CapacitÃ© Ã  mobiliser les Ã©quipes',
  ],
  'mastere-manager-performance-financiere': [
    'Rigueur analytique','Esprit de synthÃ¨se','Sens critique',
    'Autonomie','ProactivitÃ©','FiabilitÃ©','PrÃ©cision',
  ],
};

// â”€â”€â”€ PALETTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const PALETTES = [
  // Bleus
  { id:'navy',      l:'Navy',         c:'#1a3a5c', d:'#0e2a44', lt:'#eef3f8', b:'#c3d5e8', t:'#1a3a5c', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'bleuroi',   l:'Bleu roi',     c:'#1a3a8c', d:'#0f2466', lt:'#eef1fc', b:'#bfcbf0', t:'#1a3a8c', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'midnight',  l:'Midnight',     c:'#18243c', d:'#0d1524', lt:'#eaecf1', b:'#b8bfcf', t:'#18243c', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'bleumoy',   l:'Bleu moyen',   c:'#1e88e5', d:'#1565c0', lt:'#eef6ff', b:'#b8d8f8', t:'#1040a0', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Neutres
  { id:'noir',      l:'Noir',         c:'#111111', d:'#000000', lt:'#f0f0f0', b:'#cccccc', t:'#111111', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'gris80',    l:'Gris foncÃ©',   c:'#444444', d:'#2a2a2a', lt:'#f2f2f2', b:'#cccccc', t:'#333333', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'sauge',     l:'Sauge',        c:'#485547', d:'#303d31', lt:'#f0f3f0', b:'#c2cdc2', t:'#485547', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Verts
  { id:'vertfonce', l:'Vert foncÃ©',   c:'#2e7d32', d:'#1b5e20', lt:'#f0faf0', b:'#b0d8b0', t:'#1b5e20', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'vert',      l:'Vert',         c:'#43a047', d:'#2e7d32', lt:'#f2faf2', b:'#b8dcb8', t:'#1b5e20', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Rouges / violets
  { id:'rouge',     l:'Rouge',        c:'#e02020', d:'#b01010', lt:'#fff0f0', b:'#f8bcbc', t:'#a00000', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'violet',    l:'Violet',       c:'#7b1fa2', d:'#560e7a', lt:'#f8f0fc', b:'#dcb0f0', t:'#5a0080', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'rosevif',   l:'Rose vif',     c:'#e91e8c', d:'#c0166e', lt:'#fef0f7', b:'#f4b0d9', t:'#a00060', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Oranges
  { id:'orange',    l:'Orange',       c:'#fb8c00', d:'#e65100', lt:'#fff8f0', b:'#fdd0a0', t:'#8c3a00', titleColor:'#FFCC00', textColor:'#fff' },
  { id:'peche',     l:'PÃªche',        c:'#c47a3a', d:'#a05e20', lt:'#ffefdb', b:'#f0c898', t:'#8c4e10', titleColor:'#FFCC00', textColor:'#fff' },
  // Cyan
  { id:'cyandark',  l:'Cyan foncÃ©',   c:'#00838f', d:'#006064', lt:'#f0fafc', b:'#a8dde2', t:'#005560', titleColor:'#FFCC00', textColor:'#e8e8e8' },
];

// â”€â”€â”€ HISTORIQUE (localStorage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getHist() {
  try { return JSON.parse(localStorage.getItem('talia_cv_hist')||'[]'); }
  catch { return []; }
}
export function setHist(arr) {
  localStorage.setItem('talia_cv_hist', JSON.stringify(arr));
}
export function updateHist(id, patch) {
  let hist = getHist();
  const idx = hist.findIndex(h => String(h.id) === String(id));
  if (idx < 0) return false;
  hist[idx] = {
    ...hist[idx],
    ...patch,
    date: new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
  };
  setHist(hist);
  return true;
}

export function saveToHist(name, html, data, formation, opts = {}) {
  let hist = getHist();
  const now = Date.now();
  const sameRecent = hist.findIndex(h => h.name===name && (now-h.id)<60000);
  if (sameRecent >= 0) hist.splice(sameRecent, 1);
  hist.unshift({
    id: now,
    name,
    date: new Date().toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),
    html,
    data: data || null,
    thumb: '',
    formation: formation || '',
    bulkId: opts.bulkId || null,
    bulkLabel: opts.bulkLabel || null,
    favorite: false,
  });
  if (hist.length > 50) hist.pop();
  setHist(hist);
  return now;
}

// â”€â”€â”€ VERSIONS PAR CV (snapshots) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Chaque CV (histId) a jusqu'Ã  10 snapshots stockÃ©s dans localStorage.
// On stocke uniquement data (pas le HTML) pour Ã©conomiser de l'espace.
const MAX_VERSIONS = 10;

export function saveVersion(histId, data, label) {
  if (!histId || !data) return;
  const key = `talia_versions_${histId}`;
  let versions = [];
  try { versions = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString('fr-FR', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  });
  // Ã‰viter un doublon si sauvegarde < 30s aprÃ¨s la prÃ©cÃ©dente
  if (versions.length && (now - versions[0].ts) < 30000) {
    versions[0] = { ...versions[0], ts: now, date: dateStr, data };
  } else {
    versions.unshift({ ts: now, date: dateStr, label: label || dateStr, data });
    if (versions.length > MAX_VERSIONS) versions.pop();
  }
  localStorage.setItem(key, JSON.stringify(versions));
}

export function getVersions(histId) {
  if (!histId) return [];
  try { return JSON.parse(localStorage.getItem(`talia_versions_${histId}`) || '[]'); }
  catch { return []; }
}

export function deleteVersions(histId) {
  if (!histId) return;
  localStorage.removeItem(`talia_versions_${histId}`);
}

// Temps relatif pour les labels de version
export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'Ã€ l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h}h`;
  if (d < 7)  return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
  return new Date(ts).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// â”€â”€â”€ Color helper for formation tags (deterministic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FORMATION_PALETTE = [
  { bg:'#EEF2FF', fg:'#1539B7' },
  { bg:'#f5f3ff', fg:'#7c3aed' },
  { bg:'#ecfdf5', fg:'#059669' },
  { bg:'#fffbeb', fg:'#d97706' },
  { bg:'#fdf2f8', fg:'#db2777' },
  { bg:'#ecfeff', fg:'#0891b2' },
  { bg:'#fef2f2', fg:'#dc2626' },
  { bg:'#f0fdfa', fg:'#0d9488' },
];
export function colorForFormation(label) {
  if (!label) return FORMATION_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0;
  return FORMATION_PALETTE[Math.abs(hash) % FORMATION_PALETTE.length];
}

// â”€â”€â”€ BULK SESSION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sauvegarde la session bulk (sans les base64 pour Ã©conomiser l'espace)
export function saveBulkSession(groups) {
  const slim = groups.map(g => ({
    ...g,
    jobs: g.jobs.map(({ file, base64, mediaType, ...rest }) => rest),
  }));
  try { localStorage.setItem('talia_bulk_session', JSON.stringify({ groups: slim, savedAt: Date.now() })); }
  catch (e) { console.warn('Bulk session save failed', e); }
}
export function loadBulkSession() {
  try { const r = localStorage.getItem('talia_bulk_session'); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
export function clearBulkSession() {
  localStorage.removeItem('talia_bulk_session');
}

// â”€â”€â”€ EDITOR STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function saveEditorState(state) {
  try { localStorage.setItem('talia_editor_state', JSON.stringify(state)); } catch {}
}
export function loadEditorState() {
  try { return JSON.parse(localStorage.getItem('talia_editor_state')||'null'); } catch { return null; }
}
