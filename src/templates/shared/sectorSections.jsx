/**
 * sectorSections — Sections spécialisées par secteur (Tech / Commercial / Création / Marketing)
 *
 * Composants React purs, sans <style> embarqué. Le CSS est ajouté
 * via getSectorSectionsCSS() à concaténer dans le CSS du template parent.
 *
 * Chaque section :
 *   - retourne null si les données sont absentes
 *   - utilise les classes CSS du template parent quand possible (.section-title, .exp-missions)
 *   - ajoute son propre style via classes .sect-* préfixées
 *
 * Sections fournies :
 *   ProjetsSection    (Tech)
 *   KpisSection       (Commercial)
 *   PortfolioSection  (Création)
 *   CampagnesSection  (Marketing)
 */
import React from 'react';

// ─── CSS partagé (à concaténer au getXxxCSS de chaque template) ──────────────
export function getSectorSectionsCSS({ accent = '#1539B7' } = {}) {
  return `
/* ── Sections sectorielles ───────────────────────────────────────────────── */
.sect-projets-item, .sect-kpi-item, .sect-portfolio-item, .sect-campagne-item {
  margin-bottom: 9px;
}
.sect-projets-titre, .sect-portfolio-titre, .sect-campagne-titre {
  font-size: 11.5px; font-weight: 700; color: #1a1a1a;
  text-transform: uppercase; letter-spacing: 0.02em;
}
.sect-projets-stack {
  font-size: 10px; color: ${accent}; font-style: italic;
  margin-top: 2px; line-height: 1.4;
}
.sect-projets-desc, .sect-portfolio-desc, .sect-campagne-meta {
  font-size: 10.5px; color: #333; line-height: 1.5; margin-top: 2px;
}
.sect-projets-link, .sect-portfolio-link {
  font-size: 10px; color: ${accent}; text-decoration: none;
  margin-top: 2px; display: inline-block;
}
/* KPIs — grille de cartes chiffrées */
.sect-kpi-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 7px; margin-top: 4px;
}
.sect-kpi-card {
  background: #fafafa; border-left: 3px solid ${accent};
  padding: 7px 9px; border-radius: 3px;
}
.sect-kpi-value {
  font-size: 17px; font-weight: 800; color: ${accent};
  line-height: 1; letter-spacing: -0.5px;
}
.sect-kpi-label {
  font-size: 9.5px; font-weight: 600; color: #555;
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-top: 3px;
}
.sect-kpi-context {
  font-size: 9.5px; color: #777; margin-top: 2px; font-style: italic;
}
.sect-campagne-meta {
  font-size: 10.5px; color: #6b7280; font-style: italic; margin-bottom: 3px;
}
.sect-campagne-resultat {
  font-size: 10.5px; font-weight: 700; color: ${accent}; margin-top: 3px;
}
.sect-campagne-outils {
  font-size: 9.5px; color: #555; margin-top: 2px;
}
`;
}

// ─── Helper : titre de section avec classe du parent ─────────────────────────
function Title({ children, first, titleClass = 'section-title' }) {
  return (
    <div className={`${titleClass}${first ? ' first' : ''}`}>{children}</div>
  );
}

// ─── PROJETS (Tech) ──────────────────────────────────────────────────────────
export function ProjetsSection({ data, first, titleClass }) {
  const projets = data.projets || [];
  if (!projets.length) return null;
  return (
    <>
      <Title first={first} titleClass={titleClass}>PROJETS</Title>
      {projets.map((p, i) => (
        <div key={i} className="sect-projets-item">
          <div className="sect-projets-titre" data-field={`projets.${i}.nom`}>
            {p.nom || 'Projet sans nom'}
            {p.role ? <span style={{ fontWeight: 400, fontSize: 10.5, color: '#6b7280' }}> — {p.role}</span> : null}
          </div>
          {p.description && (
            <div className="sect-projets-desc" data-field={`projets.${i}.description`}>{p.description}</div>
          )}
          {Array.isArray(p.stack) && p.stack.length > 0 && (
            <div className="sect-projets-stack">⚙ {p.stack.join(' · ')}</div>
          )}
          {p.url && (
            <a href={p.url} className="sect-projets-link" target="_blank" rel="noopener noreferrer">
              🔗 {p.url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      ))}
    </>
  );
}

// ─── KPIs (Commercial) ───────────────────────────────────────────────────────
export function KpisSection({ data, first, titleClass }) {
  const kpis = data.kpis || [];
  if (!kpis.length) return null;
  return (
    <>
      <Title first={first} titleClass={titleClass}>RÉSULTATS CLÉS</Title>
      <div className="sect-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="sect-kpi-card">
            <div className="sect-kpi-value" data-field={`kpis.${i}.value`}>{k.value || '—'}</div>
            <div className="sect-kpi-label" data-field={`kpis.${i}.label`}>{k.label || 'Indicateur'}</div>
            {k.context && (
              <div className="sect-kpi-context" data-field={`kpis.${i}.context`}>{k.context}</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── PORTFOLIO (Création) ────────────────────────────────────────────────────
export function PortfolioSection({ data, first, titleClass }) {
  const portfolio = data.portfolio || [];
  if (!portfolio.length) return null;
  return (
    <>
      <Title first={first} titleClass={titleClass}>PORTFOLIO</Title>
      {portfolio.map((p, i) => (
        <div key={i} className="sect-portfolio-item">
          <div className="sect-portfolio-titre" data-field={`portfolio.${i}.titre`}>
            {p.titre || 'Réalisation'}
            {p.support ? <span style={{ fontWeight: 400, fontSize: 10.5, color: '#6b7280' }}> — {p.support}</span> : null}
          </div>
          {p.description && (
            <div className="sect-portfolio-desc" data-field={`portfolio.${i}.description`}>{p.description}</div>
          )}
          {p.url && (
            <a href={p.url} className="sect-portfolio-link" target="_blank" rel="noopener noreferrer">
              🔗 {p.url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      ))}
    </>
  );
}

// ─── CAMPAGNES (Marketing) ───────────────────────────────────────────────────
export function CampagnesSection({ data, first, titleClass }) {
  const campagnes = data.campagnes || [];
  if (!campagnes.length) return null;
  return (
    <>
      <Title first={first} titleClass={titleClass}>CAMPAGNES & RÉSULTATS</Title>
      {campagnes.map((c, i) => (
        <div key={i} className="sect-campagne-item">
          <div className="sect-campagne-titre" data-field={`campagnes.${i}.nom`}>{c.nom || 'Campagne'}</div>
          {c.canal && (
            <div className="sect-campagne-meta">Canal : {c.canal}</div>
          )}
          {c.resultat && (
            <div className="sect-campagne-resultat" data-field={`campagnes.${i}.resultat`}>📊 {c.resultat}</div>
          )}
          {Array.isArray(c.outils) && c.outils.length > 0 && (
            <div className="sect-campagne-outils">🛠 {c.outils.join(' · ')}</div>
          )}
        </div>
      ))}
    </>
  );
}

/** Map ID section → composant. À fusionner avec CONTENT_SECTIONS de chaque template. */
export const SECTOR_CONTENT_SECTIONS = {
  projets:   ProjetsSection,
  kpis:      KpisSection,
  portfolio: PortfolioSection,
  campagnes: CampagnesSection,
};
