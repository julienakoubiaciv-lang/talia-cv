/**
 * TemplateImpact — Template CV "Impact"
 *
 * Design : sidebar droite claire, compétences en badges/pills,
 * barre de couleur fine en haut, typographie Plus Jakarta Sans.
 * Cible : profils tech, créatifs, startups.
 *
 * CSS exporté séparément (getImpactCSS) → injecté dans <head> par cvData.js.
 */

import React from 'react';
import { ageLabel } from './shared/cvHelpers.js';
import {
  ProjetsSection,
  KpisSection,
  PortfolioSection,
  CampagnesSection,
  getSectorSectionsCSS,
} from './shared/sectorSections.jsx';

// ─── CSS ─────────────────────────────────────────────────────────────────────
export function getImpactCSS({ c, d, sbBg }) {
  // couleur d'accent très légère pour les fonds de pills
  const cAlpha = `${c}18`;
  return getSectorSectionsCSS({ accent: c }) + `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#fff;color:#1a1a1a;}
@media print{.cv-wrap{width:794px!important;}@page{size:A4 portrait;margin:0;}}

/* ── Wrap ── */
.cv-wrap{width:794px;min-height:1122px;display:flex;flex-direction:column;background:#fff;position:relative;}

/* ── Barre de couleur haut ── */
.cv-topbar{height:6px;background:${c};width:100%;flex-shrink:0;}

/* ── Header ── */
.cv-header{padding:22px 28px 16px 28px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #ECEDF1;flex-shrink:0;}
.cv-header-left{flex:1;min-width:0;}
.cv-prenom{font-size:13px;font-weight:500;color:#6B7280;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px;}
.cv-nom{font-size:28px;font-weight:800;color:#0B1020;letter-spacing:-0.3px;line-height:1;margin-bottom:8px;}
.cv-poste-tag{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;background:${cAlpha};color:${c};font-size:10.5px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;}
.cv-poste-dot{width:5px;height:5px;border-radius:50%;background:${c};flex-shrink:0;}
.cv-header-right{margin-left:24px;flex-shrink:0;text-align:right;}
.cv-contact-item{font-size:9.5px;color:#6B7280;font-weight:500;line-height:1.8;display:flex;align-items:center;justify-content:flex-end;gap:5px;}
.cv-contact-icon{color:${c};font-size:10px;}

/* ── Corps (main + sidebar) ── */
.cv-body{display:flex;flex:1;overflow:hidden;}

/* ── Colonne principale (gauche, 68%) ── */
.cv-main{flex:1;padding:18px 20px 16px 28px;min-width:0;}

/* ── Accroche ── */
.cv-accroche-wrap{margin-bottom:16px;}
.cv-accroche{font-size:11px;color:#374151;line-height:1.65;font-weight:400;}
.cv-accroche-bar{width:28px;height:3px;background:${c};border-radius:2px;margin-bottom:8px;}

/* ── Sections main ── */
.section-block{margin-bottom:14px;}
.section-title{display:flex;align-items:center;gap:8px;margin-bottom:9px;}
.section-title-text{font-size:10px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap;}
.section-title-line{flex:1;height:1px;background:#ECEDF1;}

/* ── Expériences ── */
.exp-block{margin-bottom:10px;padding-left:10px;border-left:2px solid ${cAlpha};}
.exp-block:last-child{margin-bottom:0;}
.exp-header{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:2px;}
.exp-poste{font-size:11.5px;font-weight:700;color:#0B1020;letter-spacing:0.01em;}
.exp-periode{font-size:9.5px;color:#9AA0AE;font-weight:500;white-space:nowrap;flex-shrink:0;}
.exp-meta{font-size:10px;color:#6B7280;margin-bottom:4px;font-weight:500;}
.exp-missions{list-style:none;padding:0;}
.exp-missions li{font-size:10.5px;color:#374151;padding:1.5px 0 1.5px 12px;position:relative;line-height:1.45;}
.exp-missions li::before{content:'';position:absolute;left:0;top:8px;width:4px;height:4px;border-radius:50%;background:${c};flex-shrink:0;}

/* ── Formations ── */
.form-block{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #F3F4F6;}
.form-block:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
.form-dot{width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0;margin-top:4px;}
.form-dot.talia{background:${c};box-shadow:0 0 0 2px ${cAlpha};}
.form-content{flex:1;min-width:0;}
.form-titre{font-size:11px;font-weight:700;color:#0B1020;}
.form-meta{font-size:10px;color:#9AA0AE;font-style:italic;margin-top:1px;}

/* ── Lettre de motivation ── */
.ldm-text{font-size:11px;line-height:1.8;color:#374151;white-space:pre-line;}

/* ── Sidebar droite (32%) ── */
.cv-sidebar{width:220px;flex-shrink:0;background:#F7F8FA;border-left:1px solid #ECEDF1;display:flex;flex-direction:column;padding:18px 14px 14px;}

/* ── Photo dans sidebar ── */
.block-photo{width:100%;margin-bottom:16px;overflow:hidden;border-radius:8px;background:${d};}
.block-photo-inner{width:100%;overflow:hidden;border-radius:8px;}
.block-photo-inner img{display:block;width:100%;height:auto;object-fit:cover;}
.photo-placeholder-wrap{width:100%;height:160px;display:flex;align-items:center;justify-content:center;}
.photo-placeholder-inner{display:flex;flex-direction:column;align-items:center;gap:4px;}
.photo-placeholder-inner span{font-size:28px;opacity:0.3;}
.photo-placeholder-inner p{font-size:9px;color:rgba(0,0,0,0.2);text-align:center;}

/* ── Blocs sidebar ── */
.sb-section{margin-bottom:14px;}
.sb-title{font-size:9px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:7px;display:flex;align-items:center;gap:6px;}
.sb-title::after{content:'';flex:1;height:1px;background:${c};opacity:0.2;}
.sb-item{font-size:10px;color:#374151;line-height:1.7;display:flex;align-items:flex-start;gap:5px;font-weight:400;}
.sb-icon{color:${c};flex-shrink:0;font-size:10px;margin-top:1px;}

/* ── Pills compétences ── */
.pills-wrap{display:flex;flex-wrap:wrap;gap:5px;}
.pill{display:inline-block;padding:3px 9px;border-radius:99px;font-size:9.5px;font-weight:600;background:${cAlpha};color:${c};line-height:1.4;}
.pill.soft{background:#F0FDF4;color:#16A34A;}
.pill.tool{background:#FFF7ED;color:#EA580C;}
.pill.lang{background:#F5F3FF;color:#7C3AED;}

/* ── Logo ── */
.logo-zone{margin-top:auto;padding-top:10px;border-top:1px solid #ECEDF1;display:flex;align-items:center;justify-content:center;min-height:40px;}
.logo-zone img{max-width:80%;max-height:36px;object-fit:contain;display:block;}
.logo-placeholder-text{font-size:7px;color:#C5C8D0;text-align:center;letter-spacing:0.05em;text-transform:uppercase;line-height:1.5;}

/* ── Date de naissance / permis ── */
.sb-info-item{font-size:9.5px;color:#6B7280;display:flex;align-items:center;gap:5px;padding:2px 0;}
`;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div className="section-title">
      <span className="section-title-text">{children}</span>
      <span className="section-title-line" />
    </div>
  );
}

