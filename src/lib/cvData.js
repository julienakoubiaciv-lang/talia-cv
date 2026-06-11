//─── FORMATIONS ─────────────────────────────────────────────────────────────
export const FORMATIONS = [
  { v:'niv-bac-secretaire-assistante', l:'Niveau Bac : TP – Secrétaire Assistante',             n:'tp',       f:'Ressources Humaines',     d:'16 mois' },
  { v:'tp-assistante-direction',       l:'Bac+2 : TP – Assistante de Direction',                 n:'tp',       f:'Ressources Humaines',     d:'16 mois' },
  { v:'tp-assistante-rh',              l:'Bac+2 : TP – Assistante RH',                           n:'tp',       f:'Ressources Humaines',     d:'16 mois' },
  { v:'tp-manager-um',                 l:'Bac+2 : TP – Manager des Unités Marchandes',           n:'tp',       f:'Commerce / Vente',        d:'16 mois' },
  { v:'tp-ntc',                        l:'Bac+2 : TP – Négociateur Technico-Commercial',         n:'tp',       f:'Commerce / Vente',        d:'16 mois' },
  { v:'bachelor-marketing',            l:'Bachelor – Chargé Marketing et Communication',         n:'bachelor', f:'Marketing & Communication', d:'12 mois' },
  { v:'bachelor-commerce',             l:'Bachelor – Commerce France et International',           n:'bachelor', f:'Commerce / Vente',        d:'12 mois' },
  { v:'bachelor-responsable-etablissement', l:"Bachelor – Responsable d'Établissement Marchand", n:'bachelor', f:'Commerce / Vente',        d:'12 mois' },
  { v:'mastere-manager-rh',            l:'Mastère : Manager des Ressources Humaines',            n:'mastere',  f:'Ressources Humaines',     d:'24 mois' },
  { v:'mastere-manager-rh-marketing',  l:'Mastère : Manager RH / Marketing et Communication',   n:'mastere',  f:'Ressources Humaines',     d:'24 mois' },
  { v:'mastere-manager-performance-financiere', l:'Mastère : Manager de la Performance Financière', n:'mastere', f:'Finance & Gestion',   d:'24 mois' },
];

// ─── DATES ──────────────────────────────────────────────────────────────────
export const DATES = {
  tp:       ['Janvier','Avril','Juin','Septembre','Novembre'],
  bachelor: ['Janvier','Avril','Septembre'],
  mastere:  ['Janvier','Avril','Septembre'],
};

// ─── POSTES ─────────────────────────────────────────────────────────────────
export const POSTES = {
  'niv-bac-secretaire-assistante': ["Assistante administrative","Secrétaire","Hôtesse d'accueil","Agent administratif"],
  'tp-assistante-direction':       ["Assistante administrative","Assistante de direction","Secrétaire de direction","Office manager"],
  'tp-assistante-rh':              ["Assistante RH","Chargé de recrutement junior","Gestionnaire administrative RH"],
  'tp-manager-um':                 ["Conseiller de vente","Equipier polyvalent","Conseiller commercial","Assistant manager"],
  'tp-ntc':                        ["Conseiller commercial","Equipier polyvalent","Technico-commercial junior","Chargé de clientèle"],
  'bachelor-marketing':            ["Community Manager","Assistant Marketing et Communication","Chargé de communication digitale","Social media manager"],
  'bachelor-commerce':             ["Chargé de développement commercial","Business developer","Attaché commercial"],
  'bachelor-responsable-etablissement': ["Responsable de rayon","Adjoint responsable de magasin","Manager terrain"],
  'mastere-manager-rh':            ["Responsable RH","Chargé de développement RH","Responsable recrutement","HR Business Partner"],
  'mastere-manager-rh-marketing':  ["Responsable RH","Responsable marketing & communication","HR Business Partner"],
  'mastere-manager-performance-financiere': ["Contrôleur de gestion junior","Chargé de reporting financier","Analyste financier junior"],
};

