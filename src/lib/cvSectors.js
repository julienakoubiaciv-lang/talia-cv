/**
 * cvSectors — Archétypes sectoriels pour CV
 *
 * Au-delà des templates visuels, le secteur définit :
 *   - L'ORDRE des sections principales (ex: Tech → Projets en haut)
 *   - Les SECTIONS SPÉCIALISÉES à activer (projets, KPIs, portfolio, campagnes)
 *   - Une PALETTE de couleurs recommandée par secteur
 *   - Le TEMPLATE visuel par défaut conseillé
 *   - Le PROMPT d'extraction IA enrichi
 *
 * Champs additionnels dans cvData (tous optionnels) :
 *   projets   : [{ nom, description, stack, url, role }]      ← Tech
 *   kpis      : [{ label, value, context }]                    ← Commercial
 *   portfolio : [{ titre, description, url, support }]         ← Création
 *   campagnes : [{ nom, canal, resultat, outils }]             ← Marketing
 *
 * Usage :
 *   import { SECTORS, getSector } from '@/lib/cvSectors';
 *   const sector = getSector('tech');
 *   const sectionOrder = sector.sectionOrder;
 */

/** ID secteur "généraliste" — comportement actuel (rétrocompatible) */
export const SECTOR_GENERAL = 'general';

/**
 * Liste exhaustive des secteurs.
 * - id            : identifiant stable (utilisé dans cvData.sector)
 * - label         : libellé court affiché dans l'UI
 * - emoji         : icône visible dans le picker
 * - description   : 1 phrase d'explication
 * - sectionOrder  : ordre des sections principales (gauche/droite ou haut/bas selon template)
 * - sidebarOrder  : ordre des blocs sidebar
 * - extraSections : sections spécialisées à activer en plus
 * - paletteHint   : ID palette recommandé (cvData.js PALETTES) — utilisé si l'user veut "appliquer la reco"
 * - templateHint  : template visuel conseillé
 * - aiPromptHook  : texte injecté dans le prompt système IA pour orienter l'extraction
 */
