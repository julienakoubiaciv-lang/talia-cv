/**
 * TemplateClassic — Template CV 2 colonnes (Classic)
 *
 * Composant React pur, sans dépendances externes.
 * Rendu via renderToStaticMarkup() pour produire la string HTML injectée dans l'iframe.
 *
 * Le CSS est exporté séparément (getClassicCSS) afin d'être injecté dans <head>
 * par cvData.js — cela évite l'échappement HTML du contenu <style> par React SSR
 * (les data-URI SVG contiennent des < > qui seraient cassés sinon).
 *
 * Props :
 *   data         {object}   — cvData normalisé
 *   palette      {object}   — { c, d, sbTitleColor, sbTextColor, ... }
 *   sectionOrder {string[]} — ordre des sections dans le contenu principal
 *   sidebarOrder {string[]} — ordre des blocs dans la sidebar
 *   sbBg         {string}   — couleur/dégradé de fond de la sidebar
 *   overlayStyle {string}   — style CSS de l'overlay texture (peut être vide)
 */

import React from 'react';
import { ageLabel } from './shared/cvHelpers.js';

// ─── CSS (exporté — injecté dans <head> par cvData.js) ───────────────────────
export function getClassicCSS({ c, d, sbBg, sbTitleColor, sbTextColor }) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}

.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:row;background:#fff;}