// ─── COMPÉTENCES TECHNIQUES ─────────────────────────────────────────────────
export const COMP_TECH = {
  // Administratif — large spectre
  'niv-bac-secretaire-assistante': [
    'Accueil physique et téléphonique','Gestion du courrier entrant/sortant',
    'Saisie et archivage de documents','Rédaction de courriers et emails professionnels',
    'Bureautique (Word, Excel, PowerPoint)','Gestion des agendas et plannings',
    'Organisation des déplacements','Classement et numérisation',
    'Facturation et suivi des bons de commande','Gestion des fournitures de bureau',
  ],
  'tp-assistante-direction': [
    'Gestion agenda et planning complexe','Rédaction de notes, comptes-rendus et rapports',
    'Accueil et orientation des visiteurs et appels','Coordination administrative multi-services',
    'Bureautique avancée (Suite Office, Google Workspace)','Organisation de réunions et séminaires',
    'Gestion des déplacements et notes de frais','Préparation de dossiers et présentations',
    'Suivi des contrats et commandes fournisseurs','Communication interne et externe',
  ],
  'tp-assistante-rh': [
    'Administration du personnel (DPAE, contrats, avenants)','Gestion et suivi des contrats de travail',
    'Recrutement et sourcing (LinkedIn, jobboards)','Gestion de la paie et des charges sociales',
    'Tableaux de bord et reporting RH','Gestion des absences, congés et plannings',
    'Onboarding et suivi de l\'intégration','Relations avec les organismes sociaux (URSSAF, CPAM)',
    'Gestion du plan de développement des compétences','Suivi disciplinaire et ruptures conventionnelles',
  ],
  // Commerce / Vente — large spectre (GD, prêt-à-porter, services, B2B…)
  'tp-manager-um': [
    'Vente conseil en face-à-face','Accueil et fidélisation de la clientèle',
    'Gestion de caisse (rendu monnaie, TPE, clôture)','Mise en rayon et facing produits',
    'Merchandising et mise en valeur des vitrines','Gestion des stocks et inventaires tournants',
    'Réception et contrôle des marchandises','Étiquetage et mise à jour des prix',
    'Encaissement et gestion des retours/échanges','Animation promotionnelle et PLV',
    'Suivi des indicateurs (CA, taux de transformation, panier moyen)','Gestion des réclamations et SAV',
  ],
  'tp-ntc': [
    'Prospection B2B et prise de rendez-vous','Négociation commerciale et closing',
    'Suivi CRM (Salesforce, HubSpot, Zoho)','Réalisation de devis et offres commerciales',
    'Argumentation produits/services','Relance et suivi du pipeline commercial',
    'Gestion et développement d\'un portefeuille clients','Analyse de marché et veille concurrentielle',
    'Reporting commercial et suivi des objectifs','Présentation produits en rendez-vous client',
    'Gestion des réclamations et fidélisation','Réalisation de démos et présentations',
  ],
  'bachelor-marketing': [
    'Gestion des réseaux sociaux (Meta, LinkedIn, TikTok)','Création de contenus visuels et vidéo',
    'Stratégie de communication digitale','SEO / SEA (Google Ads, Search Console)',
    'Email marketing et automation (Mailchimp, Brevo)','Analytics (GA4, Meta Insights)',
    'Community management','Création graphique (Canva, Adobe Suite)',
    'Gestion de campagnes publicitaires payantes','Content marketing et storytelling',
    'Veille concurrentielle et benchmark','Briefs créatifs et coordination avec les agences',
  ],
  'bachelor-commerce': [
    'Élaboration et pilotage d\'une stratégie commerciale','Commerce international (Import/Export, Incoterms)',
    'Marketing opérationnel (promotions, événements, trade)','Gestion grands comptes et Key Account Management',
    'CRM et outils de vente (Salesforce, Pipedrive)','Business development et conquête de nouveaux marchés',
    'Analyse des ventes et reporting','Négociation et rédaction de contrats commerciaux',
    'E-commerce et marketplaces','Gestion de la relation distributeur',
    'Analyse de la rentabilité et des marges',
  ],
  'bachelor-responsable-etablissement': [
    'Management et animation d\'équipe en surface de vente','Gestion des stocks et approvisionnement',
    'Pilotage des KPIs (CA, marge, panier moyen, taux de conversion)','Animation commerciale et événements en magasin',
    'Recrutement, intégration et formation des vendeurs','Élaboration des plannings et gestion des temps',
    'Visual merchandising et agencement','Suivi des litiges, réclamations et SAV',
    'Analyse des performances et reporting à la direction','Gestion caisse et contrôle des remises accordées',
    'Relations avec les fournisseurs et centrale d\'achats',
  ],
  // RH / Marketing avancé
  'mastere-manager-rh': [
    'GPEC et gestion prévisionnelle des emplois','Droit du travail et droit social',
    'Gestion des talents et succession planning','Conduite du changement organisationnel',
    'Pilotage de la stratégie RH','Dialogue social et relations avec les IRP',
    'Marque employeur et attractivité des talents','People analytics et SIRH',
  ],
  'mastere-manager-rh-marketing': [
    'GPEC et gestion prévisionnelle des emplois','Stratégie de communication et marketing RH',
    'Management de projets transversaux','Content marketing et personal branding',
    'Pilotage de la marque employeur','Outils SIRH et CRM',
  ],
  'mastere-manager-performance-financiere': [
    'Contrôle de gestion et tableau de bord','Reporting financier et consolidation',
    'Analyse des écarts budget/réel','Excel avancé (tableaux croisés, VBA)',
    'Power BI et data visualisation','Comptabilité analytique',
    'Cash-flow et gestion de trésorerie','Audit interne et conformité',
  ],
};

