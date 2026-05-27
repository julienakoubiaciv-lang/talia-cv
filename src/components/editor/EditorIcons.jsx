/**
 * EditorIcons.jsx — icônes SVG inline utilisées dans l'éditeur CV.
 * Toutes exportées comme composants React sans props (taille fixée à 17×17).
 */
import React from 'react';

export const IconCamera   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
export const IconUser     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
export const IconBriefcase= () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
export const IconCap      = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
export const IconSparkle  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
export const IconGlobe    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>;
export const IconHeart    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
export const IconMove     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="17" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1.2" fill="currentColor" stroke="none"/></svg>;

/** Étoiles de notation (1–5), couleur or/gris. */
export function Stars({ value = 5, size = 18 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= value ? '#F5B400' : '#E5E6EC'}
          stroke={i <= value ? '#F5B400' : '#D0D2D8'}
          strokeWidth="1">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

/** En-tête de section du panneau gauche (icône + titre + sous-titre). */
export function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:12,
      marginBottom:20, paddingBottom:16, borderBottom:'1px solid #ECEDF1',
    }}>
      <div style={{
        width:36, height:36, borderRadius:10, background:'#EEF2FF', color:'#1539B7',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        {icon}
      </div>
      <div>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#0B1020', letterSpacing:'-0.5px', lineHeight:1.2 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#9AA0AE', lineHeight:1.4 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