function SbTitle({ children }) {
  return <div className="sb-title">{children}</div>;
}

// ─── Sidebar blocks ───────────────────────────────────────────────────────────
function SbContacts({ data }) {
  const age = data.dateNaissance ? ageLabel(data.dateNaissance) : '';
  return (
    <div className="sb-section">
      <SbTitle>Contact</SbTitle>
      {data.telephone    && <div className="sb-item"><span className="sb-icon">📞</span>{data.telephone}</div>}
      {data.email        && <div className="sb-item"><span className="sb-icon">✉</span>{data.email}</div>}
      {data.adresse      && <div className="sb-item"><span className="sb-icon">📍</span>{data.adresse}</div>}
      {data.linkedin     && <div className="sb-item"><span className="sb-icon">🔗</span>{data.linkedin}</div>}
      {data.dateNaissance && <div className="sb-item"><span className="sb-icon">🎂</span>{data.dateNaissance}{age}</div>}
      {data.permis       && <div className="sb-item"><span className="sb-icon">🚗</span>Permis {data.permis}</div>}
    </div>
  );
}

function SbCompetences({ data }) {
  const { techniques = [], comportementales = [], outils = [] } = data.competences || {};
  if (!techniques.length && !comportementales.length && !outils.length) return null;
  return (
    <div className="sb-section">
      <SbTitle>Compétences</SbTitle>
      {techniques.length > 0 && (
        <div className="pills-wrap" style={{ marginBottom: comportementales.length || outils.length ? 6 : 0 }}>
          {techniques.map((c, i) => (
            <span key={i} className="pill" data-field={`competences.techniques.${i}`}>{c}</span>
          ))}
        </div>
      )}
      {comportementales.length > 0 && (
        <div className="pills-wrap" style={{ marginBottom: outils.length ? 6 : 0 }}>
          {comportementales.map((c, i) => (
            <span key={i} className="pill soft" data-field={`competences.comportementales.${i}`}>{c}</span>
          ))}
        </div>
      )}
      {outils.length > 0 && (
        <div className="pills-wrap">
          {outils.map((c, i) => (
            <span key={i} className="pill tool" data-field={`competences.outils.${i}`}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SbLangues({ data }) {
  if (!data.langues?.length) return null;
  return (
    <div className="sb-section">
      <SbTitle>Langues</SbTitle>
      <div className="pills-wrap">
        {data.langues.map((l, i) => (
          <span key={i} className="pill lang">{l.langue}{l.niveau ? ` · ${l.niveau}` : ''}</span>
        ))}
      </div>
    </div>
  );
}

function SbInterets({ data }) {
  if (!data.centresInteret?.length) return null;
  return (
    <div className="sb-section">
      <SbTitle>Intérêts</SbTitle>
      <div className="pills-wrap">
        {data.centresInteret.map((c, i) => (
          <span key={i} className="pill" style={{ background:'#F1F5F9', color:'#475569' }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main column blocks ───────────────────────────────────────────────────────
function Experiences({ data }) {
  if (!data.experiences?.length) return null;
  return (
    <div className="section-block">
      <SectionTitle>Expériences</SectionTitle>
      {data.experiences.map((exp, i) => (
        <div key={i} className="exp-block">
          <div className="exp-header">
            <span className="exp-poste" data-field={`experiences.${i}.poste`}>{exp.poste}</span>
            {exp.periode && <span className="exp-periode">{exp.periode}</span>}
          </div>
          {(exp.entreprise || exp.lieu) && (
            <div className="exp-meta" data-field={`experiences.${i}.entreprise`}>
              {[exp.entreprise, exp.lieu].filter(Boolean).join(' · ')}
            </div>
          )}
          {exp.missions?.length > 0 && (
            <ul className="exp-missions">
              {exp.missions.map((m, j) => (
                <li key={j} data-field={`experiences.${i}.missions.${j}`}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function Formations({ data }) {
  if (!data.formations?.length) return null;
  return (
    <div className="section-block">
      <SectionTitle>Formations</SectionTitle>
      {data.formations.map((f, i) => (
        <div key={i} className={`form-block${f.isTalia ? ' talia' : ''}`}>
          <div className={`form-dot${f.isTalia ? ' talia' : ''}`} />
          <div className="form-content">
            <div className="form-titre" data-field={`formations.${i}.titre`}>{f.titre}</div>
            <div className="form-meta">
              {[f.etablissement, f.periode].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LettreMotivation({ data }) {
  if (!data.lettreMotivation) return null;
  const exps = data.experiences || [];
  if (exps.length > 0) return null; // n'affiche que si pas d'expérience
  return (
    <div className="section-block">
      <SectionTitle>Lettre de motivation</SectionTitle>
      <p className="ldm-text">{data.lettreMotivation}</p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TemplateImpact({
  data,
  palette,
  sectionOrder = ['experiences', 'formations'],
  sidebarOrder = ['competences', 'langues', 'interets'],
}) {
  const d = data || {};
  const prenom = d.prenom || '';
  const nom    = d.nom    || '';

  // Wrapper pour donner le bon style aux sections sectorielles
  // (le titleClass d'Impact n'est pas .section-title mais inclus dans .section-block)
  const SectorWrap = ({ children }) => (
    <div className="section-block">{children}</div>
  );

  const MAIN_SECTIONS = {
    experiences:        <Experiences key="exp" data={d} />,
    formations:         <Formations  key="form" data={d} />,
    lettreMotivation:   <LettreMotivation key="ldm" data={d} />,
    // Sections sectorielles — wrappées pour cohérence avec le style Impact
    projets:   <SectorWrap key="proj"><ProjetsSection   data={d} /></SectorWrap>,
    kpis:      <SectorWrap key="kpi" ><KpisSection      data={d} /></SectorWrap>,
    portfolio: <SectorWrap key="port"><PortfolioSection data={d} /></SectorWrap>,
    campagnes: <SectorWrap key="camp"><CampagnesSection data={d} /></SectorWrap>,
  };

  const SIDEBAR_SECTIONS = {
    competences: <SbCompetences key="comp" data={d} />,
    langues:     <SbLangues     key="lang" data={d} />,
    interets:    <SbInterets    key="int"  data={d} />,
  };

  return (
    <div className="cv-wrap">
      {/* Barre couleur top */}
      <div className="cv-topbar" />

      {/* Header */}
      <div className="cv-header">
        <div className="cv-header-left">
          {prenom && <div className="cv-prenom" data-field="prenom">{prenom}</div>}
          {nom    && <div className="cv-nom"    data-field="nom"   >{nom}</div>}
          {d.poste && (
            <div className="cv-poste-tag">
              <span className="cv-poste-dot" />
              <span data-field="poste">{d.poste}</span>
            </div>
          )}
        </div>

        {/* Contacts en haut à droite */}
        <div className="cv-header-right">
          {d.telephone    && <div className="cv-contact-item"><span className="cv-contact-icon">📞</span>{d.telephone}</div>}
          {d.email        && <div className="cv-contact-item"><span className="cv-contact-icon">✉</span>{d.email}</div>}
          {d.adresse      && <div className="cv-contact-item"><span className="cv-contact-icon">📍</span>{d.adresse}</div>}
          {d.linkedin     && <div className="cv-contact-item"><span className="cv-contact-icon">🔗</span>{d.linkedin}</div>}
        </div>
      </div>

      {/* Corps */}
      <div className="cv-body">

        {/* Colonne principale gauche */}
        <div className="cv-main">
          {/* Accroche */}
          {d.accroche && (
            <div className="cv-accroche-wrap">
              <div className="cv-accroche-bar" />
              <p className="cv-accroche" data-field="accroche">{d.accroche}</p>
            </div>
          )}

          {/* Sections ordonnées */}
          {sectionOrder.map(key => MAIN_SECTIONS[key] || null)}
        </div>

        {/* Sidebar droite */}
        <div className="cv-sidebar">
          {/* Photo */}
          <div className="block-photo">
            <div className="block-photo-inner">
              <div className="photo-placeholder-wrap">
                <div className="photo-placeholder-inner">
                  <span>👤</span>
                  <p>Photo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts sidebar (âge + permis uniquement) */}
          <SbContacts data={d} />

          {/* Sections ordonnées */}
          {sidebarOrder.map(key => SIDEBAR_SECTIONS[key] || null)}

          {/* Logo Talia */}
          <div className="logo-zone">
            <span className="logo-placeholder-text">Logo{'\n'}Talia</span>
          </div>
        </div>
      </div>
    </div>
  );
}