// ─── COMPÉTENCES SOFT ────────────────────────────────────────────────────────
export const COMP_SOFT = {
  'niv-bac-secretaire-assistante': [
    'Rigueur et précision','Discrétion et confidentialité',
    'Sens du service et de l\'accueil','Ponctualité et fiabilité',
    'Esprit d\'équipe','Adaptabilité','Polyvalence','Gestion du stress',
  ],
  'tp-assistante-direction': [
    'Rigueur et sens de l\'organisation','Discrétion et gestion des priorités',
    'Proactivité et anticipation','Sens du service','Diplomatie et tact',
    'Flexibilité','Gestion du stress','Esprit de synthèse',
  ],
  'tp-assistante-rh': [
    'Écoute active et empathie','Rigueur et confidentialité',
    'Sens du relationnel','Pédagogie et clarté','Neutralité et impartialité',
    'Organisation','Capacité d\'adaptation','Sens des responsabilités',
  ],
  'tp-manager-um': [
    'Sens du contact et de l\'accueil','Enthousiasme et dynamisme',
    'Écoute client','Réactivité','Esprit d\'équipe','Sourire et présentation soignée',
    'Sens du service','Polyvalence','Résistance au stress et aux pics d\'activité',
    'Orientation résultats','Esprit d\'initiative',
  ],
  'tp-ntc': [
    'Persévérance et ténacité','Sens de la négociation','Écoute active',
    'Résilience face aux refus','Autonomie','Goût du challenge',
    'Assertivité','Organisation et rigueur','Excellent relationnel',
    'Curiosité et veille permanente','Sens des priorités',
  ],
  'bachelor-marketing': [
    'Créativité et sens esthétique','Curiosité digitale','Force de proposition',
    'Rigueur et respect des deadlines','Esprit d\'analyse','Capacité à travailler en équipe',
    'Réactivité aux tendances','Autonomie','Sens de la communication',
  ],
  'bachelor-commerce': [
    'Leadership et influence','Orientation résultats','Adaptabilité',
    'Esprit d\'initiative','Rigueur','Vision stratégique',
    'Capacité à convaincre et négocier','Gestion du stress',
    'Sens de la communication','Analyse et prise de décision',
  ],
  'bachelor-responsable-etablissement': [
    'Leadership bienveillant','Prise de décision','Gestion du stress',
    'Sens des responsabilités','Écoute et management collaboratif',
    'Exemplarité','Réactivité','Organisation','Capacité fédératrice',
    'Orientation résultats',
  ],
  'mastere-manager-rh': [
    'Leadership','Diplomatie et intelligence émotionnelle',
    'Vision stratégique','Pédagogie','Gestion des conflits',
    'Sens de l\'équité','Confidentialité','Influence',
  ],
  'mastere-manager-rh-marketing': [
    'Leadership créatif','Vision stratégique','Adaptabilité',
    'Sens de la communication','Capacité à mobiliser les équipes',
  ],
  'mastere-manager-performance-financiere': [
    'Rigueur analytique','Esprit de synthèse','Sens critique',
    'Autonomie','Proactivité','Fiabilité','Précision',
  ],
};