/* Colonne gauche */
.cv-col-left{width:254px;flex-shrink:0;display:flex;flex-direction:column;}
.block-photo{background:${d};padding:40px 22px 18px;flex-shrink:0;}
.block-photo-inner{width:100%;overflow:hidden;border-radius:3px;}
.photo-placeholder-wrap{width:100%;height:260px;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{width:108px;height:128px;background:rgba(255,255,255,0.07);border:2px dashed rgba(255,255,255,0.22);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;}
.photo-placeholder-inner span{font-size:26px;opacity:0.38;}
.photo-placeholder-inner p{font-size:9px;color:rgba(255,255,255,0.32);text-align:center;line-height:1.4;}

.block-sidebar{flex:1;background:${sbBg};padding:0;color:#fff;display:flex;flex-direction:column;position:relative;overflow:hidden;}
.sb-overlay{position:absolute;inset:0;z-index:0;pointer-events:none;}
.sb-content{flex:1;display:flex;flex-direction:column;padding:16px 16px 14px;position:relative;z-index:1;}
.logo-zone{margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;min-height:44px;}
.logo-zone img{max-width:80%;max-height:44px;object-fit:contain;display:block;}
.logo-placeholder-text{font-size:7.5px;color:rgba(255,255,255,0.28);text-align:center;letter-spacing:0.05em;text-transform:uppercase;line-height:1.5;}

/* Colonne droite */
.cv-col-right{flex:1;display:flex;flex-direction:column;min-width:0;}
.block-presentation{padding:20px 28px 18px;display:flex;flex-direction:column;justify-content:center;word-break:break-word;overflow-wrap:break-word;}
.cv-nom-prenom{font-size:26px;font-weight:800;color:${c};text-transform:uppercase;letter-spacing:0.025em;line-height:1.08;margin-bottom:4px;}
.cv-poste{font-size:13px;font-weight:500;color:${c};letter-spacing:0.04em;margin-bottom:10px;opacity:0.85;}
.cv-accroche{font-size:11px;color:#555;line-height:1.55;word-break:break-word;overflow-wrap:break-word;}

/* Contenu */
.block-main{flex:1;padding:18px 20px 16px 24px;background:#fff;}
.section-title{display:block;width:100%;font-size:11.5px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.07em;border-top:1.5px solid ${c};padding-top:4px;margin-bottom:9px;margin-top:22px;}
.section-title.first{margin-top:0;}
.exp-block{margin-bottom:9px;}
.exp-poste{font-size:11.5px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.02em;}
.exp-meta{font-size:10.5px;color:#6b7280;font-style:italic;margin-bottom:3px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10.5px;color:#333;padding:1px 0 1px 11px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'\\2022';position:absolute;left:0;color:${c};}
.comp-cat-label{font-size:9px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.07em;margin:6px 0 3px;}
.form-block{margin-bottom:7px;}
.form-titre{font-size:11.5px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10.5px;color:#6b7280;font-style:italic;}
.form-talia{margin-bottom:7px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#6b7280;}
.ldm-text{font-size:11px;line-height:1.8;color:#333;white-space:pre-line;}

/* Sidebar */
.sidebar-section{margin-bottom:13px;}
.sidebar-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${sbTitleColor};border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:3px;margin-bottom:7px;}
.sidebar-item{display:flex;align-items:flex-start;gap:5px;margin-bottom:5px;font-size:10.5px;line-height:1.4;color:${sbTextColor};}
.sidebar-icon{flex-shrink:0;width:13px;text-align:center;margin-top:1px;}
.comp-list{list-style:none;padding:0;}
.comp-list li{font-size:10.5px;color:${sbTextColor};padding:2px 0 2px 11px;position:relative;line-height:1.4;}
.comp-list li::before{content:'\\2022';position:absolute;left:0;color:${sbTitleColor};}
.comp-subtitle{font-size:8.5px;font-weight:700;color:${sbTitleColor};text-transform:uppercase;letter-spacing:0.07em;margin:6px 0 3px;}
`;
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function SidebarSection({ title, children }) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-title">{title}</div>
      {children}
    </div>
  );
}

function SidebarContacts({ data }) {
  const age = data.dateNaissance ? ageLabel(data.dateNaissance) : '';
  return (
    <SidebarSection title="COORDONNÉES">
      {data.telephone    && <div className="sidebar-item"><span className="sidebar-icon">📞</span>{data.telephone}</div>}
      {data.email        && <div className="sidebar-item"><span className="sidebar-icon">✉</span>{data.email}</div>}
      {data.adresse      && <div className="sidebar-item"><span className="sidebar-icon">📍</span>{data.adresse}</div>}
      {data.linkedin     && <div className="sidebar-item"><span className="sidebar-icon">🔗</span>{data.linkedin}</div>}
      {data.dateNaissance && <div className="sidebar-item"><span className="sidebar-icon">🎂</span>{data.dateNaissance}{age}</div>}
      {data.permis       && <div className="sidebar-item"><span className="sidebar-icon">🚗</span>Permis {data.permis}</div>}
    </SidebarSection>
  );
}

function SidebarCompetences({ data }) {
  const { techniques = [], comportementales = [], outils = [] } = data.competences || {};
  if (!techniques.length && !comportementales.length && !outils.length) return null;
  return (
    <SidebarSection title="COMPÉTENCES">
      {techniques.length > 0 && <>
        <div className="comp-subtitle">Techniques</div>
        <ul className="comp-list">
          {techniques.map((c, i) => <li key={i} data-field={`competences.techniques.${i}`}>{c}</li>)}
        </ul>
      </>}
      {comportementales.length > 0 && <>
        <div className="comp-subtitle">Comportementales</div>
        <ul className="comp-list">
          {comportementales.map((c, i) => <li key={i} data-field={`competences.comportementales.${i}`}>{c}</li>)}
        </ul>
      </>}
      {outils.length > 0 && <>
        <div className="comp-subtitle">Outils</div>
        <ul className="comp-list">
          {outils.map((c, i) => <li key={i} data-field={`competences.outils.${i}`}>{c}</li>)}
        </ul>
      </>}
    </SidebarSection>
  );
}

function SidebarLangues({ data }) {
  if (!data.langues?.length) return null;
  return (
    <SidebarSection title="LANGUES">
      <ul className="comp-list">
        {data.langues.map((l, i) => (
          <li key={i}>{l.langue}{l.niveau ? ` — ${l.niveau}` : ''}</li>
        ))}
      </ul>
    </SidebarSection>
  );
}

function SidebarInterets({ data }) {
  const items = (data.centresInteret || []).filter(c => c.trim());
  if (!items.length) return null;
  return (
    <SidebarSection title="CENTRES D'INTÉRÊT">
      <ul className="comp-list">
        {items.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
    </SidebarSection>
  );
}

// ─── SECTIONS DU CONTENU PRINCIPAL ───────────────────────────────────────────
function SectionTitle({ children, first }) {
  return (
    <div className={`section-title${first ? ' first' : ''}`}>{children}</div>
  );
}

function ExperiencesSection({ data, first }) {
  if (!data.experiences?.length) {
    if (!data.lettreMotivation) return null;
    return (
      <>
        <SectionTitle first={first}>LETTRE DE MOTIVATION</SectionTitle>
        <div className="ldm-text">{data.lettreMotivation}</div>
      </>
    );
  }
  return (
    <>
      <SectionTitle first={first}>EXPÉRIENCES PROFESSIONNELLES</SectionTitle>
      {data.experiences.map((exp, ei) => (
        <div key={ei} className="exp-block">
          <div className="exp-poste" data-field={`experiences.${ei}.poste`}>{exp.poste}</div>
          <div className="exp-meta">
            {exp.entreprise}
            {exp.lieu    ? ` — ${exp.lieu}`    : ''}
            {exp.periode ? ` · ${exp.periode}` : ''}
          </div>
          {exp.missions?.length > 0 && (
            <ul className="exp-missions">
              {exp.missions.map((m, mi) => (
                <li key={mi} data-field={`experiences.${ei}.missions.${mi}`}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

function FormationsSection({ data, first }) {
  if (!(data.formations?.length)) return null;
  return (
    <>
      <SectionTitle first={first}>FORMATIONS</SectionTitle>
      {data.formations.map((f, fi) =>
        f.isTalia ? (
          <div key={fi} className="form-talia">
            <div className="form-titre" data-field={`formations.${fi}.titre`}>{f.titre}</div>
            <div className="form-meta">
              {f.etablissement || ''}{f.periode ? ` · ${f.periode}` : ''}{' · 1j cours 4j entreprise'}
            </div>
          </div>
        ) : (
          <div key={fi} className="form-block">
            <div className="form-titre" data-field={`formations.${fi}.titre`}>{f.titre}</div>
            <div className="form-meta">
              {f.etablissement || ''}{f.periode ? ` · ${f.periode}` : ''}
            </div>
          </div>
        )
      )}
    </>
  );
}

function CompetencesSection({ data, first }) {
  const { techniques = [], comportementales = [], outils = [] } = data.competences || {};
  if (!techniques.length && !comportementales.length && !outils.length) return null;
  return (
    <>
      <SectionTitle first={first}>COMPÉTENCES</SectionTitle>
      {techniques.length > 0 && <>
        <div className="comp-cat-label">Techniques</div>
        <ul className="exp-missions">
          {techniques.map((c, i) => <li key={i} data-field={`competences.techniques.${i}`}>{c}</li>)}
        </ul>
      </>}
      {comportementales.length > 0 && <>
        <div className="comp-cat-label">Comportementales</div>
        <ul className="exp-missions">
          {comportementales.map((c, i) => <li key={i} data-field={`competences.comportementales.${i}`}>{c}</li>)}
        </ul>
      </>}
      {outils.length > 0 && <>
        <div className="comp-cat-label">Outils</div>
        <ul className="exp-missions">
          {outils.map((c, i) => <li key={i} data-field={`competences.outils.${i}`}>{c}</li>)}
        </ul>
      </>}
    </>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
const SIDEBAR_BLOCKS = {
  competences: SidebarCompetences,
  langues:     SidebarLangues,
  interets:    SidebarInterets,
};

const CONTENT_SECTIONS = {
  experiences:  ExperiencesSection,
  formations:   FormationsSection,
  competences:  CompetencesSection,
};

export default function TemplateClassic({
  data,
  palette      = {},
  sectionOrder = ['experiences', 'formations'],
  sidebarOrder = ['competences', 'langues', 'interets'],
  sbBg,
  overlayStyle = '',
}) {
  const c            = palette.c            || '#1a3a5c';
  const d            = palette.d            || '#0e2a44';
  const sidebarBg    = sbBg                 || palette.c || c;
  const sbTitleColor = palette.sbTitleColor || '#FFCC00';
  const sbTextColor  = palette.sbTextColor  || 'rgba(255,255,255,0.88)';

  // Sections sidebar — on exclut celles déjà dans le contenu principal
  const inMain = sectionOrder;

  // Sections contenu — on garde l'ordre, on filtre les vides + on passe `first`
  // On ne peut pas connaître à l'avance si un composant retourne null,
  // donc on les render tous en passant first=true uniquement au premier non-null.
  // Trick : on passe `firstCandidate` et le composant se déclare "first" en premier.
  let firstAssigned = false;
  const contentItems = sectionOrder
    .map(id => {
      const Section = CONTENT_SECTIONS[id];
      if (!Section) return null;
      const isFirst = !firstAssigned;
      firstAssigned = true;
      return <Section key={id} data={data} first={isFirst} />;
    })
    .filter(Boolean);

  return (
    <div className="cv-wrap">

        {/* ── COLONNE GAUCHE : photo + sidebar ─────────────────────────── */}
        <div className="cv-col-left">

          {/* Photo — injectMedia remplace l'intérieur de .block-photo */}
          <div className="block-photo">
            <div className="photo-placeholder-wrap">
              <div className="photo-placeholder-inner">
                <span>👤</span>
                <p>Photo</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="block-sidebar" data-zone="sidebar">
            <div className="sb-overlay" style={{ background: overlayStyle }} />
            <div className="sb-content">
              <SidebarContacts data={data} />

              {sidebarOrder.map(id => {
                if (id === 'competences' && inMain.includes('competences')) return null;
                const Block = SIDEBAR_BLOCKS[id];
                return Block ? <Block key={id} data={data} /> : null;
              })}

              {/* Logo — injectMedia remplace l'intérieur de .logo-zone */}
              <div className="logo-zone">
                <span className="logo-placeholder-text">Logo<br />Talia</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE : présentation + contenu ──────────────────── */}
        <div className="cv-col-right">

          <div className="block-presentation" data-zone="identite">
            <div className="cv-nom-prenom">{data.prenom} {data.nom}</div>
            <div className="cv-poste"    data-field="poste">{data.poste}</div>
            <div className="cv-accroche" data-field="accroche">{data.accroche}</div>
          </div>

          <div className="block-main" data-zone="contenu">
            {contentItems}
          </div>

        </div>
    </div>
  );
}