export const SECTORS = [
  {
    id: SECTOR_GENERAL,
    label: 'Généraliste',
    emoji: '📄',
    description: 'Structure classique — Expériences puis Formations puis Compétences',
    sectionOrder: ['experiences', 'formations', 'competences'],
    sidebarOrder: ['competences', 'langues', 'interets'],
    extraSections: [],
    paletteHint:   0, // PALETTES[0] (bleu marine)
    templateHint:  'classic',
    aiPromptHook:  '',
  },

  {
    id: 'tech',
    label: 'Tech',
    emoji: '💻',
    description: 'Projets en haut · Stack technique mise en avant · Idéal devs / data / IT',
    sectionOrder: ['projets', 'experiences', 'formations', 'competences'],
    sidebarOrder: ['competences', 'langues', 'interets'],
    extraSections: ['projets'],
    paletteHint:   1, // bleu vif
    templateHint:  'minimal',
    aiPromptHook: `
SECTEUR : TECH
- Si l'utilisateur mentionne des projets personnels, open-source, GitHub ou portfolios techniques, RENSEIGNE la section "projets" : [{ nom, description, stack: ["React","Node",...], url, role }]
- Dans les compétences techniques, PRIORISE les langages/frameworks/outils explicites (React, Python, AWS, Docker, Kubernetes, Git, SQL, etc.)
- Les missions doivent commencer par des verbes techniques précis : "Développer", "Déployer", "Optimiser", "Refactoriser", "Industrialiser"
- L'accroche doit mentionner la spécialisation tech (front, back, fullstack, data, devops, mobile, IA…)`,
  },

  {
    id: 'commercial',
    label: 'Commercial',
    emoji: '💼',
    description: 'KPIs chiffrés en évidence · Idéal sales / business dev / RC',
    sectionOrder: ['kpis', 'experiences', 'competences', 'formations'],
    sidebarOrder: ['competences', 'langues', 'interets'],
    extraSections: ['kpis'],
    paletteHint:   3, // vert business
    templateHint:  'impact',
    aiPromptHook: `
SECTEUR : COMMERCIAL
- Extrais TOUS les chiffres et résultats quantifiés des missions et place-les dans "kpis" : [{ label: "CA généré", value: "+450k€", context: "annuel chez X" }]
- Dans les missions, FAIS REMONTER les chiffres au début : "Augmenté le CA de 23% en 6 mois en…" plutôt que "Prospection téléphonique avec 23% de croissance"
- Si aucun chiffre n'est explicite, NE PAS INVENTER — proposer plutôt 3-4 KPIs vides à compléter par le candidat
- Les compétences doivent inclure : prospection, négociation, closing, CRM (Salesforce, HubSpot, Pipedrive), reporting`,
  },

  {
    id: 'creation',
    label: 'Création',
    emoji: '🎨',
    description: 'Portfolio en évidence · Réalisations visuelles · Idéal design / UX / créa',
    sectionOrder: ['portfolio', 'experiences', 'competences', 'formations'],
    sidebarOrder: ['competences', 'langues', 'interets'],
    extraSections: ['portfolio'],
    paletteHint:   4, // violet créatif
    templateHint:  'compact',
    aiPromptHook: `
SECTEUR : CRÉATION
- Si l'utilisateur mentionne des réalisations, des projets visuels, un Behance, Dribbble, Instagram pro, RENSEIGNE "portfolio" : [{ titre, description, url, support: "Behance"|"Dribbble"|"Instagram"|"Site perso" }]
- Dans les compétences techniques, PRIORISE les outils créatifs : Figma, Photoshop, Illustrator, After Effects, Procreate, Webflow, Framer
- L'accroche doit mentionner la sensibilité esthétique et la spécialisation (UI, UX, branding, motion, illustration…)
- Les missions doivent décrire les LIVRABLES créatifs (charte graphique, refonte UX, design system, etc.)`,
  },

  {
    id: 'marketing',
    label: 'Marketing',
    emoji: '📈',
    description: 'Campagnes & outils en évidence · KPIs marketing · Idéal growth / acquisition',
    sectionOrder: ['campagnes', 'experiences', 'competences', 'formations'],
    sidebarOrder: ['competences', 'langues', 'interets'],
    extraSections: ['campagnes'],
    paletteHint:   2, // orange dynamique
    templateHint:  'minimal',
    aiPromptHook: `
SECTEUR : MARKETING
- Si l'utilisateur mentionne des campagnes, lancements, growth hacks, RENSEIGNE "campagnes" : [{ nom, canal: "SEA"|"SEO"|"Social"|"Email"|"Influence", resultat: "+38% CTR sur 3 mois", outils: ["GA4","HubSpot"] }]
- Dans les compétences/outils, PRIORISE : Google Analytics, GA4, Google Ads, Meta Ads, HubSpot, Mailchimp, Notion, Semrush, Ahrefs
- L'accroche doit mentionner la spécialité (acquisition, branding, content, CRM, growth…)
- Les missions doivent inclure des METRICS : taux de conversion, CTR, CAC, LTV, ROI, ROAS`,
  },
];

/** Map ID → secteur pour lookup rapide */
const SECTORS_BY_ID = SECTORS.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

/** Retourne un secteur par ID, fallback sur 'general' */
export function getSector(id) {
  return SECTORS_BY_ID[id] || SECTORS_BY_ID[SECTOR_GENERAL];
}

/**
 * Construit le prompt système enrichi pour la génération IA.
 * À concatener au prompt d'extraction principal.
 */
export function buildSectorPromptHook(sectorId) {
  const sector = getSector(sectorId);
  if (!sector.aiPromptHook) return '';
  return `\n${sector.aiPromptHook}\n`;
}

/**
 * Étend la structure JSON cible que Claude doit retourner avec les champs
 * spécifiques au secteur. Concatener dans le prompt d'extraction.
 */
export function buildSectorJsonExtension(sectorId) {
  const sector = getSector(sectorId);
  if (!sector.extraSections.length) return '';

  const fragments = sector.extraSections.map(s => {
    switch (s) {
      case 'projets':
        return '"projets": [{ "nom":"", "description":"", "stack":[], "url":"", "role":"" }]';
      case 'kpis':
        return '"kpis": [{ "label":"", "value":"", "context":"" }]';
      case 'portfolio':
        return '"portfolio": [{ "titre":"", "description":"", "url":"", "support":"" }]';
      case 'campagnes':
        return '"campagnes": [{ "nom":"", "canal":"", "resultat":"", "outils":[] }]';
      default:
        return null;
    }
  }).filter(Boolean);

  return fragments.length ? ',\n  ' + fragments.join(',\n  ') : '';
}

/** Liste les secteurs sous forme adaptée à un picker UI */
export function getSectorOptions() {
  return SECTORS.map(s => ({
    id:          s.id,
    label:       s.label,
    emoji:       s.emoji,
    description: s.description,
  }));
}
