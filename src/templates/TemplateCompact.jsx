/**
 * TemplateCompact — Template CV "colonne unique" (photo + header, barre contacts, corps)
 *
 * CSS exporté séparément (getCompactCSS) → injecté dans <head> par cvData.js.
 * Même règle que les autres templates : jamais de <style> JSX.
 */

import React from 'react';
import { ageLabel } from './shared/cvHelpers.js';
import { SECTOR_CONTENT_SECTIONS, getSectorSectionsCSS } from './shared/sectorSections.jsx';

// ─── CSS (exporté — injecté dans <head> par cvData.js) ───────────────────────
export function getCompactCSS({ c, d, sbBg }) {
  return getSectorSectionsCSS({ accent: c }) + `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:column;background:#fff;}

/* Header */
.cv-header{padding:20px 28px 16px;display:flex;align-items:flex-start;gap:24px;flex-shrink:0;}
.block-photo{width:200px;flex-shrink:0;overflow:hidden;border-radius:3px;background:${d};}
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

/* Barre contacts */
.cv-contacts-bar{background:${sbBg};padding:9px 32px;color:rgba(255,255,255,0.88);font-size:9.5px;line-height:1.4;flex-shrink:0;letter-spacing:0.01em;position:relative;overflow:hidden;}
.cb-overlay{position:absolute;inset:0;z-index:0;pointer-events:none;}
.cb-content{position:relative;z-index:1;display:flex;align-items:center;gap:14px;}
.contacts-label{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#fff;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.3);padding-right:14px;white-space:nowrap;}

/* Corps */
.cv-body{flex:1;padding:14px 32px 24px;}
.logo-zone{display:none;}

/* Sections */
.section-title{display:block;width:100%;font-size:10.5px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid ${c};padding-bottom:3px;margin-bottom:8px;margin-top:18px;}
.section-title:first-child{margin-top:0;}

/* Listes à puces colonnes */
.lin-cols{display:flex;gap:0 28px;align-items:flex-start;}
.lin-list{list-style:none;padding:0;margin:0;}
.lin-list li{font-size:10px;color:#333;padding:1.5px 0 1.5px 11px;position:relative;line-height:1.45;}
.lin-list li::before{content:'\\2022';position:absolute;left:0;color:${c};}

/* Compétences côte à côte */
.comp-row{display:flex;gap:0 36px;align-items:flex-start;margin-bottom:16px;justify-content:space-evenly;}
.comp-cat{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${c};margin-bottom:4px;}

/* Langues */
.lang-row{display:flex;flex-wrap:wrap;gap:6px 18px;margin-bottom:4px;}
.lang-item{font-size:10px;color:#333;}
.lang-name{color:${c};font-weight:700;}
.lang-lvl{color:#6b7280;}

/* Expériences & formations */
.exp-block{margin-bottom:9px;}
.exp-poste{font-size:11px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.02em;}
.exp-meta{font-size:10px;color:#6b7280;font-style:italic;margin-bottom:3px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10px;color:#333;padding:1px 0 1px 11px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'\\2022';position:absolute;left:0;color:${c};}
.comp-cat-label{font-size:9px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.07em;margin:6px 0 3px;}
.form-block{margin-bottom:7px;}
.form-titre{font-size:11px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10px;color:#6b7280;font-style:italic;}
.form-talia{margin-bottom:7px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#6b7280;}
.ldm-text{font-size:10.5px;line-height:1.7;color:#333;white-space:pre-line;}
`;
}

