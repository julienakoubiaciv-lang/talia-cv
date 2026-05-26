/**
 * TemplateMinimal — Template CV "bande header + sidebar arrondie"
 *
 * CSS exporté séparément (getMinimalCSS) → injecté dans <head> par cvData.js.
 * Même règle que TemplateClassic : jamais de <style> JSX pour éviter l'échappement
 * React SSR des data-URI SVG/textures.
 */

import React from 'react';
import { ageLabel } from './shared/cvHelpers.js';

// ─── CSS (exporté — injecté dans <head> par cvData.js) ───────────────────────
export function getMinimalCSS({ c, sbBg, sbTitleColor, sbTextColor }) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Manrope:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:column;background:#fff;position:relative;overflow:hidden;}

/* Logo */
.logo-zone{margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;min-height:44px;}
.logo-zone img{max-width:80%;max-height:44px;object-fit:contain;display:block;}
.logo-placeholder-text{font-size:7px;color:rgba(255,255,255,0.4);text-align:center;letter-spacing:0.05em;text-transform:uppercase;line-height:1.5;}

/* Header band */
.cv-header-band{background:${sbBg};width:100%;padding:28px 40px 24px;display:flex;flex-direction:column;align-items:center;position:relative;overflow:hidden;}
.hd-overlay{position:absolute;inset:0;z-index:0;pointer-events:none;}
.hd-content{position:relative;z-index:1;width:100%;display:flex;flex-direction:column;align-items:center;}
.cv-name-row{display:flex;align-items:center;justify-content:center;gap:18px;position:relative;z-index:1;width:100%;}
.cv-prenom{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.3px;line-height:1.1;text-align:right;flex:1;}
.cv-nom{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.3px;line-height:1.1;text-align:left;flex:1;}

/* Photo circulaire */
.block-photo{width:216px;height:216px;border-radius:50%;overflow:hidden;border:4px solid rgba(255,255,255,0.5);background:rgba(255,255,255,0.12);flex-shrink:0;margin-top:-16px;margin-bottom:-36px;position:relative;z-index:2;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);}
.block-photo-inner{width:100%;height:100%;position:relative;}
.block-photo-inner img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;}
.photo-placeholder-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{display:flex;flex-direction:column;align-items:center;gap:2px;}
.photo-placeholder-inner span{font-size:32px;opacity:0.5;}
.photo-placeholder-inner p{display:none;}

