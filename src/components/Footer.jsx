/**
 * Footer — pied de page avec liens légaux (RGPD)
 *
 * Affiché en bas du tableau de bord. Liens vers les pages légales obligatoires.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const C = {
  ink:   '#0B1020',
  ink2:  '#3A4156',
  mute:  '#9AA0AE',
  rule:  '#ECEDF1',
  blue:  '#1539B7',
  bg:    '#FFFFFF',
};
const FONT = "'Manrope', system-ui, sans-serif";

const linkStyle = { color: C.ink2, textDecoration: 'none', fontSize: 13, fontWeight: 600 };

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      background: C.bg, borderTop: `1px solid ${C.rule}`,
      padding: '28px 24px', fontFamily: FONT,
    }}>
      <div style={{
        maxWidth: 1180, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: C.ink, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span style={{ fontSize: 13, color: C.mute, fontWeight: 500 }}>
            © {year} Altio CV
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/confidentialite" style={linkStyle}>Confidentialité</Link>
          <Link to="/mentions-legales" style={linkStyle}>Mentions légales</Link>
          <Link to="/cgu" style={linkStyle}>CGU</Link>
        </nav>
      </div>
    </footer>
  );
}
