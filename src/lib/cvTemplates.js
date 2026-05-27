import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TemplateClassic, getClassicCSS,
  TemplateMinimal, getMinimalCSS,
  TemplateCompact, getCompactCSS,
  TemplateImpact,  getImpactCSS,
} from '../templates/index.js';
import { PALETTES } from './cvData.js';

// ─── SIDEBAR TEXTURES ────────────────────────────────────────────────────────
// Chaque entrée : { id, label, css, preview, dark }
// css    = valeur CSS background appliquée sur .block-sidebar (null = fond uni)
// preview = gradient CSS court pour la miniature de l'éditeur
// dark   = true si le fond est sombre (sidebar texte blanc)
function _enc(svg) { return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`; }
function _grain(op) {
  return _enc(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter><rect width="200" height="200" filter="url(%23n)" opacity="${op}"/></svg>`);
}
function _diag(col, sp) {
  const s = sp, s2 = sp * 2;
  return _enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${s2}" height="${s2}"><line x1="0" y1="${s2}" x2="${s2}" y2="0" stroke="${col}" stroke-width="1.5"/><line x1="${-s}" y1="${s}" x2="${s}" y2="${-s}" stroke="${col}" stroke-width="1.5"/><line x1="${s}" y1="${s * 3}" x2="${s * 3}" y2="${s}" stroke="${col}" stroke-width="1.5"/></svg>`);
}
function _grid(col, sz) {
  return _enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}"><path d="M ${sz} 0 L 0 0 0 ${sz}" fill="none" stroke="${col}" stroke-width="0.8"/></svg>`);
}
function _wave(col) {
  return _enc(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M0 15 Q25 0 50 15 Q75 30 100 15" fill="none" stroke="${col}" stroke-width="1.5"/></svg>`);
}

// Helper : URL Unsplash dimensionnée pour la sidebar (portrait crop)
function _usp(id) { return `/img-proxy/photo-${id}?w=420&h=1200&q=80&auto=format&fit=crop`; }

export const SIDEBAR_TEXTURES = [
  // ── Aucune texture ────────────────────────────────────────────────────────
  { id:'none', label:'Uni', css:null, photo:null, preview:null, dark:true,
    colors:['#1a3a5c','#1e3a2e','#4a1264','#6b1a1a','#3a4520','#9b5f00'] },

  // ── Olive – feuillage sombre, teintes kaki ────────────────────────────────
  { id:'olive', label:'Olive', dark:true, photo:null,
    preview: 'radial-gradient(ellipse at 30% 20%,#5e6e4a 0%,#3a4530 55%,#1e2618 100%)',
    css: `${_grain(0.18)},radial-gradient(ellipse at 30% 20%,#5e6e4a 0%,#3a4530 55%,#1e2618 100%)`,
    colors:['#2d4a1a','#4a6020','#1a3a5c','#6b5000','#4a1a60','#6b3010'] },

  // ── Steel – acier brossé, bleu nuit industriel ────────────────────────────
  { id:'steel', label:'Steel', dark:true, photo:null,
    preview: 'linear-gradient(160deg,#2e4a62 0%,#18304a 55%,#0a1826 100%)',
    css: `${_diag('rgba(255,255,255,0.07)',14)},linear-gradient(160deg,#2e4a62 0%,#18304a 55%,#0a1826 100%)`,
    colors:['#1a3a5c','#18304a','#0a2048','#1e3870','#204060','#2a4060'] },

  // ── Archi – béton clair, grille architecturale ───────────────────────────
  { id:'archi', label:'Archi', dark:false, photo:null,
    preview: 'linear-gradient(155deg,#eae8e2 0%,#d6d4ce 50%,#c0beb8 100%)',
    css: `${_grid('rgba(0,0,0,0.07)',18)},linear-gradient(155deg,#eae8e2 0%,#d6d4ce 50%,#c0beb8 100%)`,
    colors:['#1a3a5c','#8b4010','#2d5a27','#5a2060','#404040','#6b3a1a'] },

  // ── Sable – chaud, sable fin, lumière dorée ───────────────────────────────
  { id:'sable', label:'Sable', dark:false, photo:null,
    preview: 'radial-gradient(ellipse at 60% 25%,#dcc8a0 0%,#c8a870 50%,#a88048 100%)',
    css: `${_grain(0.12)},radial-gradient(ellipse at 60% 25%,#dcc8a0 0%,#c8a870 50%,#a88048 100%)`,
    colors:['#8b4010','#7a5020','#2d5a27','#1a3a5c','#6b2040','#4a3010'] },

  // ── Brume – atmosphère brumeuse, bleu ardoise profond ─────────────────────
  { id:'brume', label:'Brume', dark:true, photo:null,
    preview: 'radial-gradient(ellipse at 30% 30%,#4a6fa0 0%,#283d60 55%,#111e38 100%)',
    css: `${_grain(0.10)},radial-gradient(ellipse at 30% 30%,#4a6fa0 0%,#283d60 55%,#111e38 100%)`,
    colors:['#283d60','#1a3a5c','#1a4460','#2d5a27','#5a2060','#6b1a1a'] },

  // ── Marine – océan nuit, navy profond ─────────────────────────────────────
  { id:'marine', label:'Marine', dark:true, photo:null,
    preview: 'linear-gradient(175deg,#102850 0%,#091a36 55%,#040e1e 100%)',
    css: `${_grain(0.14)},${_wave('rgba(255,255,255,0.04)')},linear-gradient(175deg,#102850 0%,#091a36 55%,#040e1e 100%)`,
    colors:['#102850','#091a36','#0a2048','#0a1e38','#1a2850','#14203c'] },

  // ── Vague – teal profond, mouvement aquatique ─────────────────────────────
  { id:'vague', label:'Vague', dark:true, photo:null,
    preview: 'radial-gradient(ellipse at 20% 50%,#0d7878 0%,#054848 55%,#022828 100%)',
    css: `${_wave('rgba(255,255,255,0.07)')},radial-gradient(ellipse at 20% 50%,#0d7878 0%,#054848 55%,#022828 100%)`,
    colors:['#054848','#0a4040','#084838','#1a3a5c','#0a3848','#063838'] },

  // ── Nude – crème organique, pierre chaude ─────────────────────────────────
  { id:'nude', label:'Nude', dark:false, photo:null,
    preview: 'radial-gradient(ellipse at 50% 20%,#ecd8c8 0%,#d0b8a8 50%,#b09888 100%)',
    css: `${_grain(0.10)},radial-gradient(ellipse at 50% 20%,#ecd8c8 0%,#d0b8a8 50%,#b09888 100%)`,
    colors:['#8b4010','#7a5020','#1a3a5c','#2d5a27','#6b2040','#5a3010'] },

  // ── Cobalt – bleu électrique, halo lumineux ───────────────────────────────
  { id:'cobalt', label:'Cobalt', dark:true, photo:null,
    preview: 'radial-gradient(ellipse at 40% 20%,#2050d0 0%,#0d1880 50%,#04063a 100%)',
    css: `${_grain(0.10)},radial-gradient(ellipse at 40% 20%,#2050d0 0%,#0d1880 50%,#04063a 100%)`,
    colors:['#0d1880','#1a2070','#2040a0','#0a1060','#081460','#1030c0'] },

  // ── Taupe Arc – beige chaud, vagues en relief ─────────────────────────────
  { id:'taupe-arc', label:'Arc Taupe', dark:false, photo:null,
    preview: 'radial-gradient(ellipse at 50% 0%,#d8c8b0 0%,#b89878 45%,#7a6448 100%)',
    css: `${_wave('rgba(0,0,0,0.06)')},radial-gradient(ellipse at 50% 0%,#d8c8b0 0%,#b89878 45%,#7a6448 100%)`,
    colors:['#6b3a1a','#5a3010','#2d5a27','#1a3a5c','#6b2040','#404030'] },

  // ── Crystal – bleu-argent, facettes glacées ───────────────────────────────
  { id:'crystal', label:'Crystal', dark:false, photo:null,
    preview: 'linear-gradient(135deg,#d8ecf8 0%,#a0c0d8 50%,#6888a8 100%)',
    css: `${_grain(0.07)},${_diag('rgba(255,255,255,0.12)',10)},linear-gradient(135deg,#d8ecf8 0%,#a0c0d8 50%,#6888a8 100%)`,
    colors:['#1a3a5c','#204080','#2d5a27','#6b2030','#204838','#404080'] },

  // ── Forest – vert profond, sous-bois mystérieux ───────────────────────────
  { id:'forest', label:'Forest', dark:true, photo:null,
    preview: 'radial-gradient(ellipse at 40% 20%,#2a6030 0%,#143818 55%,#081c0a 100%)',
    css: `${_grain(0.12)},radial-gradient(ellipse at 40% 20%,#2a6030 0%,#143818 55%,#081c0a 100%)`,
    colors:['#143818','#1e4820','#0a2810','#2d5a27','#3a5020','#1a3a5c'] },

  // ── Arc Gris – gris perle, courbes concentriques ──────────────────────────
  { id:'minimal-arc', label:'Arc Gris', dark:false, photo:null,
    preview: 'radial-gradient(ellipse at 50% -20%,#c8c8d0 0%,#909098 50%,#585860 100%)',
    css: `${_wave('rgba(255,255,255,0.10)')},radial-gradient(ellipse at 50% -20%,#c8c8d0 0%,#909098 50%,#585860 100%)`,
    colors:['#1a3a5c','#404080','#6b4020','#204838','#6b2040','#303030'] },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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
  };
  const masc = {};
  Object.entries(fem).forEach(([m, f]) => { masc[f] = m; });
  if (g==='F') return fem[p]||p;
  if (g==='M') return masc[p]||p;
  return p;
}