/* Poste + contacts + accroche */
.cv-poste{font-size:10px;font-weight:600;color:rgba(255,255,255,0.85);letter-spacing:0.14em;text-transform:uppercase;margin-top:48px;text-align:center;width:100%;}
.cv-contacts-line{text-align:center;font-size:9.5px;color:${c};font-weight:500;padding:16px 40px 10px;letter-spacing:0.02em;}
.cv-accroche{font-size:11px;color:#555;line-height:1.6;margin:0 40px 28px;padding-left:12px;border-left:2.5px solid ${c};}

/* Corps */
.cv-body{display:flex;flex:1;overflow:hidden;}
.cv-sidebar-light{width:192px;flex-shrink:0;display:flex;flex-direction:column;background:${sbBg};padding:20px 14px 16px 16px;border-radius:0 32px 32px 0;}
.cv-main{flex:1;padding:18px 28px 18px 20px;}

/* Sections */
.section-title{display:block;font-size:9.5px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:7px;margin-top:18px;}
.section-title:first-child{margin-top:0;}
.section-title::after{content:'';display:block;height:1px;background:${c};opacity:0.25;margin-top:4px;}
.exp-block{margin-bottom:8px;}
.exp-poste{font-size:11px;font-weight:700;color:#1a1a1a;}
.exp-meta{font-size:10px;color:#9AA0AE;font-style:italic;margin-bottom:3px;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10px;color:#444;padding:1px 0 1px 10px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'–';position:absolute;left:0;color:${c};}
.comp-cat-label{font-size:9px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.07em;margin:6px 0 3px;}
.form-block{margin-bottom:6px;}
.form-titre{font-size:11px;font-weight:600;color:#1a1a1a;}
.form-meta{font-size:10px;color:#9AA0AE;font-style:italic;}
.form-talia{margin-bottom:6px;display:block;}
.form-talia .form-titre{color:#1a1a1a;font-weight:700;}
.form-talia .form-meta{color:#9AA0AE;}
.ldm-text{font-size:10.5px;line-height:1.7;color:#444;white-space:pre-line;}

/* Sidebar */
.sl-section{margin-bottom:14px;}
.sl-title{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${sbTitleColor};border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:2px;margin-bottom:6px;}
.sl-item{font-size:9.5px;color:${sbTextColor};margin-bottom:3px;line-height:1.5;}
.sl-sub{font-size:8px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.06em;margin:5px 0 2px;}
.sl-list{list-style:none;padding:0;}
.sl-list li{font-size:9.5px;color:${sbTextColor};padding:1px 0 1px 8px;position:relative;line-height:1.4;}
.sl-list li::before{content:'–';position:absolute;left:0;color:${sbTitleColor};}
.sl-lang-lvl{font-size:8.5px;color:rgba(255,255,255,0.6);}
`;
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function SlSection({ title, children }) {
  return (
    <div className="sl-section">
      <div className="sl-title">{title}</div>
      {children}
    </div>
  );
}

function MinimalSidebarLangues({ data }) {
  if (!data.langues?.length) return null;
  return (
    <SlSection title="LANGUES">
      {data.langues.map((l, i) => (
        <div key={i} className="sl-item">
          {l.langue}
          {l.niveau && <span className="sl-lang-lvl"> — {l.niveau}</span>}
        </div>
      ))}
    </SlSection>
  );
}

function MinimalSidebarInterets({ data }) {
  const items = (data.centresInteret || []).filter(c => c.trim());
  if (!items.length) return null;
  return (
    <SlSection title="INTÉRÊTS">
      <ul className="sl-list">
        {items.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
    </SlSection>
  );
}

// ─── CONTENU PRINCIPAL ────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

function ExperiencesSection({ data }) {
  if (!data.experiences?.length) {
    if (!data.lettreMotivation) return null;
    return (
      <>
        <SectionTitle>LETTRE DE MOTIVATION</SectionTitle>
        <div className="ldm-text">{data.lettreMotivation}</div>
      </>
    );
  }
  return (
    <>
      <SectionTitle>EXPÉRIENCES PROFESSIONNELLES</SectionTitle>
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
      <SectionTitle>FORMATIONS</SectionTitle>
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

function CompetencesSection({ data }) {
  const { techniques = [], comportementales = [], outils = [] } = data.competences || {};
  if (!techniques.length && !comportementales.length && !outils.length) return null;
  return (
    <>
      <SectionTitle>COMPÉTENCES</SectionTitle>
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

const SIDEBAR_BLOCKS = {
  langues:  MinimalSidebarLangues,
  interets: MinimalSidebarInterets,
};

const CONTENT_SECTIONS = {
  experiences:  ExperiencesSection,
  formations:   FormationsSection,
  competences:  CompetencesSection,
};

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function TemplateMinimal({
  data,
  palette      = {},
  sectionOrder = ['experiences', 'formations'],
  sidebarOrder = ['langues', 'interets'],
  sbBg,
  overlayStyle = '',
}) {
  const c           = palette.c           || '#1a3a5c';
  const sidebarBg   = sbBg                || c;

  // Compétences toujours dans le contenu principal pour ce template
  const minSectionOrder = sectionOrder.includes('competences')
    ? sectionOrder
    : [...sectionOrder, 'competences'];

  const contactParts = [];
  if (data.telephone) contactParts.push(data.telephone);
  if (data.email)     contactParts.push(data.email);
  if (data.adresse)   contactParts.push(data.adresse);

  return (
    <div className="cv-wrap">

      {/* ── Bande header colorée ───────────────────────────────────────── */}
      <div className="cv-header-band" data-zone="identite">
        {overlayStyle && <div className="hd-overlay" style={{ background: overlayStyle }} />}
        <div className="hd-content">
          <div className="cv-name-row">
            <span className="cv-prenom" data-field="prenom">{data.prenom || ''}</span>
            {/* Photo — injectMedia remplace l'intérieur de .block-photo */}
            <div className="block-photo">
              <div className="photo-placeholder-wrap">
                <div className="photo-placeholder-inner">
                  <span>👤</span>
                </div>
              </div>
            </div>
            <span className="cv-nom" data-field="nom">{data.nom || ''}</span>
          </div>
          <div className="cv-poste" data-field="poste">{data.poste || ''}</div>
        </div>
      </div>

      {/* ── Contacts ──────────────────────────────────────────────────── */}
      {contactParts.length > 0 && (
        <div className="cv-contacts-line">
          {contactParts.join(' · ')}
        </div>
      )}

      {/* ── Accroche ──────────────────────────────────────────────────── */}
      {data.accroche && (
        <div className="cv-accroche" data-field="accroche">{data.accroche}</div>
      )}

      {/* ── Corps ─────────────────────────────────────────────────────── */}
      <div className="cv-body">

        {/* Sidebar gauche */}
        <div className="cv-sidebar-light" data-zone="sidebar">
          {sidebarOrder.map(id => {
            const Block = SIDEBAR_BLOCKS[id];
            return Block ? <Block key={id} data={data} /> : null;
          })}
          {/* Logo — injectMedia remplace l'intérieur de .logo-zone */}
          <div className="logo-zone">
            <span className="logo-placeholder-text">Logo<br />Talia</span>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="cv-main" data-zone="contenu">
          {minSectionOrder.map(id => {
            const Section = CONTENT_SECTIONS[id];
            return Section ? <Section key={id} data={data} /> : null;
          })}
        </div>

      </div>
    </div>
  );
}
