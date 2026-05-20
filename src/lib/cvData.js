// ─── FORMATIONS ─────────────────────────────────────────────────────────────
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function escH(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function hexToLt(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+',0.08)';
}
export function hexToB(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+',0.25)';
}

export function calcAge(ddn) {
  const parts = ddn.split('/');
  if (parts.length!==3||parts[2].length!==4) return null;
  const d=parseInt(parts[0]), m=parseInt(parts[1])-1, y=parseInt(parts[2]);
  if (isNaN(d)||isNaN(m)||isNaN(y)||y<1900||y>2030) return null;
  const today=new Date();
  let age=today.getFullYear()-y;
  if (today.getMonth()<m||(today.getMonth()===m&&today.getDate()<d)) age--;
  return age>=0&&age<100?age:null;
}

// ─── LANGUAGE LEVEL → GAUGE ───────────────────────────────────────────────────
function langPct(niveau) {
  const map = { 'a1':16,'a2':33,'b1':50,'b2':66,'c1':83,'c2':100,'natif':100,'native':100,'bilingue':100,'courant':83,'intermédiaire':50,'débutant':25,'notions':16 };
  return map[(niveau||'').toLowerCase().replace(/[^a-z0-9éè]/g,'')] || 60;
}

export function adaptPoste(p, g) {
  if (!p||!g) return p;
  const fem = {
    'Conseiller de vente':'Conseillère de vente','Conseiller commercial':'Conseillère commerciale',
    'Chargé de développement commercial':'Chargée de développement commercial',
    'Technico-commercial junior':'Technico-commerciale junior','Chargé de clientèle':'Chargée de clientèle',
    'Attaché commercial':'Attachée commerciale','Adjoint responsable de magasin':'Adjointe responsable de magasin',
    'Chargé de communication digitale':'Chargée de communication digitale',
    'Business developer':'Business developeuse','Chargé de développement RH':'Chargée de développement RH',
    'Contrôleur de gestion junior':'Contrôleuse de gestion junior',
    'Chargé de reporting financier':'Chargée de reporting financier',
    'Analyste financier junior':'Analyste financière junior',
    'Chargé de recrutement junior':'Chargée de recrutement junior',
    'Gestionnaire administrative RH':'Gestionnaire administrative RH',
    'Assistant manager':'Assistante manager',
    'Community Manager':'Community Manager',
    'Chargé de développement RH':'Chargée de développement RH',
  };
  const masc = {};
  Object.entries(fem).forEach(([m, f]) => { masc[f] = m; });
  if (g==='F') return fem[p]||p;
  if (g==='M') return masc[p]||p;
  return p;
}

// ─── PLACEHOLDERS ────────────────────────────────────────────────────────────
export const PHOTO_PLACEHOLDER = `<div class="photo-placeholder-wrap"><div class="photo-placeholder-inner"><span>👤</span><p>Photo</p></div></div>`;
export const LOGO_PLACEHOLDER  = `<span class="logo-placeholder-text">Logo<br>Talia</span>`;

// ─── CV TEMPLATE — 4 BLOCS ────────────────────────────────────────────────────
// Layout :
//   [block-header] photo | présentation (poste, nom, rythme, accroche) | logo
//   [block-body]   block-main (exp + formations)  |  block-sidebar (coordonnées, compétences, langues, intérêts)
export function getCVTemplate(p) {
  const pal = p || PALETTES[0];
  const c  = pal.c  || '#1a3a5c';
  const d  = pal.d  || '#0e2a44';
  const lt = pal.lt || hexToLt(c);
  const b  = pal.b  || hexToB(c);
  const t  = pal.t  || c;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}

/* ── LAYOUT 2 COLONNES FULL HEIGHT ──────────────────────────────────── */
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:row;background:#fff;}

/* ── COLONNE GAUCHE : photo fixe + sidebar ───────────────────────── */
.cv-col-left{width:254px;flex-shrink:0;display:flex;flex-direction:column;}

/* photo — hauteur fixe, jamais étirée */
.block-photo{background:${d};padding:40px 22px 18px;flex-shrink:0;}
.block-photo-inner{width:100%;overflow:hidden;border-radius:3px;}
.photo-placeholder-wrap{width:100%;height:260px;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{width:108px;height:128px;background:rgba(255,255,255,0.07);border:2px dashed rgba(255,255,255,0.22);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;}
.photo-placeholder-inner span{font-size:26px;opacity:0.38;}
.photo-placeholder-inner p{font-size:9px;color:rgba(255,255,255,0.32);text-align:center;line-height:1.4;}
.block-photo img{display:block;width:100%;height:auto;border-radius:3px;}

/* sidebar — occupe tout l'espace restant de la colonne gauche */
.block-sidebar{flex:1;background:${c};padding:16px 16px 14px;color:#fff;display:flex;flex-direction:column;}

/* logo — toujours en bas de la sidebar */
.logo-zone{margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;min-height:44px;}
.logo-zone img{max-width:80%;max-height:44px;object-fit:contain;display:block;}
.logo-placeholder-text{font-size:7.5px;color:rgba(255,255,255,0.28);text-align:center;letter-spacing:0.05em;text-transform:uppercase;line-height:1.5;}

/* ── COLONNE DROITE : présentation + contenu ─────────────────────── */
.cv-col-right{flex:1;display:flex;flex-direction:column;min-width:0;}

/* présentation */
.block-presentation{padding:20px 28px 18px;display:flex;flex-direction:column;justify-content:center;word-break:break-word;overflow-wrap:break-word;}
.cv-nom-prenom{font-size:26px;font-weight:800;color:${c};text-transform:uppercase;letter-spacing:0.025em;line-height:1.08;margin-bottom:4px;word-break:break-word;overflow-wrap:break-word;}
.cv-poste{font-size:13px;font-weight:500;color:${c};letter-spacing:0.04em;margin-bottom:10px;opacity:0.85;}
.cv-accroche{font-size:11px;color:#555;line-height:1.55;word-break:break-word;overflow-wrap:break-word;}

/* contenu principal */
.block-main{flex:1;padding:18px 20px 16px 24px;background:#fff;}
.section-title{display:block;width:100%;font-size:11.5px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.07em;border-top:1.5px solid ${c};padding-top:4px;margin-bottom:9px;margin-top:22px;}
.section-title:first-child{margin-top:0;}
.exp-block{margin-bottom:9px;}
.exp-poste{font-size:11.5px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.02em;}
.exp-meta{font-size:10.5px;color:#6b7280;font-style:italic;margin-bottom:3px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10.5px;color:#333;padding:1px 0 1px 11px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'\\2022';position:absolute;left:0;color:${c};}
.form-block{margin-bottom:7px;}
.form-titre{font-size:11.5px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10.5px;color:#6b7280;font-style:italic;}
.form-talia{margin-bottom:7px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#6b7280;}
.ldm-text{font-size:11px;line-height:1.8;color:#333;white-space:pre-line;}

/* ── SIDEBAR contenu ─────────────────────────────────────────────── */
.sidebar-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#FFCC00;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:3px;margin-bottom:7px;}
.sidebar-section{margin-bottom:13px;}
.sidebar-item{display:flex;align-items:flex-start;gap:5px;margin-bottom:5px;font-size:10.5px;line-height:1.4;color:rgba(255,255,255,0.88);}
.sidebar-icon{flex-shrink:0;width:13px;text-align:center;margin-top:1px;}
.comp-list{list-style:none;padding:0;}
.comp-list li{font-size:10.5px;color:rgba(255,255,255,0.88);padding:2px 0 2px 11px;position:relative;line-height:1.4;}
.comp-list li::before{content:'\\2022';position:absolute;left:0;color:#FFCC00;}
.comp-subtitle{font-size:8.5px;font-weight:700;color:#FFCC00;text-transform:uppercase;letter-spacing:0.07em;margin:6px 0 3px;}
</style></head><body>
<div class="cv-wrap">

  <!-- COLONNE GAUCHE : photo (fixe) + sidebar (flex:1) -->
  <div class="cv-col-left">
    <div class="block-photo">{{PHOTO_HTML}}</div>
    <div class="block-sidebar">{{SIDEBAR_HTML}}<div class="logo-zone">{{LOGO_HTML}}</div></div>
  </div>

  <!-- COLONNE DROITE : présentation + contenu principal -->
  <div class="cv-col-right">
    <div class="block-presentation">
      <div class="cv-nom-prenom">{{PRENOM}} {{NOM}}</div>
      <div class="cv-poste">{{POSTE}}</div>
      <div class="cv-accroche">{{ACCROCHE}}</div>
    </div>
    <div class="block-main">{{CONTENU_HTML}}</div>
  </div>

</div>
</body></html>`;
}

// ─── RENDER SIDEBAR HTML ──────────────────────────────────────────────────────
export function buildSidebarHTML(d) {
  let html = '';
  const ageStr = d.dateNaissance ? (function(){ const a=calcAge(d.dateNaissance); return a!==null?' ('+a+' ans)':''; })() : '';

  html += '<div class="sidebar-section"><div class="sidebar-title">COORDONNÉES</div>';
  if (d.telephone) html += '<div class="sidebar-item"><span class="sidebar-icon">📞</span>'+escH(d.telephone)+'</div>';
  if (d.email)     html += '<div class="sidebar-item"><span class="sidebar-icon">✉</span>'+escH(d.email)+'</div>';
  if (d.adresse)   html += '<div class="sidebar-item"><span class="sidebar-icon">📍</span>'+escH(d.adresse)+'</div>';
  if (d.dateNaissance) html += '<div class="sidebar-item"><span class="sidebar-icon">🎂</span>'+escH(d.dateNaissance)+escH(ageStr)+'</div>';
  if (d.permis)    html += '<div class="sidebar-item"><span class="sidebar-icon">🚗</span>Permis '+escH(d.permis)+'</div>';
  html += '</div>';

  const hasTech   = d.competences?.techniques?.length;
  const hasSoft   = d.competences?.comportementales?.length;
  const hasOutils = d.competences?.outils?.length;
  if (hasTech||hasSoft||hasOutils) {
    html += '<div class="sidebar-section"><div class="sidebar-title">COMPÉTENCES</div>';
    if (hasTech) {
      html += '<div class="comp-subtitle">Techniques</div><ul class="comp-list">';
      d.competences.techniques.forEach(c => html += '<li>'+escH(c)+'</li>');
      html += '</ul>';
    }
    if (hasSoft) {
      html += '<div class="comp-subtitle">Comportementales</div><ul class="comp-list">';
      d.competences.comportementales.forEach(c => html += '<li>'+escH(c)+'</li>');
      html += '</ul>';
    }
    if (hasOutils) {
      html += '<div class="comp-subtitle">Outils</div><ul class="comp-list">';
      d.competences.outils.forEach(c => html += '<li>'+escH(c)+'</li>');
      html += '</ul>';
    }
    html += '</div>';
  }

  if (d.langues?.length) {
    html += '<div class="sidebar-section"><div class="sidebar-title">LANGUES</div><ul class="comp-list">';
    d.langues.forEach(l => html += '<li>'+escH(l.langue)+(l.niveau?' — '+escH(l.niveau):'')+'</li>');
    html += '</ul></div>';
  }

  const interets = (d.centresInteret || []).filter(c => c.trim());
  if (interets.length) {
    html += '<div class="sidebar-section"><div class="sidebar-title">CENTRES D\'INTÉRÊT</div><ul class="comp-list">';
    interets.forEach(c => html += '<li>'+escH(c)+'</li>');
    html += '</ul></div>';
  }

  return html;
}

// ─── SIDEBAR HTML (light bg version — dark text) ──────────────────────────────
export function buildSidebarLightHTML(d, accent) {
  const ac = accent || '#1539B7';
  let html = '';
  const ageStr = d.dateNaissance ? (function(){ const a=calcAge(d.dateNaissance); return a!==null?' ('+a+' ans)':''; })() : '';

  // Contacts
  html += '<div class="sl-section">';
  html += '<div class="sl-title" style="color:'+ac+'">COORDONNÉES</div>';
  if (d.telephone)     html += '<div class="sl-item">'+escH(d.telephone)+'</div>';
  if (d.email)         html += '<div class="sl-item">'+escH(d.email)+'</div>';
  if (d.adresse)       html += '<div class="sl-item">'+escH(d.adresse)+'</div>';
  if (d.dateNaissance) html += '<div class="sl-item">'+escH(d.dateNaissance)+escH(ageStr)+'</div>';
  html += '</div>';

  // Compétences
  const hasTech   = d.competences?.techniques?.length;
  const hasSoft   = d.competences?.comportementales?.length;
  const hasOutils = d.competences?.outils?.length;
  if (hasTech||hasSoft||hasOutils) {
    html += '<div class="sl-section"><div class="sl-title" style="color:'+ac+'">COMPÉTENCES</div>';
    if (hasTech) {
      html += '<div class="sl-sub">Techniques</div><ul class="sl-list">';
      d.competences.techniques.forEach(c => html += '<li>'+escH(c)+'</li>');
      html += '</ul>';
    }
    if (hasSoft) {
      html += '<div class="sl-sub">Comportementales</div><ul class="sl-list">';
      d.competences.comportementales.forEach(c => html += '<li>'+escH(c)+'</li>');
      html += '</ul>';
    }
    if (hasOutils) {
      html += '<div class="sl-sub">Outils</div><ul class="sl-list">';
      d.competences.outils.forEach(c => html += '<li>'+escH(c)+'</li>');
      html += '</ul>';
    }
    html += '</div>';
  }

  // Langues avec jauge
  if (d.langues?.length) {
    html += '<div class="sl-section"><div class="sl-title" style="color:'+ac+'">LANGUES</div>';
    d.langues.forEach(l => {
      const pct = langPct(l.niveau);
      html += '<div class="sl-lang"><span class="sl-lang-name">'+escH(l.langue)+'</span>';
      if (l.niveau) html += '<span class="sl-lang-lvl">'+escH(l.niveau)+'</span>';
      html += '</div>';
      html += '<div class="sl-gauge-bg"><div class="sl-gauge-fill" style="width:'+pct+'%;background:'+ac+'"></div></div>';
    });
    html += '</div>';
  }

  // Intérêts
  const interets = (d.centresInteret||[]).filter(c => c.trim());
  if (interets.length) {
    html += '<div class="sl-section"><div class="sl-title" style="color:'+ac+'">INTÉRÊTS</div>';
    html += '<ul class="sl-list">';
    interets.forEach(c => html += '<li>'+escH(c)+'</li>');
    html += '</ul></div>';
  }

  return html;
}

// ─── CONTACTS INLINE (for header bands) ──────────────────────────────────────
function buildContactsInline(d) {
  const parts = [];
  if (d.telephone) parts.push(escH(d.telephone));
  if (d.email)     parts.push(escH(d.email));
  if (d.adresse)   parts.push(escH(d.adresse));
  if (d.linkedin)  parts.push(escH(d.linkedin));
  return parts.join(' &nbsp;·&nbsp; ');
}

// ─── RENDER CONTENU HTML ──────────────────────────────────────────────────────
export function buildContenuHTML(d, order) {
  const ST = (label) => '<div class="section-title">'+label+'</div>';

  const renderExperiences = () => {
    const hasExperiences = d.experiences?.length > 0;
    if (!hasExperiences) {
      if (d.lettreMotivation) {
        return ST('LETTRE DE MOTIVATION')
          + '<div class="ldm-text">'+escH(d.lettreMotivation).replace(/\n/g,'<br/>')+'</div>';
      }
      return '';
    }
    let h = ST('EXPÉRIENCES PROFESSIONNELLES');
    d.experiences.forEach(exp => {
      h += '<div class="exp-block"><div class="exp-poste">'+escH(exp.poste)+'</div>';
      h += '<div class="exp-meta">'+escH(exp.entreprise);
      if (exp.lieu)    h += ' — '+escH(exp.lieu);
      if (exp.periode) h += ' · '+escH(exp.periode);
      h += '</div>';
      if (exp.missions?.length) {
        h += '<ul class="exp-missions">';
        exp.missions.forEach(m => h += '<li>'+escH(m)+'</li>');
        h += '</ul>';
      }
      h += '</div>';
    });
    return h;
  };

  const renderFormations = () => {
    let h = ST('FORMATIONS');
    (d.formations||[]).forEach(f => {
      if (f.isTalia) {
        h += '<div class="form-talia"><div class="form-titre">'+escH(f.titre)+'</div>';
        h += '<div class="form-meta">'+escH(f.etablissement||'');
        if (f.periode) h += ' · '+escH(f.periode);
        h += ' · 1j cours 4j entreprise</div></div>';
      } else {
        h += '<div class="form-block"><div class="form-titre">'+escH(f.titre)+'</div>';
        h += '<div class="form-meta">'+escH(f.etablissement||'');
        if (f.periode) h += ' · '+escH(f.periode);
        h += '</div></div>';
      }
    });
    return h;
  };

  const RENDERERS = {
    experiences: renderExperiences,
    formations:  renderFormations,
  };

  const sectionOrder = order || ['experiences', 'formations'];
  let html = '';
  // Première section : pas de margin-top sur section-title
  let first = true;
  sectionOrder.forEach(id => {
    if (!RENDERERS[id]) return;
    const chunk = RENDERERS[id]();
    if (!chunk) return;
    if (first) {
      // Supprimer le margin-top de la première section-title
      html += chunk.replace('class="section-title"', 'class="section-title" style="margin-top:0"');
      first = false;
    } else {
      html += chunk;
    }
  });
  return html;
}

// ─── TEMPLATE 3 : COMPACT (colonne unique, photo gauche header) ───────────────
function getTemplateCompact(d, p, sectionOrder) {
  const c  = p.c  || '#1a3a5c';
  const d2 = p.d  || '#0e2a44';

  // ── Helper : liste à puces en colonnes de max 4 ──────────────────────────
  const listInCols = (items) => {
    if (!items.length) return '';
    const MAX = 4;
    const numCols = Math.ceil(items.length / MAX);
    if (numCols === 1) {
      return '<ul class="lin-list">' + items.map(i => '<li>'+escH(i)+'</li>').join('') + '</ul>';
    }
    let h = '<div class="lin-cols">';
    for (let c2 = 0; c2 < numCols; c2++) {
      const chunk = items.slice(c2 * MAX, (c2 + 1) * MAX);
      h += '<ul class="lin-list">' + chunk.map(i => '<li>'+escH(i)+'</li>').join('') + '</ul>';
    }
    return h + '</div>';
  };

  // ── Contacts bar ─────────────────────────────────────────────────────────
  const ageStr = d.dateNaissance ? (function(){ const a=calcAge(d.dateNaissance); return a!==null?' ('+a+' ans)':''; })() : '';
  const contactParts = [];
  if (d.telephone)     contactParts.push(escH(d.telephone));
  if (d.email)         contactParts.push(escH(d.email));
  if (d.adresse)       contactParts.push(escH(d.adresse));
  if (d.linkedin)      contactParts.push(escH(d.linkedin));
  if (d.dateNaissance) contactParts.push(escH(d.dateNaissance)+escH(ageStr));
  const contactsHTML = contactParts.join(' &nbsp;·&nbsp; ');

  // ── Compétences : 3 catégories côte à côte, chacune en liste à puces ────────
  const hasTech   = d.competences?.techniques?.length;
  const hasSoft   = d.competences?.comportementales?.length;
  const hasOutils = d.competences?.outils?.length;
  let competHTML = '';
  if (hasTech || hasSoft || hasOutils) {
    competHTML = '<div class="section-title" style="margin-top:0">COMPÉTENCES</div><div class="comp-row">';
    if (hasTech) {
      competHTML += '<div class="comp-group"><div class="comp-cat">Techniques</div>' + listInCols(d.competences.techniques) + '</div>';
    }
    if (hasSoft) {
      competHTML += '<div class="comp-group"><div class="comp-cat">Comportementales</div>' + listInCols(d.competences.comportementales) + '</div>';
    }
    if (hasOutils) {
      competHTML += '<div class="comp-group"><div class="comp-cat">Outils</div>' + listInCols(d.competences.outils) + '</div>';
    }
    competHTML += '</div>';
  }

  // ── Langues ───────────────────────────────────────────────────────────────
  let langHTML = '';
  if (d.langues?.length) {
    langHTML = '<div class="section-title">LANGUES</div><div class="lang-row">';
    d.langues.forEach(l => {
      langHTML += '<span class="lang-item"><b class="lang-name">'+escH(l.langue)+'</b>';
      if (l.niveau) langHTML += '<span class="lang-lvl"> — '+escH(l.niveau)+'</span>';
      langHTML += '</span>';
    });
    langHTML += '</div>';
  }

  // ── Expériences + formations ──────────────────────────────────────────────
  const contenuHTML = buildContenuHTML(d, sectionOrder);

  // ── Centres d'intérêt en listes à puces ──────────────────────────────────
  const interets = (d.centresInteret || []).filter(i => i.trim());
  let interetsHTML = '';
  if (interets.length) {
    interetsHTML = '<div class="section-title">CENTRES D\'INTÉRÊT</div>' + listInCols(interets);
  }

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:column;background:#fff;}

/* HEADER — photo gauche + infos droite */
.cv-header{padding:20px 28px 16px;display:flex;align-items:flex-start;gap:24px;flex-shrink:0;}
.block-photo{width:200px;flex-shrink:0;overflow:hidden;border-radius:3px;background:${d2};}
.block-photo img{display:block;width:100%;height:auto;object-fit:cover;}
.block-photo-inner{width:100%;overflow:hidden;border-radius:3px;}
.block-photo-inner img{display:block;width:100%;height:auto;object-fit:cover;}
.photo-placeholder-wrap{width:100%;height:252px;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{width:96px;height:118px;background:rgba(255,255,255,0.08);border:2px dashed rgba(255,255,255,0.22);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;}
.photo-placeholder-inner span{font-size:26px;opacity:0.38;}
.photo-placeholder-inner p{display:none;}
.header-info{flex:1;min-width:0;padding-top:6px;}
.cv-nom-prenom{font-size:26px;font-weight:800;color:${c};text-transform:uppercase;letter-spacing:0.02em;line-height:1.1;margin-bottom:5px;}
.cv-poste{font-size:11px;font-weight:600;color:${c};letter-spacing:0.09em;text-transform:uppercase;margin-bottom:9px;opacity:0.8;}
.cv-accroche{font-size:10.5px;color:#555;line-height:1.55;}

/* CONTACTS BAR */
.cv-contacts-bar{background:${c};padding:9px 32px;color:rgba(255,255,255,0.88);font-size:9.5px;line-height:1.4;flex-shrink:0;letter-spacing:0.01em;display:flex;align-items:center;gap:14px;}
.contacts-label{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#fff;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.3);padding-right:14px;white-space:nowrap;}

/* BODY */
.cv-body{flex:1;padding:14px 32px 24px;}

/* SECTION TITLES */
.section-title{display:block;width:100%;font-size:10.5px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid ${c};padding-bottom:3px;margin-bottom:8px;margin-top:18px;}

/* LISTES À PUCES + COLONNES */
.lin-cols{display:flex;gap:0 28px;align-items:flex-start;}
.lin-list{list-style:none;padding:0;margin:0;}
.lin-list li{font-size:10px;color:#333;padding:1.5px 0 1.5px 11px;position:relative;line-height:1.45;}
.lin-list li::before{content:'\\2022';position:absolute;left:0;color:${c};}

/* COMPÉTENCES EN LIGNE */
.comp-row{display:flex;gap:0 36px;align-items:flex-start;margin-bottom:16px;justify-content:space-evenly;}
.comp-group{}
.comp-cat{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${c};margin-bottom:4px;}

/* LANGUES */
.lang-row{display:flex;flex-wrap:wrap;gap:6px 18px;margin-bottom:4px;}
.lang-item{font-size:10px;color:#333;}
.lang-name{color:${c};font-weight:700;}
.lang-lvl{color:#6b7280;}

/* EXPÉRIENCES & FORMATIONS */
.exp-block{margin-bottom:9px;}
.exp-poste{font-size:11px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.02em;}
.exp-meta{font-size:10px;color:#6b7280;font-style:italic;margin-bottom:3px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10px;color:#333;padding:1px 0 1px 11px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'\\2022';position:absolute;left:0;color:${c};}
.form-block{margin-bottom:7px;}
.form-titre{font-size:11px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10px;color:#6b7280;font-style:italic;}
.form-talia{margin-bottom:7px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#6b7280;}
.ldm-text{font-size:10.5px;line-height:1.7;color:#333;white-space:pre-line;}
.logo-zone{display:none;}
</style></head><body>
<div class="cv-wrap">
  <div class="cv-header">
    <div class="block-photo">${PHOTO_PLACEHOLDER}</div>
    <div class="header-info">
      <div class="cv-nom-prenom">${escH(d.prenom||'')} ${escH(d.nom||'')}</div>
      <div class="cv-poste">${escH(d.poste||'')}</div>
      ${d.accroche ? '<div class="cv-accroche">'+escH(d.accroche)+'</div>' : ''}
    </div>
  </div>
  ${contactsHTML ? '<div class="cv-contacts-bar"><span class="contacts-label">Coordonnées</span><span>'+contactsHTML+'</span></div>' : ''}
  <div class="cv-body">
    ${competHTML}
    ${contenuHTML}
    ${langHTML}
    ${interetsHTML}
  </div>
</div>
</body></html>`;
}

// ─── TEMPLATES REGISTRY ───────────────────────────────────────────────────────
export const TEMPLATES = [
  { id: 'classic', label: 'Classique',   desc: 'Sidebar gauche sombre' },
  { id: 'minimal', label: 'Minimaliste', desc: 'Épuré, typographie seule' },
  { id: 'compact', label: 'Colonne',     desc: 'Photo + une colonne' },
];

function getTemplateModern(d, p, sectionOrder) {
  const c  = p.c  || '#1a3a5c';
  const d2 = p.d  || '#0e2a44';
  const ac = p.titleColor || '#F5B400';
  const sidebarHTML = buildSidebarLightHTML(d, c);
  const contenuHTML = buildContenuHTML(d, sectionOrder);
  const contactsHTML = buildContactsInline(d);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:column;background:#fff;}

/* HEADER BAND */
.cv-header{background:${c};padding:22px 28px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.header-text{}
.cv-nom-prenom{font-size:28px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.03em;line-height:1.1;margin-bottom:4px;}
.cv-poste{font-size:12px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;}
.cv-contacts{font-size:10px;color:rgba(255,255,255,0.65);line-height:1.8;}
.block-photo{width:100%;overflow:hidden;background:${d2};flex-shrink:0;}
.block-photo img{display:block;width:100%;height:auto;object-fit:cover;}
.block-photo-inner{width:100%;overflow:hidden;}
.block-photo-inner img{display:block;width:100%;height:auto;object-fit:cover;}
.photo-placeholder-wrap{width:100%;height:178px;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{width:70px;height:88px;background:rgba(255,255,255,0.1);border:2px dashed rgba(255,255,255,0.28);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px;}
.photo-placeholder-inner span{font-size:20px;opacity:0.35;}
.photo-placeholder-inner p{display:none;}

/* ACCROCHE sous le header */
.cv-accroche-band{padding:14px 28px;background:#F7F8FA;border-bottom:1px solid #ECEDF1;}
.cv-accroche{font-size:11px;color:#555;line-height:1.6;}

/* BODY */
.cv-body{flex:1;display:flex;}
.cv-main{flex:1;padding:20px 24px 20px 28px;}
.cv-sidebar-light{width:210px;flex-shrink:0;background:#F7F8FA;border-left:1px solid #ECEDF1;display:flex;flex-direction:column;}
.sl-content{padding:14px 16px 18px;flex:1;display:flex;flex-direction:column;}

/* SECTION TITLES (main) */
.section-title{display:block;width:100%;font-size:10.5px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid ${c};padding-top:4px;margin-bottom:8px;margin-top:20px;}
.section-title:first-child{margin-top:0;}
.exp-block{margin-bottom:8px;}
.exp-poste{font-size:11px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.02em;}
.exp-meta{font-size:10px;color:#6b7280;font-style:italic;margin-bottom:3px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10px;color:#333;padding:1px 0 1px 11px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'\\2022';position:absolute;left:0;color:${c};}
.form-block{margin-bottom:6px;}
.form-titre{font-size:11px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10px;color:#6b7280;font-style:italic;}
.form-talia{margin-bottom:6px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#6b7280;}
.ldm-text{font-size:10.5px;line-height:1.7;color:#333;white-space:pre-line;}

/* LOGO en bas de la sidebar claire */
.logo-zone{margin-top:auto;padding-top:8px;border-top:1px solid #DDDFE6;display:flex;align-items:center;justify-content:center;min-height:40px;}
.logo-zone img{max-width:80%;max-height:40px;object-fit:contain;display:block;}
.logo-placeholder-text{font-size:7px;color:#B0B4C0;text-align:center;letter-spacing:0.05em;text-transform:uppercase;line-height:1.5;}

/* LIGHT SIDEBAR */
.sl-section{margin-bottom:14px;}
.sl-title{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1.5px solid currentColor;padding-bottom:3px;margin-bottom:7px;}
.sl-item{font-size:9.5px;color:#3A4156;margin-bottom:3px;line-height:1.5;}
.sl-sub{font-size:8px;font-weight:700;color:#9AA0AE;text-transform:uppercase;letter-spacing:0.06em;margin:5px 0 2px;}
.sl-list{list-style:none;padding:0;}
.sl-list li{font-size:9.5px;color:#3A4156;padding:1px 0 1px 10px;position:relative;line-height:1.4;}
.sl-list li::before{content:'\\2022';position:absolute;left:0;color:${c};}
.sl-lang{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;}
.sl-lang-name{font-size:9.5px;font-weight:600;color:#1a1a1a;}
.sl-lang-lvl{font-size:8.5px;color:#9AA0AE;}
.sl-gauge-bg{height:4px;background:#E5E6EC;border-radius:99px;margin-bottom:7px;}
.sl-gauge-fill{height:4px;border-radius:99px;}
</style></head><body>
<div class="cv-wrap">
  <div class="cv-header">
    <div class="header-text">
      <div class="cv-nom-prenom">${escH(d.prenom||'')} ${escH(d.nom||'')}</div>
      <div class="cv-poste">${escH(d.poste||'')}</div>
      ${contactsHTML ? '<div class="cv-contacts">'+contactsHTML+'</div>' : ''}
    </div>
  </div>
  ${d.accroche ? '<div class="cv-accroche-band"><div class="cv-accroche">'+escH(d.accroche)+'</div></div>' : ''}
  <div class="cv-body">
    <div class="cv-main">${contenuHTML}</div>
    <div class="cv-sidebar-light"><div class="block-photo">${PHOTO_PLACEHOLDER}</div><div class="sl-content">${sidebarHTML}<div class="logo-zone">${LOGO_PLACEHOLDER}</div></div></div>
  </div>
</div>
</body></html>`;
}

function getTemplateMinimal(d, p, sectionOrder) {
  const c  = p.c  || '#1a3a5c';
  const ac = p.titleColor || '#F5B400';
  const contenuHTML = buildContenuHTML(d, sectionOrder);
  const sidebarHTML = buildSidebarLightHTML(d, c);

  const contactParts = [];
  if (d.telephone) contactParts.push(escH(d.telephone));
  if (d.email)     contactParts.push(escH(d.email));
  if (d.adresse)   contactParts.push(escH(d.adresse));

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Manrope:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:column;background:#fff;}

/* ── HEADER BAND ── */
.cv-header-band{
  background:${c};
  width:100%;
  padding:22px 40px 20px;
  display:flex;
  flex-direction:column;
  align-items:center;
  position:relative;
  overflow:visible;
}
/* Nom + photo + ligne */
.cv-name-row{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:16px;
  position:relative;
  z-index:1;
}
.cv-prenom{
  font-family:'Playfair Display',serif;
  font-size:26px;
  font-weight:700;
  color:#fff;
  letter-spacing:-0.3px;
  line-height:1.1;
  text-align:right;
}
.cv-nom{
  font-family:'Playfair Display',serif;
  font-size:26px;
  font-weight:700;
  color:#fff;
  letter-spacing:-0.3px;
  line-height:1.1;
  text-align:left;
}
/* Circular photo — overflows the band via negative margin */
.block-photo{
  width:108px;
  height:108px;
  border-radius:50%;
  overflow:hidden;
  border:3.5px solid rgba(255,255,255,0.5);
  background:rgba(255,255,255,0.12);
  flex-shrink:0;
  margin-top:-18px;
  margin-bottom:-18px;
  position:relative;
  z-index:2;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 6px 20px rgba(0,0,0,0.15);
}
.block-photo-inner{width:100%;height:100%;}
.block-photo-inner img{width:100%;height:100%;object-fit:cover;display:block;}
.photo-placeholder-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{display:flex;flex-direction:column;align-items:center;gap:2px;}
.photo-placeholder-inner span{font-size:32px;opacity:0.5;}
.photo-placeholder-inner p{display:none;}
/* Poste */
.cv-poste{
  font-size:10px;
  font-weight:600;
  color:rgba(255,255,255,0.85);
  letter-spacing:0.14em;
  text-transform:uppercase;
  margin-top:14px;
  text-align:center;
}
/* Contacts line — below the band */
.cv-contacts-line{
  text-align:center;
  font-size:9.5px;
  color:${c};
  font-weight:500;
  padding:7px 40px 4px;
  letter-spacing:0.02em;
}
/* Accroche */
.cv-accroche{font-size:11px;color:#555;line-height:1.6;margin:0 40px 12px;padding-left:12px;border-left:2.5px solid ${c};}

/* BODY : 2 colonnes */
.cv-body{display:flex;gap:28px;flex:1;padding:18px 40px 28px;}
.cv-main{flex:1;}
.cv-sidebar-light{width:188px;flex-shrink:0;display:flex;flex-direction:column;}

/* SECTIONS */
.section-title{display:block;font-size:9.5px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:7px;margin-top:18px;}
.section-title:first-child{margin-top:0;}
.section-title::after{content:'';display:block;height:1px;background:${c};opacity:0.25;margin-top:4px;}
.exp-block{margin-bottom:8px;}
.exp-poste{font-size:11px;font-weight:700;color:#1a1a1a;}
.exp-meta{font-size:10px;color:#9AA0AE;font-style:italic;margin-bottom:3px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10px;color:#444;padding:1px 0 1px 10px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'–';position:absolute;left:0;color:${c};}
.form-block{margin-bottom:6px;}
.form-titre{font-size:11px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10px;color:#9AA0AE;font-style:italic;}
.form-talia{margin-bottom:6px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#9AA0AE;}
.ldm-text{font-size:10.5px;line-height:1.7;color:#444;white-space:pre-line;}

/* LOGO en bas de la sidebar claire */
.logo-zone{margin-top:auto;padding-top:8px;border-top:1px solid #DDDFE6;display:flex;align-items:center;justify-content:center;min-height:40px;}
.logo-zone img{max-width:80%;max-height:40px;object-fit:contain;display:block;}
.logo-placeholder-text{font-size:7px;color:#B0B4C0;text-align:center;letter-spacing:0.05em;text-transform:uppercase;line-height:1.5;}

/* SIDEBAR LIGHT */
.sl-section{margin-bottom:14px;}
.sl-title{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${c};border-bottom:1px solid ${c};padding-bottom:2px;margin-bottom:6px;opacity:0.85;}
.sl-item{font-size:9.5px;color:#3A4156;margin-bottom:3px;line-height:1.5;}
.sl-sub{font-size:8px;font-weight:700;color:#9AA0AE;text-transform:uppercase;letter-spacing:0.06em;margin:5px 0 2px;}
.sl-list{list-style:none;padding:0;}
.sl-list li{font-size:9.5px;color:#3A4156;padding:1px 0 1px 8px;position:relative;line-height:1.4;}
.sl-list li::before{content:'–';position:absolute;left:0;color:${c};}
.sl-lang{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;}
.sl-lang-name{font-size:9.5px;font-weight:600;color:#1a1a1a;}
.sl-lang-lvl{font-size:8.5px;color:#9AA0AE;}
.sl-gauge-bg{height:3px;background:#E5E6EC;border-radius:99px;margin-bottom:7px;}
.sl-gauge-fill{height:3px;border-radius:99px;}
</style></head><body>
<div class="cv-wrap">
  <!-- Bande colorée header -->
  <div class="cv-header-band">
    <div class="cv-name-row">
      <span class="cv-prenom">${escH(d.prenom||'')}</span>
      <div class="block-photo">${PHOTO_PLACEHOLDER}</div>
      <span class="cv-nom">${escH(d.nom||'')}</span>
    </div>
    <div class="cv-poste">${escH(d.poste||'')}</div>
  </div>
  <!-- Contacts sous la bande -->
  ${contactParts.length ? '<div class="cv-contacts-line">'+contactParts.join(' · ')+'</div>' : ''}
  ${d.accroche ? '<div class="cv-accroche">'+escH(d.accroche)+'</div>' : ''}
  <!-- Corps 2 colonnes -->
  <div class="cv-body">
    <div class="cv-main">${contenuHTML}</div>
    <div class="cv-sidebar-light">${sidebarHTML}<div class="logo-zone">${LOGO_PLACEHOLDER}</div></div>
  </div>
</div>
</body></html>`;
}

function getTemplateCorporate(d, p, sectionOrder) {
  const c  = p.c  || '#1a3a5c';
  const d2 = p.d  || '#0e2a44';
  const ac = p.titleColor || '#F5B400';
  const contenuHTML = buildContenuHTML(d, sectionOrder);
  const sidebarHTML = buildSidebarHTML(d);

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:column;background:#fff;}

/* TOP BAR */
.cv-topbar{height:7px;background:${c};width:100%;}

/* HEADER */
.cv-header{padding:20px 28px 16px;border-bottom:2px solid ${c};display:flex;align-items:center;}
.header-left{}
.cv-nom-prenom{font-size:26px;font-weight:800;color:#0B1020;text-transform:uppercase;letter-spacing:0.02em;line-height:1.1;}
.cv-poste{font-size:11px;font-weight:600;color:${c};letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;}
.cv-contacts-corp{font-size:9.5px;color:#9AA0AE;margin-top:6px;line-height:1.6;}
.block-photo{width:100%;overflow:hidden;background:${d2};margin:-18px -16px 16px;flex-shrink:0;}
.block-photo img{display:block;width:100%;height:auto;object-fit:cover;}
.block-photo-inner{width:100%;overflow:hidden;}
.block-photo-inner img{display:block;width:100%;height:auto;object-fit:cover;}
.photo-placeholder-wrap{width:100%;height:178px;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{width:70px;height:88px;background:rgba(255,255,255,0.07);border:2px dashed rgba(255,255,255,0.22);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px;}
.photo-placeholder-inner span{font-size:20px;opacity:0.35;}
.photo-placeholder-inner p{display:none;}

/* ACCROCHE */
.cv-accroche-corp{padding:10px 28px;background:#F7F8FA;border-bottom:1px solid #ECEDF1;font-size:10.5px;color:#555;line-height:1.6;font-style:italic;}

/* BODY */
.cv-body{flex:1;display:flex;}
.cv-main{flex:1;padding:18px 20px 16px 28px;}
.block-sidebar{width:220px;flex-shrink:0;background:${c};padding:18px 16px 14px;color:#fff;display:flex;flex-direction:column;}

/* SECTION TITLES */
.section-title{display:block;width:100%;font-size:10px;font-weight:800;color:#0B1020;text-transform:uppercase;letter-spacing:0.1em;border-bottom:2px solid ${c};padding-bottom:3px;margin-bottom:8px;margin-top:20px;}
.section-title:first-child{margin-top:0;}
.exp-block{margin-bottom:8px;}
.exp-poste{font-size:11px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.02em;}
.exp-meta{font-size:10px;color:#6b7280;font-style:italic;margin-bottom:2px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10px;color:#333;padding:1px 0 1px 11px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'\\25B6';font-size:6px;position:absolute;left:0;top:4px;color:${c};}
.form-block{margin-bottom:6px;}
.form-titre{font-size:11px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10px;color:#6b7280;font-style:italic;}
.form-talia{margin-bottom:6px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#6b7280;}
.ldm-text{font-size:10.5px;line-height:1.7;color:#333;white-space:pre-line;}
.logo-zone{margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;min-height:44px;}
.logo-zone img{max-width:80%;max-height:36px;object-fit:contain;display:block;}
.logo-placeholder-text{font-size:7px;color:rgba(255,255,255,0.28);text-align:center;letter-spacing:0.05em;text-transform:uppercase;}

/* SIDEBAR DARK (reuse existing classes) */
.sidebar-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${ac};border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:3px;margin-bottom:6px;}
.sidebar-section{margin-bottom:12px;}
.sidebar-item{display:flex;align-items:flex-start;gap:4px;margin-bottom:4px;font-size:10px;line-height:1.4;color:rgba(255,255,255,0.88);}
.sidebar-icon{flex-shrink:0;width:12px;text-align:center;margin-top:1px;}
.comp-list{list-style:none;padding:0;}
.comp-list li{font-size:10px;color:rgba(255,255,255,0.88);padding:1.5px 0 1.5px 10px;position:relative;line-height:1.4;}
.comp-list li::before{content:'\\2022';position:absolute;left:0;color:${ac};}
.comp-subtitle{font-size:8px;font-weight:700;color:${ac};text-transform:uppercase;letter-spacing:0.07em;margin:5px 0 2px;}
</style></head><body>
<div class="cv-wrap">
  <div class="cv-topbar"></div>
  <div class="cv-header">
    <div class="header-left">
      <div class="cv-nom-prenom">${escH(d.prenom||'')} ${escH(d.nom||'')}</div>
      <div class="cv-poste">${escH(d.poste||'')}</div>
      <div class="cv-contacts-corp">${buildContactsInline(d)}</div>
    </div>
  </div>
  ${d.accroche ? '<div class="cv-accroche-corp">'+escH(d.accroche)+'</div>' : ''}
  <div class="cv-body">
    <div class="cv-main">${contenuHTML}</div>
    <div class="block-sidebar"><div class="block-photo">${PHOTO_PLACEHOLDER}</div>${sidebarHTML}<div class="logo-zone">${LOGO_PLACEHOLDER}</div></div>
  </div>
</div>
</body></html>`;
}

// ─── RENDER COMPLETE CV HTML ──────────────────────────────────────────────────
export function renderCVFromData(d, palette, sectionOrder, templateId) {
  const p = palette || PALETTES[0];
  switch (templateId) {
    case 'minimal': return getTemplateMinimal(d, p, sectionOrder);
    case 'compact': return getTemplateCompact(d, p, sectionOrder);
    default: {
      // classic — existing logic
      const template = getCVTemplate(p);
      const sidebarHTML = buildSidebarHTML(d);
      const contenuHTML = buildContenuHTML(d, sectionOrder);
      return template
        .replace('{{PHOTO_HTML}}',   PHOTO_PLACEHOLDER)
        .replace('{{POSTE}}',        escH(d.poste||'POSTE À DÉFINIR'))
        .replace('{{PRENOM}}',       escH(d.prenom||''))
        .replace('{{NOM}}',          escH(d.nom||''))
        .replace('{{ACCROCHE}}',     escH(d.accroche||''))
        .replace('{{SIDEBAR_HTML}}', sidebarHTML)
        .replace('{{CONTENU_HTML}}', contenuHTML)
        .replace('{{LOGO_HTML}}',    LOGO_PLACEHOLDER);
    }
  }
}

// ─── APPLY DESIGN TO CV HTML ──────────────────────────────────────────────────
export function applyDesignToCVHtml(html, pp) {
  const c      = pp.c  || '#1a3a5c';
  const d      = pp.d  || '#0e2a44';
  const lt     = pp.lt || hexToLt(c);
  const b      = pp.b  || hexToB(c);
  const t      = pp.t  || c;
  const accent = pp.titleColor || '#FFCC00';

  html = html.replace(/<style id="dsim-s">[^<]*<\/style>/g, '');
  const si = '<style id="dsim-s">'
    +'.block-photo{background:'+d+' !important;}'
    +'.block-sidebar{background:'+c+' !important;}'
    +'.cv-nom-prenom{color:'+c+' !important;}'
    +'.cv-poste{color:'+c+' !important;}'
    +'.section-title{color:'+c+' !important;border-top-color:'+c+' !important;}'
    +'.exp-missions li::before{color:'+c+' !important;}'
    +'.sidebar-title{color:'+accent+' !important;}'
    +'.comp-subtitle{color:'+accent+' !important;}'
    +'.comp-list li::before{color:'+accent+' !important;}'
    +'.form-talia .form-titre{color:#1a1a1a !important;font-weight:700 !important;}'
    +'.form-talia .form-meta{color:#6b7280 !important;}'
    +'</style>';
  html = html.replace('</head>', si+'</head>');
  return html;
}

// ─── HISTORIQUE (localStorage) ────────────────────────────────────────────────
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

// ─── EDITOR STATE ─────────────────────────────────────────────────────────────
export function saveEditorState(state) {
  try { localStorage.setItem('talia_editor_state', JSON.stringify(state)); } catch {}
}
export function loadEditorState() {
  try { return JSON.parse(localStorage.getItem('talia_editor_state')||'null'); } catch { return null; }
}