// ─── PLACEHOLDERS ─────────────────────────────────────────────────────────────
export const PHOTO_PLACEHOLDER = `<div class="photo-placeholder-wrap"><div class="photo-placeholder-inner"><span>👤</span><p>Photo</p></div></div>`;

// ─── TEMPLATES REGISTRY ───────────────────────────────────────────────────────
export const TEMPLATES = [
  { id: 'classic', label: 'Classique',   desc: 'Sidebar gauche sombre' },
  { id: 'minimal', label: 'Minimaliste', desc: 'Épuré, typographie seule' },
  { id: 'compact', label: 'Colonne',     desc: 'Photo + une colonne' },
  { id: 'impact',  label: 'Impact',      desc: 'Sidebar droite, badges pills' },
];

// ─── RENDER COMPLETE CV HTML ──────────────────────────────────────────────────
// sidebarTexture : objet SIDEBAR_TEXTURES (ou null) pour le fond de la sidebar
export function renderCVFromData(d, palette, sectionOrder, templateId, sidebarOrder, sidebarTexture) {
  const p = palette || PALETTES[0];
  const c = p.c || '#1a3a5c';

  // Fond sidebar : texture si sélectionnée, sinon couleur palette
  const sbBg = (sidebarTexture && sidebarTexture.css) ? sidebarTexture.css : c;
  const overlayStyle = ''; // plus d'overlay couleur

  switch (templateId) {
    case 'minimal': {
      const css  = getMinimalCSS({
        c,
        sbBg,
        sbTitleColor: p.sbTitleColor || 'rgba(255,255,255,0.65)',
        sbTextColor:  p.sbTextColor  || 'rgba(255,255,255,0.88)',
      });
      const body = renderToStaticMarkup(
        React.createElement(TemplateMinimal, {
          data:         d,
          palette:      p,
          sectionOrder: sectionOrder || ['experiences', 'formations'],
          sidebarOrder: sidebarOrder || ['langues', 'interets'],
          sbBg,
          overlayStyle,
        })
      );
      return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>${css}</style></head><body>${body}</body></html>`;
    }
    case 'compact': {
      const css  = getCompactCSS({
        c,
        d:    p.d || '#0e2a44',
        sbBg,
      });
      const body = renderToStaticMarkup(
        React.createElement(TemplateCompact, {
          data:         d,
          palette:      p,
          sectionOrder: sectionOrder || ['experiences', 'formations'],
          sidebarOrder: sidebarOrder || [],
          sbBg,
          overlayStyle,
        })
      );
      return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>${css}</style></head><body>${body}</body></html>`;
    }
    case 'impact': {
      const css = getImpactCSS({
        c,
        d:   p.d || '#0e2a44',
        sbBg: p.c || c,
      });
      const body = renderToStaticMarkup(
        React.createElement(TemplateImpact, {
          data:         d,
          palette:      p,
          sectionOrder: sectionOrder || ['experiences', 'formations'],
          sidebarOrder: sidebarOrder || ['competences', 'langues', 'interets'],
        })
      );
      return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>${css}</style></head><body>${body}</body></html>`;
    }
    default: {
      // classic — rendu via composant React (renderToStaticMarkup)
      const css = getClassicCSS({
        c,
        d:            p.d  || '#0e2a44',
        sbBg,
        sbTitleColor: p.sbTitleColor || '#FFCC00',
        sbTextColor:  p.sbTextColor  || 'rgba(255,255,255,0.88)',
      });
      const body = renderToStaticMarkup(
        React.createElement(TemplateClassic, {
          data:         d,
          palette:      p,
          sectionOrder: sectionOrder || ['experiences', 'formations'],
          sidebarOrder: sidebarOrder || ['competences', 'langues', 'interets'],
          sbBg,
          overlayStyle,
        })
      );
      return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>${css}</style></head><body>${body}</body></html>`;
    }
  }
}
