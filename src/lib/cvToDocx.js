/**
 * cvToDocx — Convertit cvData en document Word (.docx) éditable.
 *
 * Génère un DOCX 100% côté client (pas d'appel serveur).
 *
 * Avantages :
 *   - Document texte sélectionnable et modifiable dans Word/Pages/Google Docs
 *   - Compatible ATS (Applicant Tracking Systems) — pas de tableaux complexes
 *   - Préserve la structure sémantique du CV
 *
 * Limites :
 *   - Le rendu n'est PAS identique au PDF (Word a son propre moteur de mise en page)
 *   - Pas de photo (les photos sont rarement souhaitables sur un CV ATS de toute façon)
 *
 * Usage :
 *   import { generateDocxBlob } from '@/lib/cvToDocx';
 *   const blob = await generateDocxBlob(cvData, { accentColor: '#1539B7' });
 *   const url  = URL.createObjectURL(blob);
 *   // ... download
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopType, TabStopPosition,
} from 'docx';

// ─── Constantes de style ───────────────────────────────────────────────────
const FONT      = 'Calibri';
const COL_INK   = '111111';
const COL_MUTE  = '666666';
const COL_LIGHT = '999999';

// Convertit '#RRGGBB' → 'RRGGBB' (docx attend sans #)
function hex(color) {
  return String(color || '').replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6) || '1539B7';
}

// ─── Builders de paragraphes ───────────────────────────────────────────────

/** Nom + prénom en titre principal (style Header 1) */
function pName({ prenom, nom, accent }) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: `${prenom || ''} ${(nom || '').toUpperCase()}`.trim(),
        font: FONT, size: 56, // 28pt
        bold: true, color: hex(accent),
      }),
    ],
  });
}

/** Poste visé (sous le nom) */
function pPoste(poste, accent) {
  if (!poste) return null;
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: poste.toUpperCase(),
        font: FONT, size: 24, // 12pt
        color: hex(accent), bold: false,
      }),
    ],
  });
}

/** Ligne de coordonnées (téléphone · email · ville · linkedin) */
function pContacts(data) {
  const parts = [
    data.telephone, data.email, data.adresse, data.linkedin, data.dateNaissance,
  ].filter(Boolean);
  if (!parts.length) return null;
  return new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: parts.join('  ·  '),
        font: FONT, size: 18, // 9pt
        color: COL_MUTE,
      }),
    ],
  });
}

/** Accroche (paragraphe descriptif) */
function pAccroche(text) {
  if (!text) return null;
  return new Paragraph({
    spacing: { after: 240, line: 280 },
    children: [
      new TextRun({
        text, font: FONT, size: 20, // 10pt
        color: COL_INK,
      }),
    ],
  });
}

/** Titre de section (ex: EXPÉRIENCES PROFESSIONNELLES) */
function pSectionTitle(label, accent) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 8, color: hex(accent), space: 4 },
    },
    children: [
      new TextRun({
        text: label.toUpperCase(),
        font: FONT, size: 22, // 11pt
        bold: true, color: hex(accent),
      }),
    ],
  });
}

/** Ligne avec un titre fort + meta italique à droite (tab) */
function pTitleMeta({ title, meta }) {
  return new Paragraph({
    spacing: { after: 40 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: title || '', font: FONT, size: 22, bold: true, color: COL_INK }),
      new TextRun({ text: '\t', font: FONT }),
      new TextRun({ text: meta || '', font: FONT, size: 18, italics: true, color: COL_MUTE }),
    ],
  });
}

/** Sous-ligne (entreprise · lieu · période) */
function pSubMeta(text) {
  if (!text) return null;
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size: 18, italics: true, color: COL_MUTE })],
  });
}

/** Liste à puces (missions, projets, etc.) */
function pBullet(text, color = COL_INK) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40, line: 260 },
    children: [new TextRun({ text, font: FONT, size: 20, color })],
  });
}

// ─── Sections ──────────────────────────────────────────────────────────────