// ─── PALETTES ────────────────────────────────────────────────────────────────
export const PALETTES = [
  // Bleus
  { id:'navy',      l:'Navy',         c:'#1a3a5c', d:'#0e2a44', lt:'#eef3f8', b:'#c3d5e8', t:'#1a3a5c', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'bleuroi',   l:'Bleu roi',     c:'#1a3a8c', d:'#0f2466', lt:'#eef1fc', b:'#bfcbf0', t:'#1a3a8c', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'midnight',  l:'Midnight',     c:'#18243c', d:'#0d1524', lt:'#eaecf1', b:'#b8bfcf', t:'#18243c', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'bleumoy',   l:'Bleu moyen',   c:'#1e88e5', d:'#1565c0', lt:'#eef6ff', b:'#b8d8f8', t:'#1040a0', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Neutres
  { id:'noir',      l:'Noir',         c:'#111111', d:'#000000', lt:'#f0f0f0', b:'#cccccc', t:'#111111', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'gris80',    l:'Gris foncé',   c:'#444444', d:'#2a2a2a', lt:'#f2f2f2', b:'#cccccc', t:'#333333', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'sauge',     l:'Sauge',        c:'#485547', d:'#303d31', lt:'#f0f3f0', b:'#c2cdc2', t:'#485547', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Verts
  { id:'vertfonce', l:'Vert foncé',   c:'#2e7d32', d:'#1b5e20', lt:'#f0faf0', b:'#b0d8b0', t:'#1b5e20', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'vert',      l:'Vert',         c:'#43a047', d:'#2e7d32', lt:'#f2faf2', b:'#b8dcb8', t:'#1b5e20', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Rouges / violets
  { id:'rouge',     l:'Rouge',        c:'#e02020', d:'#b01010', lt:'#fff0f0', b:'#f8bcbc', t:'#a00000', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'violet',    l:'Violet',       c:'#7b1fa2', d:'#560e7a', lt:'#f8f0fc', b:'#dcb0f0', t:'#5a0080', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  { id:'rosevif',   l:'Rose vif',     c:'#e91e8c', d:'#c0166e', lt:'#fef0f7', b:'#f4b0d9', t:'#a00060', titleColor:'#FFCC00', textColor:'#e8e8e8' },
  // Oranges
  { id:'orange',    l:'Orange',       c:'#fb8c00', d:'#e65100', lt:'#fff8f0', b:'#fdd0a0', t:'#8c3a00', titleColor:'#FFCC00', textColor:'#fff' },
  { id:'peche',     l:'Pêche',        c:'#c47a3a', d:'#a05e20', lt:'#ffefdb', b:'#f0c898', t:'#8c4e10', titleColor:'#FFCC00', textColor:'#fff' },
  // Cyan
  { id:'cyandark',  l:'Cyan foncé',   c:'#00838f', d:'#006064', lt:'#f0fafc', b:'#a8dde2', t:'#005560', titleColor:'#FFCC00', textColor:'#e8e8e8' },
];

// ─── HISTORIQUE (localStorage) ────────────────────────────────────────────────
export function getHist() {
  try { return JSON.parse(localStorage.getItem('ALTIO_CV_hist')||'[]'); }
  catch { return []; }
}
export function setHist(arr) {
  localStorage.setItem('ALTIO_CV_hist', JSON.stringify(arr));
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

// ─── VERSIONS PAR CV (snapshots) ─────────────────────────────────────────────
// Chaque CV (histId) a jusqu'à 10 snapshots stockés dans localStorage.
// On stocke uniquement data (pas le HTML) pour économiser de l'espace.
const MAX_VERSIONS = 10;

export function saveVersion(histId, data, label) {
  if (!histId || !data) return;
  const key = `altio_versions_${histId}`;
  let versions = [];
  try { versions = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString('fr-FR', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  });
  // Éviter un doublon si sauvegarde < 30s après la précédente
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
  try { return JSON.parse(localStorage.getItem(`altio_versions_${histId}`) || '[]'); }
  catch { return []; }
}

export function deleteVersions(histId) {
  if (!histId) return;
  localStorage.removeItem(`altio_versions_${histId}`);
}

// Temps relatif pour les labels de version
export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'À l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h}h`;
  if (d < 7)  return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
  return new Date(ts).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ─── Color helper for formation tags (deterministic) ─────────────────────────
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

// ─── BULK SESSION ────────────────────────────────────────────────────────────
// Sauvegarde la session bulk (sans les base64 pour économiser l'espace)
export function saveBulkSession(groups) {
  const slim = groups.map(g => ({
    ...g,
    jobs: g.jobs.map(({ file, base64, mediaType, ...rest }) => rest),
  }));
  try { localStorage.setItem('altio_bulk_session', JSON.stringify({ groups: slim, savedAt: Date.now() })); }
  catch (e) { console.warn('Bulk session save failed', e); }
}
export function loadBulkSession() {
  try { const r = localStorage.getItem('altio_bulk_session'); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
export function clearBulkSession() {
  localStorage.removeItem('altio_bulk_session');
}

// ─── EDITOR STATE ─────────────────────────────────────────────────────────────
export function saveEditorState(state) {
  try { localStorage.setItem('altio_editor_state', JSON.stringify(state)); } catch {}
}
export function loadEditorState() {
  try { return JSON.parse(localStorage.getItem('altio_editor_state')||'null'); } catch { return null; }
}