// ─── HELPER : liste en colonnes de max 4 items ────────────────────────────────
function ListInCols({ items }) {
  if (!items.length) return null;
  const MAX = 4;
  const numCols = Math.ceil(items.length / MAX);
  if (numCols === 1) {
    return (
      <ul className="lin-list">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    );
  }
  const cols = [];
  for (let col = 0; col < numCols; col++) {
    cols.push(items.slice(col * MAX, (col + 1) * MAX));
  }
  return (
    <div className="lin-cols">
      {cols.map((chunk, ci) => (
        <ul key={ci} className="lin-list">
          {chunk.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      ))}
    </div>
  );
}

// ─── SECTIONS CONTENU ────────────────────────────────────────────────────────
function CompetencesBlock({ data }) {
  const { techniques = [], comportementales = [], outils = [] } = data.competences || {};
  if (!techniques.length && !comportementales.length && !outils.length) return null;
  return (
    <>
      <div className="section-title" style={{ marginTop: 0 }}>COMPÉTENCES</div>
      <div className="comp-row">
        {techniques.length > 0 && (
          <div className="comp-group">
            <div className="comp-cat">Techniques</div>
            <ListInCols items={techniques} />
          </div>
        )}
        {comportementales.length > 0 && (
          <div className="comp-group">
            <div className="comp-cat">Comportementales</div>
            <ListInCols items={comportementales} />
          </div>
        )}
        {outils.length > 0 && (
          <div className="comp-group">
            <div className="comp-cat">Outils</div>
            <ListInCols items={outils} />
          </div>
        )}
      </div>
    </>
  );
}

function ExperiencesSection({ data }) {
  if (!data.experiences?.length) {
    if (!data.lettreMotivation) return null;
    return (
      <>
        <div className="section-title">LETTRE DE MOTIVATION</div>
        <div className="ldm-text">{data.lettreMotivation}</div>
      </>
    );
  }
  return (
    <>
      <div className="section-title">EXPÉRIENCES PROFESSIONNELLES</div>
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

function FormationsSection({ data }) {
  if (!data.formations?.length) return null;
  return (
    <>
      <div className="section-title">FORMATIONS</div>
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

function LanguesSection({ data }) {
  if (!data.langues?.length) return null;
  return (
    <>
      <div className="section-title">LANGUES</div>
      <div className="lang-row">
        {data.langues.map((l, i) => (
          <span key={i} className="lang-item">
            <b className="lang-name">{l.langue}</b>
            {l.niveau && <span className="lang-lvl"> — {l.niveau}</span>}
          </span>
        ))}
      </div>
    </>
  );
}

function InteretsSection({ data }) {
  const items = (data.centresInteret || []).filter(i => i.trim());
  if (!items.length) return null;
  return (
    <>
      <div className="section-title">CENTRES D'INTÉRÊT</div>
      <ListInCols items={items} />
    </>
  );
}

const CONTENT_SECTIONS = {
  experiences: ExperiencesSection,
  formations:  FormationsSection,
  // Sections sectorielles
  ...SECTOR_CONTENT_SECTIONS,
};

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function TemplateCompact({
  data,
  palette      = {},
  sectionOrder = ['experiences', 'formations'],
  sidebarOrder = [],   // non utilisé dans compact (pas de sidebar)
  sbBg,
  overlayStyle = '',
}) {
  const c         = palette.c || '#1a3a5c';
  const sidebarBg = sbBg      || c;

  const age = data.dateNaissance ? ageLabel(data.dateNaissance) : '';
  const contactParts = [];
  if (data.telephone)     contactParts.push(data.telephone);
  if (data.email)         contactParts.push(data.email);
  if (data.adresse)       contactParts.push(data.adresse);
  if (data.linkedin)      contactParts.push(data.linkedin);
  if (data.dateNaissance) contactParts.push(data.dateNaissance + age);

  return (
    <div className="cv-wrap">

      {/* ── Header : photo gauche + infos droite ─────────────────────── */}
      <div className="cv-header" data-zone="identite">
        {/* Photo — injectMedia remplace l'intérieur de .block-photo */}
        <div className="block-photo">
          <div className="photo-placeholder-wrap">
            <div className="photo-placeholder-inner">
              <span>👤</span>
            </div>
          </div>
        </div>
        <div className="header-info">
          <div className="cv-nom-prenom">{data.prenom || ''} {data.nom || ''}</div>
          <div className="cv-poste" data-field="poste">{data.poste || ''}</div>
          {data.accroche && (
            <div className="cv-accroche" data-field="accroche">{data.accroche}</div>
          )}
        </div>
      </div>

      {/* ── Barre contacts ────────────────────────────────────────────── */}
      {contactParts.length > 0 && (
        <div className="cv-contacts-bar">
          {overlayStyle && <div className="cb-overlay" style={{ background: overlayStyle }} />}
          <div className="cb-content">
            <span className="contacts-label">Coordonnées</span>
            <span>{contactParts.join(' · ')}</span>
          </div>
        </div>
      )}

      {/* ── Corps : colonne unique ────────────────────────────────────── */}
      <div className="cv-body" data-zone="contenu">
        <CompetencesBlock data={data} />
        {sectionOrder.map(id => {
          const Section = CONTENT_SECTIONS[id];
          return Section ? <Section key={id} data={data} /> : null;
        })}
        <LanguesSection data={data} />
        <InteretsSection data={data} />
      </div>

    </div>
  );
}