function buildExperiences(experiences, accent) {
  if (!experiences?.length) return [];
  const blocks = [pSectionTitle('Expériences professionnelles', accent)];
  experiences.forEach(exp => {
    blocks.push(pTitleMeta({ title: exp.poste || '', meta: exp.periode || '' }));
    const meta = [exp.entreprise, exp.lieu].filter(Boolean).join(' · ');
    const sub = pSubMeta(meta);
    if (sub) blocks.push(sub);
    (exp.missions || []).forEach(m => { if (m?.trim()) blocks.push(pBullet(m)); });
    // Espace après chaque expérience
    blocks.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '', font: FONT })] }));
  });
  return blocks;
}

function buildFormations(formations, accent) {
  if (!formations?.length) return [];
  const blocks = [pSectionTitle('Formations', accent)];
  formations.forEach(f => {
    blocks.push(pTitleMeta({ title: f.titre || '', meta: f.periode || '' }));
    const meta = f.isTalia
      ? [f.etablissement, '1j cours · 4j entreprise'].filter(Boolean).join(' · ')
      : f.etablissement;
    const sub = pSubMeta(meta);
    if (sub) blocks.push(sub);
  });
  return blocks;
}

function buildCompetences(comp, accent) {
  const { techniques = [], comportementales = [], outils = [] } = comp || {};
  if (!techniques.length && !comportementales.length && !outils.length) return [];
  const blocks = [pSectionTitle('Compétences', accent)];

  const addCategory = (label, items) => {
    if (!items.length) return;
    blocks.push(new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({
        text: label, font: FONT, size: 18, bold: true,
        color: hex(accent), allCaps: true,
      })],
    }));
    blocks.push(new Paragraph({
      spacing: { after: 60, line: 280 },
      children: [new TextRun({
        text: items.join('  ·  '),
        font: FONT, size: 20, color: COL_INK,
      })],
    }));
  };

  addCategory('Techniques',       techniques);
  addCategory('Comportementales', comportementales);
  addCategory('Outils',           outils);
  return blocks;
}

function buildLangues(langues, accent) {
  if (!langues?.length) return [];
  const blocks = [pSectionTitle('Langues', accent)];
  langues.forEach(l => {
    if (!l?.langue) return;
    blocks.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: l.langue, font: FONT, size: 20, bold: true, color: COL_INK }),
        new TextRun({
          text: l.niveau ? ` — ${l.niveau}` : '',
          font: FONT, size: 20, color: COL_MUTE,
        }),
      ],
    }));
  });
  return blocks;
}

function buildInterets(items, accent) {
  if (!items?.length) return [];
  const filtered = items.filter(s => s?.trim());
  if (!filtered.length) return [];
  return [
    pSectionTitle("Centres d'intérêt", accent),
    new Paragraph({
      spacing: { after: 60, line: 260 },
      children: [new TextRun({
        text: filtered.join('  ·  '),
        font: FONT, size: 20, color: COL_INK,
      })],
    }),
  ];
}

// ─── Sections sectorielles ─────────────────────────────────────────────────

function buildProjets(projets, accent) {
  if (!projets?.length) return [];
  const blocks = [pSectionTitle('Projets', accent)];
  projets.forEach(p => {
    if (!p.nom) return;
    blocks.push(pTitleMeta({ title: p.nom, meta: p.role || '' }));
    if (p.description) blocks.push(pSubMeta(p.description));
    if (Array.isArray(p.stack) && p.stack.length) {
      blocks.push(new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({
          text: '⚙ ' + p.stack.join(' · '),
          font: FONT, size: 18, italics: true, color: hex(accent),
        })],
      }));
    }
    if (p.url) {
      blocks.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: '🔗 ' + p.url, font: FONT, size: 18, color: hex(accent),
        })],
      }));
    }
  });
  return blocks;
}

function buildKpis(kpis, accent) {
  if (!kpis?.length) return [];
  const blocks = [pSectionTitle('Résultats clés', accent)];
  kpis.forEach(k => {
    if (!k.label && !k.value) return;
    blocks.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: k.value || '—', font: FONT, size: 26, bold: true, color: hex(accent) }),
        new TextRun({ text: '   ' + (k.label || ''), font: FONT, size: 20, color: COL_INK }),
      ],
    }));
    if (k.context) {
      blocks.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: k.context, font: FONT, size: 18, italics: true, color: COL_MUTE })],
      }));
    }
  });
  return blocks;
}

function buildPortfolio(portfolio, accent) {
  if (!portfolio?.length) return [];
  const blocks = [pSectionTitle('Portfolio', accent)];
  portfolio.forEach(p => {
    if (!p.titre) return;
    blocks.push(pTitleMeta({ title: p.titre, meta: p.support || '' }));
    if (p.description) blocks.push(pSubMeta(p.description));
    if (p.url) {
      blocks.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: '🔗 ' + p.url, font: FONT, size: 18, color: hex(accent),
        })],
      }));
    }
  });
  return blocks;
}

function buildCampagnes(campagnes, accent) {
  if (!campagnes?.length) return [];
  const blocks = [pSectionTitle('Campagnes & résultats', accent)];
  campagnes.forEach(c => {
    if (!c.nom) return;
    blocks.push(pTitleMeta({ title: c.nom, meta: c.canal || '' }));
    if (c.resultat) {
      blocks.push(new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({
          text: '📊 ' + c.resultat, font: FONT, size: 20, bold: true, color: hex(accent),
        })],
      }));
    }
    if (Array.isArray(c.outils) && c.outils.length) {
      blocks.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: '🛠 ' + c.outils.join(' · '),
          font: FONT, size: 18, color: COL_MUTE,
        })],
      }));
    }
  });
  return blocks;
}

// ─── Dispatcher de sections par ID ─────────────────────────────────────────

const SECTION_BUILDERS = {
  experiences: (d, a) => buildExperiences(d.experiences, a),
  formations:  (d, a) => buildFormations(d.formations, a),
  competences: (d, a) => buildCompetences(d.competences, a),
  langues:     (d, a) => buildLangues(d.langues, a),
  interets:    (d, a) => buildInterets(d.centresInteret, a),
  projets:     (d, a) => buildProjets(d.projets, a),
  kpis:        (d, a) => buildKpis(d.kpis, a),
  portfolio:   (d, a) => buildPortfolio(d.portfolio, a),
  campagnes:   (d, a) => buildCampagnes(d.campagnes, a),
};

// ─── Génération du document ────────────────────────────────────────────────

/**
 * Génère un Blob DOCX à partir de cvData.
 * @param {object} cvData      - structure CV (prenom, nom, experiences, …)
 * @param {object} options
 * @param {string} [options.accentColor='#1539B7']
 * @param {string[]} [options.sectionOrder] - ordre des sections (par défaut auto selon les données)
 * @returns {Promise<Blob>}
 */
export async function generateDocxBlob(cvData = {}, options = {}) {
  const accent = options.accentColor || '#1539B7';

  // Ordre par défaut : tout ce qui existe dans cvData
  // (les builders retournent [] si la donnée est absente, donc safe)
  const order = options.sectionOrder || [
    'experiences', 'projets', 'kpis', 'portfolio', 'campagnes',
    'formations', 'competences', 'langues', 'interets',
  ];

  // En-tête (nom, poste, contacts, accroche)
  const header = [
    pName({ prenom: cvData.prenom, nom: cvData.nom, accent }),
    pPoste(cvData.poste, accent),
    pContacts(cvData),
    pAccroche(cvData.accroche),
  ].filter(Boolean);

  // Sections
  const sections = order.flatMap(id => {
    const builder = SECTION_BUILDERS[id];
    return builder ? builder(cvData, accent) : [];
  });

  // Lettre de motivation : ajoutée à la fin si présente (et pas d'expériences)
  const ldm = [];
  if (cvData.lettreMotivation && !cvData.experiences?.length) {
    ldm.push(pSectionTitle('Lettre de motivation', accent));
    cvData.lettreMotivation.split(/\n\n+/).forEach(p => {
      if (p.trim()) {
        ldm.push(new Paragraph({
          spacing: { after: 200, line: 320 },
          children: [new TextRun({ text: p.trim(), font: FONT, size: 22, color: COL_INK })],
        }));
      }
    });
  }

  const doc = new Document({
    creator: 'TaliaCV',
    title:   `CV ${cvData.prenom || ''} ${cvData.nom || ''}`.trim(),
    description: 'CV généré avec TaliaCV',
    styles: {
      default: {
        document: { run: { font: FONT, size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 900, bottom: 720, left: 900 },
          },
        },
        children: [...header, ...sections, ...ldm],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
