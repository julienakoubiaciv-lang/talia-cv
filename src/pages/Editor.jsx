import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PALETTES,
  TEMPLATES,
  SIDEBAR_TEXTURES,
  renderCVFromData,
  saveEditorState, loadEditorState, loadBulkSession,
  saveVersion, getVersions, relativeTime,
} from '@/lib/cvData';
import {
  saveHistory, updateHistory, getHistorySync,
} from '@/lib/historySync';
import { uploadMedia } from '@/lib/mediaUpload';
import { getProfiles, buildProfileContext } from '@/lib/profileData';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings.jsx';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useSectionOrder } from '@/hooks/useSectionOrder';
import { useCRMBridge, clearCurrentCandidate } from '@/hooks/useCRMBridge.jsx';
import { useCRMToken } from '@/hooks/useCRMToken';
import { BananaScore } from '@/components/BananaScore';
import { SmartMatcher } from '@/components/SmartMatcher';
import { calcBananaScore, getBananaLevel } from '@/lib/bananaScore';
import { SortableSections } from '@/components/SortableSections';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
}

/* ─── useStateRef ─────────────────────────────────────────────────────────────
   État React + ref synchronisé. Le setter met à jour ref.current de façon
   SYNCHRONE avant le setState, ce qui évite les closures périmées dans les
   callbacks et timeouts (debounce de rendu, etc.) sans recharger l'iframe.
   Retourne [value, setValue, ref]. */
function useStateRef(initial) {
  const [value, setValue] = useState(initial);
  const ref = useRef(value);
  const set = useCallback((next) => {
    ref.current = typeof next === 'function' ? next(ref.current) : next;
    setValue(ref.current);
  }, []);
  return [value, set, ref];
}

/* ─── setByPath ───────────────────────────────────────────────────────────────
   Écrit `value` dans `obj` au chemin pointé "a.b.0.c" (segments numériques =
   index de tableau). Mutation en place sur une copie passée par l'appelant.
   Utilisé pour remonter les éditions inline (data-field) dans cvData/edFields. */
function setByPath(obj, path, value) {
  const keys = String(path).split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

// En dev : Vite proxifie /api/anthropic → https://api.anthropic.com/v1/messages
// En prod : Vercel serverless function api/anthropic.js prend le relais
// La clé n'est plus jamais exposée dans le bundle client côté prod.
const ANTHROPIC_URL = '/api/anthropic';

async function callAnthropicAPI(body, apiKey) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(t); }
  const j = await r.json();
  return j.content?.[0]?.text || '';
}

/* ─── Score tip time estimates ────────────────────────────────────────────── */
const TIP_TIMES = {
  prenom:'10 sec', nom:'10 sec', email:'30 sec', telephone:'30 sec',
  adresse:'1 min', poste:'30 sec', accrocheShort:'3 min', accrocheFull:'5 min',
  linkedin:'30 sec', photo:'2 min', exp1:'10 min', exp2:'8 min',
  expMissions:'5 min', expPeriodes:'2 min', formTalia:'2 min', formExtra:'3 min',
  compTech3:'2 min', compTech6:'3 min', compSoft:'2 min', compOutils:'1 min',
  langues:'1 min', interets:'30 sec',
};

/* ─── Toast ───────────────────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info', duration = 3200) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);
  return { toasts, show };
}
function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: t.type === 'error' ? '#dc2626' : t.type === 'success' ? '#16a34a' : '#1a3a5c',
          color: '#fff', boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
          animation: 'fadeInUp .25s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

/* ─── constants ───────────────────────────────────────────────────────────── */
const CV_W = 794;
const CV_H = 1122;

/* ─── design tokens ───────────────────────────────────────────────────────── */
const C = {
  bluePrimary: '#1539B7',
  blueHover: '#1F4FE0',
  blueSoft: '#EEF2FF',
  navy: '#0B1638',
  navyDeep: '#0F1A40',
  ink: '#0B1020',
  ink2: '#3A4156',
  mute: '#9AA0AE',
  rule: '#ECEDF1',
  bg: '#FFFFFF',
  surface: '#F7F8FA',
  ok: '#1F8A5B',
  okBg: 'rgba(31,138,91,0.10)',
  star: '#F5B400',
};

/* ─── SVG Icon components ─────────────────────────────────────────────────── */
const IconCamera = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IconUser = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconBriefcase = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
const IconCap = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IconSparkle = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconGlobe = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>;
const IconHeart = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const IconMove = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="17" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1.2" fill="currentColor" stroke="none"/></svg>;

/* ─── Stars component ─────────────────────────────────────────────────────── */
function Stars({ value = 5, size = 18 }) {
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

/* ─── SectionHeader component ─────────────────────────────────────────────── */
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:20, paddingBottom:16, borderBottom:`1px solid #ECEDF1` }}>
      <div style={{ width:36, height:36, borderRadius:10, background:'#EEF2FF', color:'#1539B7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#0B1020', letterSpacing:'-0.5px', lineHeight:1.2 }}>{title}</h2>
        {subtitle && <p style={{ margin:'4px 0 0', fontSize:13, color:'#9AA0AE', lineHeight:1.4 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── ProfileModal ─────────────────────────────────────────────────────────
   Modale de sélection de profil personnalité dans l'éditeur.
   Deux actions : Régénérer le CV (accroche + expériences + compétences)
                  Appliquer      (profil actif pour les prochaines reformulations)
   ─────────────────────────────────────────────────────────────────────── */
function ProfileModal({ profiles, activeProfileId, onApply, onRegenerate, onManage, onClose }) {
  const [selected, setSelected] = useState(activeProfileId || '');
  const active = profiles.find(p => String(p.id) === String(selected));

  // Fermeture sur Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const TON_COLORS = {
    authentique:   '#0891B2',
    professionnel: '#7C3AED',
    percutant:     '#EA580C',
    creatif:       '#16A34A',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(11,16,32,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn .18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 94vw)', background: '#fff', borderRadius: 18,
          boxShadow: '0 24px 64px rgba(11,16,32,0.22)',
          animation: 'fadeInUp .22s cubic-bezier(.16,.84,.24,1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px', borderBottom: '1px solid #ECEDF1',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1020' }}>
              🧠 Profil IA
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9AA0AE' }}>
              Oriente les reformulations IA vers ta voix et ton contexte
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9AA0AE', fontSize: 20, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Liste des profils */}
        <div style={{ padding: '12px 22px', maxHeight: 280, overflowY: 'auto' }}>
          {/* Option sans profil */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            borderRadius: 10, cursor: 'pointer', marginBottom: 6,
            border: `1.5px solid ${!selected ? '#1539B7' : '#ECEDF1'}`,
            background: !selected ? '#EEF2FF' : '#fff',
            transition: 'all .15s',
          }}>
            <input type="radio" name="profile" checked={!selected}
              onChange={() => setSelected('')}
              style={{ accentColor: '#1539B7', width: 16, height: 16 }} />
            <span style={{ fontSize: 20 }}>🚫</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: !selected ? '#1539B7' : '#0B1020' }}>
                Sans profil
              </div>
              <div style={{ fontSize: 11, color: '#9AA0AE' }}>Reformulations IA génériques</div>
            </div>
          </label>

          {profiles.map(p => {
            const isSel = String(selected) === String(p.id);
            const tonColor = TON_COLORS[p.ton?.style] || '#1539B7';
            return (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                border: `1.5px solid ${isSel ? '#1539B7' : '#ECEDF1'}`,
                background: isSel ? '#EEF2FF' : '#fff',
                transition: 'all .15s',
              }}>
                <input type="radio" name="profile" checked={isSel}
                  onChange={() => setSelected(String(p.id))}
                  style={{ accentColor: '#1539B7', width: 16, height: 16 }} />
                <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji || '🚀'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? '#1539B7' : '#0B1020' }}>
                    {p.nom}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                    {p.personnalite?.mots?.slice(0, 3).map(m => (
                      <span key={m} style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 8,
                        background: '#F7F8FA', color: '#3A4156', fontWeight: 500,
                      }}>{m}</span>
                    ))}
                    {p.ton?.style && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 8,
                        background: tonColor + '15', color: tonColor, fontWeight: 600,
                      }}>✍️ {p.ton.style}</span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}

          {profiles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9AA0AE', fontSize: 13 }}>
              Aucun profil créé encore.
            </div>
          )}
        </div>

        {/* Lien gérer */}
        <div style={{ padding: '0 22px 12px' }}>
          <button onClick={() => { onClose(); onManage(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#9AA0AE', fontFamily: "'Manrope',sans-serif",
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#1539B7'}
            onMouseLeave={e => e.currentTarget.style.color = '#9AA0AE'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Gérer mes profils
          </button>
        </div>

        {/* Footer — actions */}
        <div style={{
          padding: '14px 22px', borderTop: '1px solid #ECEDF1',
          display: 'flex', gap: 10,
        }}>
          {/* Régénérer */}
          <button
            onClick={() => { onApply(selected); onRegenerate(); onClose(); }}
            disabled={selected === activeProfileId && !selected}
            title="Applique le profil ET relance l'IA sur accroche + expériences + compétences"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: '#0B1020', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: "'Manrope',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a2340'}
            onMouseLeave={e => e.currentTarget.style.background = '#0B1020'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Régénérer le CV
          </button>

          {/* Appliquer seulement */}
          <button
            onClick={() => { onApply(selected); onClose(); }}
            title="Applique le profil pour les prochaines reformulations, sans modifier le CV"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: '#EEF2FF', color: '#1539B7', border: '1.5px solid #1539B733',
              cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#D4DCFF'}
            onMouseLeave={e => e.currentTarget.style.background = '#EEF2FF'}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Editor() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { toasts, show: showToast } = useToast();
  const { t, mode, toggle: toggleDark } = useTheme();
  const {
    order: sectionOrder, onDragEnd: onSectionDragEnd, addSection, removeSection, resetOrder: resetSectionOrder,
    sidebarOrder, onSidebarDragEnd, resetSidebarOrder,
  } = useSectionOrder();

  /* state from localStorage */
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [cvData, setCvData] = useState(null);
  const [noCVState, setNoCVState] = useState(false); // true quand aucun CV en mémoire
  const [selectedPal, setSelectedPal, selectedPalRef] = useStateRef(PALETTES[0]);
  const [croppedPhoto, setCroppedPhoto, croppedPhotoRef] = useStateRef('');
  const [logoDataURL, setLogoDataURL, logoDataURLRef] = useStateRef('');
  const [candidateName, setCandidateName] = useState('');
  const { apiKey } = useSettings();
  const { embedded: crmEmbedded, candidate: crmCandidate, notifySaved: crmNotifySaved } = useCRMBridge();
  const { push: crmTokenPush } = useCRMToken();

  /* profil personnalité actif */
  const [profiles, setProfiles]               = useState(() => getProfiles());
  const [activeProfileId, setActiveProfileId] = useState(() => localStorage.getItem('talia_cv_active_profile') || '');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const activeProfile = profiles.find(p => String(p.id) === String(activeProfileId)) || null;
  // Persist la sélection de profil
  useEffect(() => {
    if (activeProfileId) localStorage.setItem('talia_cv_active_profile', activeProfileId);
    else localStorage.removeItem('talia_cv_active_profile');
  }, [activeProfileId]);
  // Rafraîchit la liste si on revient sur la page après ajout de profil
  useEffect(() => { setProfiles(getProfiles()); }, []);

  /* panel visibility */
  const [dlMenuOpen, setDlMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [designCollapsed, setDesignCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  /* slider drag — overlay sur l'iframe pour éviter que le drag sélectionne du texte */
  const [sliderDragging, setSliderDragging] = useState(false);
  useEffect(() => {
    const stop = () => setSliderDragging(false);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => { window.removeEventListener('mouseup', stop); window.removeEventListener('touchend', stop); };
  }, []);

  /* left panel tab */
  const [edTab, setEdTab] = useState('identite');

  /* right design panel accordion */
  const [designAcc, setDesignAcc] = useState({ couleurs: true, typo: true, templates: true, texture: false });
  const toggleAcc = (k) => setDesignAcc(a => ({ ...a, [k]: !a[k] }));



  /* version history panel */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVersions, setHistoryVersions] = useState([]);

  /* editor panel fields (mirror cvData) */
  const [edFields, setEdFields] = useState(null);
  const debRef = useRef(null);
  /* true quand un changement vient d'une édition inline (data-field) déjà
     reflétée dans le DOM → on synchronise cvData sans recharger l'iframe */
  const skipRenderRef = useRef(false);

  /* photo editor */
  const [photoMode, setPhotoMode] = useState(false);
  const [photoDraft, setPhotoDraft] = useState('');
  const cropperRef = useRef(null);
  const cropImgRef = useRef(null);

  /* resizable editor panel */
  const [panelWidth, setPanelWidth] = useState(340);

  /* undo / redo */
  const undoStack   = useRef([]);
  const undoPointer = useRef(-1);
  const undoDebRef  = useRef(null);
  const isRestoring = useRef(false); // bloque captureSnapshot pendant undo/redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /* zoom */
  const calcAutoZoom = () => {
    const TOPBAR_H = 56;
    const PAD_V    = 56; // 28px top + 28px bottom dans le conteneur CV
    const available = window.innerHeight - TOPBAR_H - PAD_V;
    return Math.min(1, Math.max(0.35, parseFloat((available / CV_H).toFixed(2))));
  };
  const [zoom, setZoom] = useState(calcAutoZoom);

  /* font sizes — per section */
  const DEFAULT_FS = { presentation: 11, exp: 11.5, form: 11, sidebar: 10.5, contacts: 9.5 };
  const [fontSizes, setFontSizes] = useState(DEFAULT_FS);
  const fontSizesRef = useRef({ ...DEFAULT_FS });

  /* dirty / unsaved state */
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [cvPickerOpen, setCvPickerOpen] = useState(false);
  const cvPickerRef = useRef(null);
  const [currentHistId, setCurrentHistId] = useState(null);

  // Sync historyVersions when a save occurs or the panel opens
  // (doit être APRÈS currentHistId pour éviter la temporal dead zone)
  useEffect(() => {
    if (historyOpen) setHistoryVersions(getVersions(currentHistId));
  }, [historyOpen, lastSavedAt, currentHistId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* retour au lot bulk */
  const [hasBulkSession, setHasBulkSession] = useState(() => {
    return sessionStorage.getItem('talia_bulk_returning') === '1' || loadBulkSession() !== null;
  });

  /* text colour for floating toolbar */
  const [textColorPick, setTextColorPick] = useState('#1a3a5c');

  /* A4 overflow detection */
  const [overflowWarning, setOverflowWarning] = useState(false);

  /* line-height factor (1 = default; reduced by optimizeSpace) */
  const lineHeightRef = useRef(null); // null = keep template default

  /* download overlay */
  const [dlLoading, setDlLoading] = useState(false);

  /* pdf import */
  const [pdfImportLoading, setPdfImportLoading] = useState(false);
  const pdfImportRef = useRef(null);

  /* iframe */
  const iframeRef = useRef(null);
  const photoInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const setupDone = useRef(false);

  /* focus mode — après iframeRef */
  const { focusActive, focusTab, activateFocus, deactivateFocus } = useFocusMode(iframeRef);
  const savedRange = useRef(null);
  const [selectionPos, setSelectionPos] = useState(null);

  /* template */
  const [templateId, setTemplateId, templateIdRef] = useStateRef('classic');

  /* sidebar texture */
  const [sidebarTextureId, setSidebarTextureId] = useState(
    () => localStorage.getItem('talia_sidebar_texture_id') || 'none'
  );
  const sidebarTextureRef = useRef(SIDEBAR_TEXTURES.find(t => t.id === (localStorage.getItem('talia_sidebar_texture_id') || 'none')) || SIDEBAR_TEXTURES[0]);

  // Sync texture object ref when id changes
  useEffect(() => {
    const tx = SIDEBAR_TEXTURES.find(t => t.id === sidebarTextureId) || SIDEBAR_TEXTURES[0];
    sidebarTextureRef.current = tx;
  }, [sidebarTextureId]);

  /* selectedPalRef / croppedPhotoRef / logoDataURLRef / templateIdRef :
     fournis par useStateRef ci-dessus (toujours synchrones avec leur état) */

  /* ── helper : injecter photo+logo dans un html string ─────────────────── */
  // Utilise DOMParser pour éviter les bugs de regex sur les divs imbriqués
  const injectMedia = useCallback((html, photo, logo) => {
    if (!photo && !logo) return html;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      if (photo) {
        const el = doc.querySelector('.block-photo');
        if (el) el.innerHTML = `<div class="block-photo-inner"><img src="${photo}" style="width:100%;height:auto;object-fit:cover;display:block;" /></div>`;
      }
      if (logo) {
        const el = doc.querySelector('.logo-zone');
        if (el) el.innerHTML = `<img src="${logo}" style="max-width:80%;max-height:40px;object-fit:contain;display:block;margin:auto;" />`;
      }
      return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    } catch {
      // fallback regex si DOMParser échoue
      let out = html;
      if (photo) out = out.replace(
        /(<div class="block-photo"[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>)/,
        `$1<div class="block-photo-inner"><img src="${photo}" style="width:100%;height:100%;object-fit:cover;" /></div></div>`
      );
      if (logo) out = out.replace(
        /(<div class="logo-zone"[^>]*>)[^<]*(<\/div>)/,
        `$1<img src="${logo}" style="max-width:80%;max-height:40px;object-fit:contain;display:block;margin:auto;" />$2`
      );
      return out;
    }
  }, []);

  /* ── load state from localStorage (or history by id) ──────────────────── */
  useEffect(() => {
    // Si on arrive avec un id (ex: depuis le batch), charger depuis l'historique
    let s = null;
    if (routeId) {
      const hist = getHistorySync();
      const entry = hist.find(h => String(h.id) === String(routeId));
      if (entry) {
        s = {
          generatedHTML: entry.html,
          cvData:        entry.data,
          palette:       PALETTES[0],
          croppedPhoto:  '',
          logoDataURL:   '',
          name:          entry.name,
          apiKey:        '',
          templateId:    'classic',
        };
        saveEditorState(s);
        setCurrentHistId(entry.id);
      }
    }
    if (!s) s = loadEditorState();
    if (!s) { setNoCVState(true); return; }

    const cData = s.cvData || null;
    const photo  = s.croppedPhoto || '';
    const logo   = s.logoDataURL  || '';
    const savedPal = s.palette ? (PALETTES.find(p => p.id === s.palette.id) || s.palette) : PALETTES[0];

    setCvData(cData);
    setSelectedPal(savedPal);
    setCroppedPhoto(photo); // met aussi croppedPhotoRef à jour (useStateRef)
    setLogoDataURL(logo);   // idem logoDataURLRef
    setCandidateName(s.name || (cData ? (cData.prenom||'') + ' ' + (cData.nom||'') : ''));
    const savedTemplateId = s.templateId || localStorage.getItem('talia_template_id') || 'classic';
    setTemplateId(savedTemplateId); // met aussi templateIdRef à jour
    if (cData) setEdFields(JSON.parse(JSON.stringify(cData)));

    // Toujours régénérer le HTML depuis le template le plus récent
    const savedOrder = (() => {
      try { return JSON.parse(localStorage.getItem('talia_section_order')) || undefined; } catch { return undefined; }
    })();
    const savedSidebarOrder = (() => {
      try { return JSON.parse(localStorage.getItem('talia_sidebar_order')) || undefined; } catch { return undefined; }
    })();
    const savedTextureId = localStorage.getItem('talia_sidebar_texture_id') || 'none';
    const savedTexture   = SIDEBAR_TEXTURES.find(t => t.id === savedTextureId) || SIDEBAR_TEXTURES[0];
    const freshHtml = cData
      ? injectMedia(renderCVFromData(cData, savedPal, savedOrder, savedTemplateId, savedSidebarOrder, savedTexture), photo, logo)
      : (s.generatedHTML || '');

    setupDone.current = false;
    setGeneratedHTML(freshHtml);
  }, [routeId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── close cv picker on outside click ─────────────────────────────────── */
  useEffect(() => {
    if (!cvPickerOpen) return;
    const handler = (e) => { if (cvPickerRef.current && !cvPickerRef.current.contains(e.target)) setCvPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cvPickerOpen]);

  /* ── persist state on changes ──────────────────────────────────────────── */
  const persistState = useCallback(() => {
    const base = loadEditorState() || {};
    saveEditorState({
      ...base,
      generatedHTML,
      cvData,
      palette: selectedPal,
      croppedPhoto,
      logoDataURL,
      name: candidateName,
      templateId,
    });
  }, [generatedHTML, cvData, selectedPal, croppedPhoto, logoDataURL, candidateName, templateId]);

  /* ── get current HTML in iframe ────────────────────────────────────────── */
  const getCurrentHTML = useCallback(() => {
    return iframeRef.current?.contentDocument?.documentElement?.outerHTML || generatedHTML;
  }, [generatedHTML]);

  /* ── Iframe init ───────────────────────────────────────────────────────── */
  const handleIframeLoad = useCallback(() => {
    if (setupDone.current) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    // Ignorer les loads d'iframes vides (srcDoc initial = '') — la race condition
    // ferait passer setupDone à true prématurément, bloquant le vrai setup
    if (!doc.querySelector('.cv-wrap')) return;
    setupDone.current = true;
    doc.designMode = 'on';

    // Inject anti-layout-shift CSS
    if (!doc.getElementById('dsim-base')) {
      const antiShift = doc.createElement('style');
      antiShift.id = 'dsim-base';
      antiShift.textContent = [
        '*{box-sizing:border-box!important}',
        '*:focus{outline:none!important;box-shadow:none!important}',
        '[contenteditable]{outline:none!important;-webkit-tap-highlight-color:transparent}',
        '[contenteditable]:focus{border:1px solid transparent!important}',
        '::selection{background:rgba(26,58,92,0.18)}',
        '*{-webkit-spell-check:false;spell-check:false}',
      ].join('');
      doc.head.appendChild(antiShift);
    }

    // Inject editable zone highlight style (appliqué via JS, pas CSS :hover)
    if (!doc.getElementById('dsim-hover')) {
      const hoverStyle = doc.createElement('style');
      hoverStyle.id = 'dsim-hover';
      hoverStyle.textContent = `
        .dsim-hl-light {
          background: rgba(21,57,183,.06) !important;
          outline: 1px dashed rgba(21,57,183,.32) !important;
          outline-offset: 2px !important;
          border-radius: 3px !important;
        }
        .dsim-hl-dark {
          background: rgba(255,255,255,.12) !important;
          outline: 1px dashed rgba(255,255,255,.4) !important;
          outline-offset: 2px !important;
          border-radius: 3px !important;
        }
        .dsim-hl-title {
          outline: 1px dashed rgba(21,57,183,.32) !important;
          outline-offset: 2px !important;
        }
      `;
      doc.head.appendChild(hoverStyle);
    }

    // Highlight de zone au survol via mouseover/mouseout
    const ZONE_MAP = [
      { classes: ['cv-nom-prenom','cv-prenom','cv-nom','cv-poste','cv-accroche',
          'exp-poste','exp-entreprise','exp-lieu','exp-period','ldm-text',
          'form-titre','form-meta','form-detail','comp-row','lang-row',
          'cv-contacts-line','sl-item','sl-lang-name','sl-lang-lvl','sl-sub'], hl: 'dsim-hl-light' },
      { classes: ['sidebar-item','comp-list'], hl: 'dsim-hl-dark' },
      { classes: ['section-title','sl-title'], hl: 'dsim-hl-title' },
    ];
    const getHL = (el) => {
      for (const { classes, hl } of ZONE_MAP) {
        if (classes.some(c => el.classList.contains(c))) return hl;
      }
      return null;
    };
    let hlEl = null;
    const onOver = (e) => {
      let t = e.target;
      // Remonter jusqu'à 3 niveaux pour trouver une zone reconnue
      for (let i = 0; i < 3 && t && t !== doc.body; i++, t = t.parentElement) {
        const hl = getHL(t);
        if (hl) {
          if (hlEl && hlEl !== t) { hlEl.classList.remove('dsim-hl-light','dsim-hl-dark','dsim-hl-title'); }
          t.classList.add(hl);
          hlEl = t;
          return;
        }
      }
      // Pas de zone : retirer le highlight
      if (hlEl) { hlEl.classList.remove('dsim-hl-light','dsim-hl-dark','dsim-hl-title'); hlEl = null; }
    };
    const onOut = () => {
      if (hlEl) { hlEl.classList.remove('dsim-hl-light','dsim-hl-dark','dsim-hl-title'); hlEl = null; }
    };
    doc.addEventListener('mouseover', onOver);
    doc.addEventListener('mouseleave', onOut);

    // Snapshot initial + restore font sizes + check overflow
    setTimeout(() => {
      captureSnapshot();
      applyFontSizesToIframe(fontSizesRef.current);
      checkOverflow();
    }, 250);

    // Floating text toolbar
    const updateToolbar = () => {
      setTimeout(() => {
        const sel = doc.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) { setSelectionPos(null); return; }
        savedRange.current = sel.getRangeAt(0).cloneRange();
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const iRect = iframe.getBoundingClientRect();
        setSelectionPos({ x: iRect.left + rect.left + rect.width / 2, y: iRect.top + rect.top - 52 });
      }, 10);
    };
    // Capture snapshot on user edits (debounced)
    const scheduleSnapshot = () => {
      clearTimeout(undoDebRef.current);
      undoDebRef.current = setTimeout(() => captureSnapshot(), 800);
    };
    doc.addEventListener('mouseup', updateToolbar);
    doc.addEventListener('keyup', (e) => { updateToolbar(); scheduleSnapshot(); });
    doc.addEventListener('mousedown', () => setSelectionPos(null));

    // Édition inline : au blur d'un [data-field], remonter le texte dans les données.
    // Délégation sur doc (focusout bubble) → survit aux remplacements de body.
    doc.addEventListener('focusout', (e) => {
      const el = e.target?.closest?.('[data-field]');
      if (!el) return;
      const path = el.getAttribute('data-field');
      if (path) writeInlineField(path, el.innerText.replace(/ /g, ' ').trim());
    });
  }, []);

  const restoreSelection = useCallback(() => {
    const iframe = iframeRef.current;
    const range = savedRange.current;
    if (!iframe || !range) return false;
    iframe.contentWindow.focus();
    const sel = iframe.contentDocument.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    return true;
  }, []);

  const applyTextColor = useCallback((color) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !restoreSelection()) return;
    doc.execCommand('styleWithCSS', false, true);
    doc.execCommand('foreColor', false, color);
  }, [restoreSelection]);

  const exec = useCallback((cmd, val = null) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    restoreSelection();
    doc.execCommand('styleWithCSS', false, true);
    doc.execCommand(cmd, false, val);
  }, [restoreSelection]);

  const changeFontSize = useCallback((delta) => {
    const iframe = iframeRef.current;
    const savedR = savedRange.current;
    if (!iframe || !savedR) return;
    const doc = iframe.contentDocument;
    // Restore selection without going through restoreSelection (avoids return-false edge case)
    iframe.contentWindow.focus();
    const sel = doc.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedR.cloneRange());
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    // Detect current font size from common ancestor
    const container = range.commonAncestorContainer;
    const el = container.nodeType === 3 ? container.parentElement : container;
    const current = parseFloat(doc.defaultView.getComputedStyle(el).fontSize) || 11;
    const next = Math.max(6, Math.round(current + delta));
    const span = doc.createElement('span');
    span.style.fontSize = `${next}px`;
    try {
      range.surroundContents(span);
    } catch {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    const nr = doc.createRange();
    nr.selectNodeContents(span);
    sel.removeAllRanges(); sel.addRange(nr);
    savedRange.current = nr.cloneRange();
  }, []);

  /* ── reload iframe when HTML changes ──────────────────────────────────── */
  const reloadIframe = useCallback((html) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;

    if (doc && doc.querySelector('.cv-wrap')) {
      try {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        // 1. Remplacer le CSS principal du template (style sans id dans le head)
        //    Les styles dsim-* (id=dsim-base/fs/s) sont conservés intacts
        const newStyle = newDoc.head.querySelector('style:not([id])');
        if (newStyle) {
          let oldStyle = doc.head.querySelector('style:not([id])');
          if (oldStyle) {
            oldStyle.textContent = newStyle.textContent;
          } else {
            const s = doc.createElement('style');
            s.textContent = newStyle.textContent;
            doc.head.insertBefore(s, doc.head.firstChild);
          }
        }

        // 2. Remplacer le body
        doc.body.innerHTML = newDoc.body.innerHTML;

        if (doc.designMode !== 'on') doc.designMode = 'on';
        return;
      } catch {
        // fallback complet
      }
    }

    // Premier chargement : rechargement complet via srcDoc
    setupDone.current = false;
    setGeneratedHTML(html);
  }, []);

  /* ── rerenderCV : régénère le HTML du CV et le réinjecte dans l'iframe ────
     Centralise le triptyque renderCVFromData → injectMedia → reloadIframe.
     opts.data    : données à utiliser (défaut : cvData puis edFields)
     opts.palette : palette à utiliser (défaut : ref courante, toujours à jour) */
  const rerenderCV = useCallback((opts = {}) => {
    const data = opts.data || cvData || edFields;
    if (!data) return;
    const pal = opts.palette || selectedPalRef.current;
    const html = renderCVFromData(
      data, pal, sectionOrder, templateIdRef.current, sidebarOrder, sidebarTextureRef.current
    );
    reloadIframe(injectMedia(html, croppedPhotoRef.current, logoDataURLRef.current));
  }, [cvData, edFields, sectionOrder, sidebarOrder, injectMedia, reloadIframe]);

  /* ── apply palette live ────────────────────────────────────────────────── */
  const applyPaletteToIframe = useCallback((pp) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const c      = pp.c  || '#1a3a5c';
    const d      = pp.d  || '#0e2a44';
    const lt     = pp.lt || `rgba(26,58,92,0.08)`;
    const b      = pp.b  || `rgba(26,58,92,0.25)`;
    const t      = pp.t  || c;
    const accent = pp.titleColor || '#FFCC00';
    const css = `
      .block-photo{background:${d} !important}
      .block-sidebar{background:${c} !important}
      .cv-nom-prenom{color:${c} !important}
      .cv-poste{color:${c} !important}
      .section-title{color:${c} !important;border-top-color:${c} !important;border-bottom-color:${c} !important}
      .exp-missions li::before{color:${c} !important}
      .sidebar-title{color:${accent} !important}
      .comp-list li::before{color:${accent} !important}
      .form-talia .form-titre{color:#1a1a1a !important}
      .form-talia .form-meta{color:#6b7280 !important}
      .sl-title{color:${c} !important;border-bottom-color:${c} !important}
      .sl-list li::before{color:${c} !important}
      .sl-gauge-fill{background:${c} !important}
      .cv-sep{background:${c} !important}
      .cv-contacts-bar{background:${c} !important}
      .lin-list li::before{color:${c} !important}
      .comp-cat{color:${c} !important}
      .lang-name{color:${c} !important}
      .cv-header-band{background:${c} !important}
      .cv-contacts-line{color:${c} !important}
      .cv-prenom{color:#fff !important}
      .cv-nom{color:#fff !important}
      .cv-header-band .cv-poste{color:rgba(255,255,255,0.85) !important}
    `;
    let styleEl = doc.getElementById('dsim-s');
    if (!styleEl) { styleEl = doc.createElement('style'); styleEl.id = 'dsim-s'; doc.head.appendChild(styleEl); }
    styleEl.textContent = css;
  }, []);

  /* ── apply font sizes per section + optional line-height live ────────── */
  // fs = { presentation, exp, form, sidebar }
  // presentation = accroche/body text of header block; nom/poste scale from it
  const applyFontSizesToIframe = useCallback((fs) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const { presentation: p, exp: e, form: f, sidebar: s, contacts: ct = 9.5 } = fs;
    const lh = lineHeightRef.current;
    const lhRule = lh ? `.cv-wrap,.cv-wrap *{line-height:${lh.toFixed(2)}!important}` : '';
    const css = [
      lhRule,
      // ── Présentation (header block) ──────────────────────────────────
      `.cv-nom-prenom{font-size:${(p*2.36).toFixed(1)}px !important}`,
      `.cv-prenom{font-size:${(p*2.36).toFixed(1)}px !important}`,
      `.cv-nom{font-size:${(p*2.36).toFixed(1)}px !important}`,
      `.cv-poste{font-size:${(p*1.18).toFixed(1)}px !important}`,
      `.cv-accroche{font-size:${p}px !important}`,
      // ── Expériences (block-main) ─────────────────────────────────────
      `.section-title{font-size:${(e*1.15).toFixed(1)}px !important}`,
      `.exp-poste{font-size:${e}px !important}`,
      `.exp-meta{font-size:${(e*0.88).toFixed(1)}px !important}`,
      `.exp-missions li{font-size:${(e*0.92).toFixed(1)}px !important}`,
      // ── Formations (block-main) ──────────────────────────────────────
      `.form-titre{font-size:${f}px !important}`,
      `.form-meta{font-size:${(f*0.90).toFixed(1)}px !important}`,
      // ── Barre latérale sombre (Classique / Corporate) ────────────────
      `.sidebar-title{font-size:${(s*1.08).toFixed(1)}px !important}`,
      `.sidebar-item{font-size:${s}px !important}`,
      `.comp-list li{font-size:${s}px !important}`,
      `.comp-subtitle{font-size:${(s*0.88).toFixed(1)}px !important}`,
      // ── Barre latérale claire (Minimaliste) ─────────────────────────────
      `.sl-title{font-size:${(s*1.0).toFixed(1)}px !important}`,
      `.sl-item{font-size:${s}px !important}`,
      `.sl-sub{font-size:${(s*0.85).toFixed(1)}px !important}`,
      `.sl-list li{font-size:${s}px !important}`,
      `.sl-lang-name{font-size:${s}px !important}`,
      `.sl-lang-lvl{font-size:${(s*0.88).toFixed(1)}px !important}`,
      // ── Template Compact (colonne unique) ────────────────────────────────
      `.lin-list li{font-size:${(s*0.9).toFixed(1)}px !important}`,
      `.comp-cat{font-size:${(s*0.82).toFixed(1)}px !important}`,
      `.lang-item{font-size:${s}px !important}`,
      `.cv-contacts-bar{font-size:${ct}px !important}`,
      `.contacts-label{font-size:${(ct*0.79).toFixed(1)}px !important}`,
      `.cv-contacts-line{font-size:${ct}px !important}`,
    ].join('');
    let styleEl = doc.getElementById('dsim-fs');
    if (!styleEl) { styleEl = doc.createElement('style'); styleEl.id = 'dsim-fs'; doc.head.appendChild(styleEl); }
    styleEl.textContent = css;
  }, []);

  /* ── A4 overflow detection ───────────────────────────────────────────── */
  const checkOverflow = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const el = doc.querySelector('.cv-wrap') || doc.body;
    // 8px tolerance for sub-pixel rounding
    setOverflowWarning(el.scrollHeight > CV_H + 8);
  }, []);

  /* ── Scale-to-fit / optimise for A4 ─────────────────────────────────── */
  const optimizeSpace = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const el = doc.querySelector('.cv-wrap') || doc.body;
    const scrollH = el.scrollHeight;
    if (scrollH <= CV_H) { showToast('Le contenu tient déjà sur une page A4 ✓', 'success'); return; }
    const ratio = CV_H / scrollH;
    // Reduce font sizes proportionally (floor at readability minimums)
    const cur = fontSizesRef.current;
    const newFs = {
      presentation: Math.max(7,  parseFloat((cur.presentation * ratio).toFixed(1))),
      exp:          Math.max(7,  parseFloat((cur.exp          * ratio).toFixed(1))),
      form:         Math.max(7,  parseFloat((cur.form         * ratio).toFixed(1))),
      sidebar:      Math.max(6.5,parseFloat((cur.sidebar      * ratio).toFixed(1))),
      ...(cur.contacts != null ? { contacts: Math.max(6.5, parseFloat((cur.contacts * ratio).toFixed(1))) } : {}),
    };
    fontSizesRef.current = newFs;
    setFontSizes(newFs);
    // Tighten line-height proportionally (floor at 1.1)
    const newLh = parseFloat(Math.max(1.1, 1.45 * ratio).toFixed(2));
    lineHeightRef.current = newLh;
    applyFontSizesToIframe(newFs); // lhRule is read from lineHeightRef inside
    // Re-check after browser reflows
    setTimeout(() => checkOverflow(), 400);
    showToast(`Contenu adapté (−${Math.round((1 - ratio) * 100)}%) ✓`, 'success');
  }, [applyFontSizesToIframe, showToast]);

  /* ── photo upload ──────────────────────────────────────────────────────── */
  const handlePhotoFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      deactivateFocus(); // désactiver le focus mode avant d'ouvrir le crop
      setPhotoDraft(ev.target.result);
      setPhotoMode(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [deactivateFocus]);

  /* ── CropperJS integration ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!photoMode || !photoDraft || !cropImgRef.current) return;
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css');
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js').then(() => {
      if (cropperRef.current) { cropperRef.current.destroy(); cropperRef.current = null; }
      if (!window.Cropper || !cropImgRef.current) return;
      cropImgRef.current.src = photoDraft;
      cropperRef.current = new window.Cropper(cropImgRef.current, {
        aspectRatio: 1, viewMode: 1, autoCropArea: 0.9, guides: true, movable: true, zoomable: true,
      });
    });
    return () => { if (cropperRef.current) { cropperRef.current.destroy(); cropperRef.current = null; } };
  }, [photoMode, photoDraft]);

  const confirmCrop = useCallback(() => {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCroppedCanvas({ width: 600, height: 600 });
    const dataURL = canvas.toDataURL('image/jpeg', 0.98);
    setCroppedPhoto(dataURL);
    // inject into iframe
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      const zone = doc.querySelector('.block-photo');
      if (zone) zone.innerHTML = `<div class="block-photo-inner"><img src="${dataURL}" /></div>`;
    }
    setPhotoMode(false);
    setPhotoDraft('');
    showToast('Photo mise à jour ✓', 'success');
  }, [showToast]);

  /* ── logo upload ───────────────────────────────────────────────────────── */
  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      deactivateFocus(); // désactiver le focus mode avant d'injecter le logo
      const dataURL = ev.target.result;
      setLogoDataURL(dataURL);
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const zone = doc.querySelector('.logo-zone');
        if (zone) {
          zone.innerHTML = `<img src="${dataURL}" style="max-width:100%;max-height:36px;object-fit:contain;display:block;margin:auto;" />`;
        }
      }
      showToast('Logo mis à jour ✓', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [deactivateFocus, showToast]);

  /* ── design drawer ─────────────────────────────────────────────────────── */
  const handlePaletteSelect = useCallback((pp) => {
    setSelectedPal(pp);
    applyPaletteToIframe(pp);
    setTimeout(() => checkOverflow(), 100);
  }, [applyPaletteToIframe]);

  /* ── undo / redo ────────────────────────────────────────────────────────── */
  const captureSnapshot = useCallback(() => {
    if (isRestoring.current) return; // ne pas écraser le stack pendant undo/redo
    const html = iframeRef.current?.contentDocument?.documentElement?.outerHTML;
    if (!html) return;
    const stack = undoStack.current.slice(0, undoPointer.current + 1);
    stack.push(html);
    if (stack.length > 40) stack.shift();
    undoStack.current = stack;
    undoPointer.current = stack.length - 1;
    setCanUndo(undoPointer.current > 0);
    setCanRedo(false);
    checkOverflow(); // always verify A4 fit after each content change
  }, []);

  const undo = useCallback(() => {
    if (undoPointer.current <= 0) return;
    isRestoring.current = true;
    undoPointer.current--;
    const html = undoStack.current[undoPointer.current];
    if (html) {
      setupDone.current = false;
      setGeneratedHTML(html);
      showToast('Annulé ↩', 'info');
    }
    setCanUndo(undoPointer.current > 0);
    setCanRedo(true);
    // Libérer le verrou après que l'iframe ait eu le temps de recharger
    setTimeout(() => { isRestoring.current = false; }, 600);
  }, [showToast]);

  const redo = useCallback(() => {
    if (undoPointer.current >= undoStack.current.length - 1) return;
    isRestoring.current = true;
    undoPointer.current++;
    const html = undoStack.current[undoPointer.current];
    if (html) {
      setupDone.current = false;
      setGeneratedHTML(html);
      showToast('Rétabli ↪', 'info');
    }
    setCanUndo(true);
    setCanRedo(undoPointer.current < undoStack.current.length - 1);
    setTimeout(() => { isRestoring.current = false; }, 600);
  }, [showToast]);

  /* ── save to history ───────────────────────────────────────────────────── */
  const saveCurrentToHist = useCallback(async () => {
    const html    = getCurrentHTML();
    const name    = candidateName || 'CV';
    const histId  = currentHistId || Date.now();
    let   savedId = currentHistId;

    // Upload photo + logo vers Supabase Storage (fire-and-forget si pas configuré)
    const [photoUrl, logoUrl] = await Promise.all([
      croppedPhoto ? uploadMedia(croppedPhoto, 'photo', histId) : Promise.resolve(null),
      logoDataURL  ? uploadMedia(logoDataURL,  'logo',  histId) : Promise.resolve(null),
    ]);

    const profileOpts = activeProfile
      ? { profileId: String(activeProfile.id), profileName: activeProfile.nom }
      : {};

    if (currentHistId) {
      await updateHistory(currentHistId, {
        html, data: cvData, name,
        ...(photoUrl && { photoUrl }),
        ...(logoUrl  && { logoUrl  }),
        ...profileOpts,
      });
    } else {
      const newId = await saveHistory(name, html, cvData, cvData?.formation || '', {
        photoUrl:  photoUrl  || null,
        logoUrl:   logoUrl   || null,
        ...profileOpts,
      });
      setCurrentHistId(newId);
      savedId = newId;
      window.history.replaceState(null, '', '/editor/' + newId);
    }

    saveVersion(savedId, cvData, name);
    setIsDirty(false);
    setLastSavedAt(Date.now());
    showToast('CV sauvegardé ✓', 'success');

    if (crmEmbedded) {
      crmNotifySaved({ html, cv_data: cvData, name });
    } else {
      // Mode standalone avec token CRM → push via API
      crmTokenPush({ name, cvData, html });
    }
  }, [getCurrentHTML, candidateName, cvData, currentHistId, croppedPhoto, logoDataURL,
      activeProfile, showToast, crmEmbedded, crmNotifySaved, crmTokenPush]);

  /* ── valider et terminer : sauve puis retour intelligent ───────────────── */
  const validateAndExit = useCallback(async () => {
    // 1. Sauvegarder le CV
    const html = getCurrentHTML();
    const name = candidateName || 'CV';
    const profileOpts = activeProfile
      ? { profileId: String(activeProfile.id), profileName: activeProfile.nom }
      : {};

    if (currentHistId) {
      await updateHistory(currentHistId, { html, data: cvData, name, ...profileOpts });
    } else {
      await saveHistory(name, html, cvData, cvData?.formation || '', profileOpts);
    }
    setIsDirty(false);
    setLastSavedAt(Date.now());

    // 2. Notifier le CRM si on est dans un iframe embarqué
    if (crmEmbedded) {
      crmNotifySaved({ html, cv_data: cvData, name: candidateName || 'CV' });
      clearCurrentCandidate(); // libère le candidat pour la prochaine génération
      showToast('CV validé ✓ — synchronisé avec le CRM', 'success', 1800);
      // En mode CRM, on ne navigue pas — le CRM gère la fermeture/redirection
      return;
    }

    // 3. Redirection contextuelle (mode standalone)
    if (hasBulkSession) {
      sessionStorage.setItem('talia_bulk_returning', '1');
      showToast('CV validé ✓ — retour à la session', 'success', 1800);
      setTimeout(() => navigate('/bulk'), 250);
    } else {
      showToast('CV validé ✓ — enregistré dans tes CV', 'success', 1800);
      setTimeout(() => navigate('/'), 250);
    }
  }, [getCurrentHTML, candidateName, cvData, currentHistId, hasBulkSession, navigate, showToast, crmEmbedded, crmNotifySaved]);

  /* ── valider et terminer : sauve puis retour intelligent ───────────────── */
  const validateAndExit = useCallback(() => {
    // 1. Sauvegarder le CV
    const html = getCurrentHTML();
    if (currentHistId) {
      updateHist(currentHistId, { html, data: cvData, name: candidateName || 'CV' });
    } else {
      saveToHist(candidateName || 'CV', html, cvData, cvData?.formation || '');
    }
    setIsDirty(false);
    setLastSavedAt(Date.now());

    // 2. Redirection contextuelle
    if (hasBulkSession) {
      sessionStorage.setItem('talia_bulk_returning', '1');
      showToast('CV validé ✓ — retour à la session', 'success', 1800);
      setTimeout(() => navigate('/bulk'), 250);
    } else {
      showToast('CV validé ✓ — enregistré dans tes CV', 'success', 1800);
      setTimeout(() => navigate('/'), 250);
    }
  }, [getCurrentHTML, candidateName, cvData, currentHistId, hasBulkSession, navigate, showToast]);

  /* ── Ctrl+Z / Ctrl+Y / Ctrl+S global ───────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveCurrentToHist(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, saveCurrentToHist]);

  /* ── Zoom adaptatif au resize fenêtre ──────────────────────────────────── */
  useEffect(() => {
    const onResize = () => setZoom(calcAutoZoom());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Focus mode toggle ──────────────────────────────────────────────────── */
  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => {
      const entering = !prev;
      if (entering) {
        setFormCollapsed(true);
        setDesignCollapsed(true);
      } else {
        setFormCollapsed(false);
        setDesignCollapsed(false);
      }
      // Recalculer le zoom après la transition CSS (~280ms)
      setTimeout(() => setZoom(calcAutoZoom()), 300);
      return entering;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculer le zoom quand les panels s'ouvrent/ferment
  useEffect(() => {
    const t = setTimeout(() => setZoom(calcAutoZoom()), 300);
    return () => clearTimeout(t);
  }, [formCollapsed, designCollapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape pour quitter le focus mode
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && focusMode) toggleFocusMode();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, toggleFocusMode]);

  /* ── panel resize ───────────────────────────────────────────────────────── */
  const onPanelDragStart = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    const onMove = (ev) => setPanelWidth(Math.max(280, Math.min(620, startW + (startX - ev.clientX))));
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  /* ── édition inline (data-field) → remontée dans edFields/cvData ──────────
     Appelé au blur d'un élément [data-field] dans l'iframe. Le DOM affiche déjà
     la nouvelle valeur, donc on lève skipRenderRef pour ne PAS recharger l'iframe
     (évite saut de curseur / flicker) ; le debounce synchronise cvData. */
  const writeInlineField = useCallback((path, value) => {
    setEdFields(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      setByPath(next, path, value);
      return next;
    });
    setIsDirty(true);
    skipRenderRef.current = true;
  }, []);

  /* ── structured editor ─────────────────────────────────────────────────────
     Les mutateurs du formulaire forcent un rendu (skipRenderRef=false) : leur
     changement n'est PAS encore reflété dans le DOM de l'iframe. */
  const handleEdField = useCallback((path, val) => {
    setIsDirty(true);
    skipRenderRef.current = false;
    setEdFields(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  }, []);

  const handleEdListItem = useCallback((listPath, index, field, val) => {
    setIsDirty(true);
    skipRenderRef.current = false;
    setEdFields(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = listPath.split('.');
      let arr = next;
      for (const k of keys) arr = arr[k];
      arr[index][field] = val;
      return next;
    });
  }, []);

  const addEdListItem = useCallback((listPath, template) => {
    setIsDirty(true);
    skipRenderRef.current = false;
    setEdFields(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = listPath.split('.');
      let arr = next;
      for (const k of keys) arr = arr[k];
      arr.push(template);
      return next;
    });
  }, []);

  const removeEdListItem = useCallback((listPath, index) => {
    skipRenderRef.current = false;
    setEdFields(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = listPath.split('.');
      let arr = next;
      for (const k of keys) arr = arr[k];
      arr.splice(index, 1);
      return next;
    });
  }, []);

  /* debounced re-render from editor fields */
  useEffect(() => {
    if (!edFields) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      // Édition inline : le DOM est déjà à jour, on sync cvData sans recharger l'iframe
      if (skipRenderRef.current) {
        skipRenderRef.current = false;
        setCvData(edFields);
        return;
      }
      rerenderCV({ data: edFields });
      setCvData(edFields);
    }, 600);
    return () => clearTimeout(debRef.current);
  // On ne dépend pas de rerenderCV (qui dépend de cvData) pour éviter de
  // re-déclencher l'effet après le setCvData ci-dessus → rendu superflu.
  }, [edFields, sectionOrder, sidebarOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  /* re-render quand l'ordre des sections ou la texture change */
  useEffect(() => {
    if (!cvData) return;
    rerenderCV({ data: cvData });
  }, [sectionOrder, sidebarOrder, sidebarTextureId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── AI re-generate section (editor panel) ─────────────────────────────── */
  const [aiSection, setAiSection] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const regenSection = useCallback(async (section) => {
    if (!apiKey || !cvData) { showToast('Clé API manquante', 'error'); return; }
    setAiSection(section); setAiLoading(true);
    try {
      const name  = [cvData.prenom, cvData.nom].filter(Boolean).join(' ') || 'le candidat';
      const poste = cvData.poste || 'non précisé';
      const profileCtx = buildProfileContext(activeProfile);

      // Prompts ciblés par section pour des résultats bien meilleurs
      const prompts = {
        accroche: `Tu es expert en recrutement et rédaction de CV professionnels.
Rédige une accroche percutante pour ${name}, candidat au poste : ${poste}.
Règles : 3-4 phrases max · commence par le profil ou la spécialité · mentionne 1-2 compétences clés · termine sur la valeur ajoutée ou l'ambition · ton dynamique et personnel (évite "passionné par" et les clichés).
Informations disponibles :
- Formations : ${cvData.formations?.map(f => f.titre).join(', ') || '—'}
- Expériences : ${cvData.experiences?.map(e => `${e.poste} chez ${e.entreprise}`).join(' | ') || '—'}
- Compétences : ${[...(cvData.competences?.techniques||[]), ...(cvData.competences?.outils||[])].slice(0,6).join(', ') || '—'}${profileCtx}
Retourne UNIQUEMENT : {"accroche": "texte ici"}`,

        experiences: `Tu es expert RH en valorisation de parcours professionnels.
Améliore les missions de chaque expérience pour ${name} (poste visé : ${poste}).
Règles pour chaque mission : verbe d'action fort à l'infinitif en début · max 15 mots · inclus un résultat/impact concret si déductible des données existantes · aucun jargon creux · NE FABRIQUE PAS d'informations absentes des missions d'origine.
IMPORTANT : ne modifie PAS poste, entreprise, lieu, periode. Conserve le même nombre de missions par expérience.${profileCtx}
Expériences actuelles :
${JSON.stringify(cvData.experiences, null, 2)}
Retourne UNIQUEMENT : {"experiences": [...même structure avec missions améliorées...]}`,

        competences: `Tu es expert RH. À partir du parcours de ${name} (poste visé : ${poste}), propose des compétences pertinentes et précises.
- techniques : savoir-faire métier spécifiques au poste visé (5-8 items, formulation courte)
- comportementales : soft skills démontrables par le parcours (4-5 items)
- outils : logiciels, frameworks, outils numériques concrets (4-8 items)
Base-toi sur les données ci-dessous. N'invente aucune compétence non déductible.${profileCtx}
Expériences : ${cvData.experiences?.map(e => `${e.poste} (${e.missions?.slice(0,2).join(' ; ')})`).join(' | ') || '—'}
Formations : ${cvData.formations?.map(f => f.titre).join(', ') || '—'}
Retourne UNIQUEMENT : {"competences": {"techniques": [], "comportementales": [], "outils": []}}`,
      };

      const prompt = prompts[section] ||
        `Tu es expert RH. Améliore la section "${section}" du CV. Retourne UNIQUEMENT un JSON {"${section}": ...valeur mise à jour...}.\nCV:\n${JSON.stringify(cvData, null, 2)}`;

      const text = await callAnthropicAPI({
        model:      'claude-sonnet-4-5', // sonnet : meilleur ratio qualité/vitesse pour la regen
        max_tokens: section === 'experiences' ? 2000 : 800,
        messages:   [{ role: 'user', content: prompt }],
      }, apiKey);

      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const patch = JSON.parse(match[0]);
        skipRenderRef.current = false;
        setEdFields(prev => ({ ...prev, ...patch }));
        showToast(`Section améliorée ✓`, 'success');
      } else {
        throw new Error('Réponse inattendue du modèle');
      }
    } catch (err) { showToast('Erreur IA : ' + err.message, 'error'); }
    finally { setAiLoading(false); setAiSection(''); }
  }, [apiKey, cvData, showToast]);

  /* ── Régénérer toutes les sections clés (accroche + expériences + compétences) ── */
  const regenAll = useCallback(async () => {
    if (!apiKey || !cvData) { showToast('Clé API manquante', 'error'); return; }
    setAiLoading(true);
    const sections = ['accroche', 'experiences', 'competences'];
    for (const section of sections) {
      setAiSection(section);
      showToast(`Régénération : ${section}…`, 'info', 1500);
      try {
        const name  = [cvData.prenom, cvData.nom].filter(Boolean).join(' ') || 'le candidat';
        const poste = cvData.poste || 'non précisé';
        const profileCtx = buildProfileContext(activeProfile);

        const prompts = {
          accroche: `Tu es expert en recrutement et rédaction de CV professionnels.
Rédige une accroche percutante pour ${name}, candidat au poste : ${poste}.
Règles : 3-4 phrases max · commence par le profil ou la spécialité · mentionne 1-2 compétences clés · termine sur la valeur ajoutée ou l'ambition · ton dynamique et personnel (évite "passionné par" et les clichés).
Informations disponibles :
- Formations : ${cvData.formations?.map(f => f.titre).join(', ') || '—'}
- Expériences : ${cvData.experiences?.map(e => `${e.poste} chez ${e.entreprise}`).join(' | ') || '—'}
- Compétences : ${[...(cvData.competences?.techniques||[]), ...(cvData.competences?.outils||[])].slice(0,6).join(', ') || '—'}${profileCtx}
Retourne UNIQUEMENT : {"accroche": "texte ici"}`,

          experiences: `Tu es expert RH en valorisation de parcours professionnels.
Améliore les missions de chaque expérience pour ${name} (poste visé : ${poste}).
Règles pour chaque mission : verbe d'action fort à l'infinitif en début · max 15 mots · inclus un résultat/impact concret si déductible des données existantes · aucun jargon creux · NE FABRIQUE PAS d'informations absentes des missions d'origine.
IMPORTANT : ne modifie PAS poste, entreprise, lieu, periode. Conserve le même nombre de missions par expérience.${profileCtx}
Expériences actuelles :
${JSON.stringify(cvData.experiences, null, 2)}
Retourne UNIQUEMENT : {"experiences": [...même structure avec missions améliorées...]}`,

          competences: `Tu es expert RH. À partir du parcours de ${name} (poste visé : ${poste}), propose des compétences pertinentes et précises.
- techniques : savoir-faire métier spécifiques au poste visé (5-8 items, formulation courte)
- comportementales : soft skills démontrables par le parcours (4-5 items)
- outils : logiciels, frameworks, outils numériques concrets (4-8 items)
Base-toi sur les données ci-dessous. N'invente aucune compétence non déductible.${profileCtx}
Expériences : ${cvData.experiences?.map(e => `${e.poste} (${e.missions?.slice(0,2).join(' ; ')})`).join(' | ') || '—'}
Formations : ${cvData.formations?.map(f => f.titre).join(', ') || '—'}
Retourne UNIQUEMENT : {"competences": {"techniques": [], "comportementales": [], "outils": []}}`,
        };

        const text = await callAnthropicAPI({
          model: 'claude-sonnet-4-5',
          max_tokens: section === 'experiences' ? 2000 : 800,
          messages: [{ role: 'user', content: prompts[section] }],
        }, apiKey);

        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const patch = JSON.parse(match[0]);
          skipRenderRef.current = false;
          setEdFields(prev => ({ ...prev, ...patch }));
        }
      } catch (err) {
        showToast(`Erreur sur ${section} : ${err.message}`, 'error');
      }
    }
    setAiLoading(false); setAiSection('');
    showToast('CV régénéré avec le profil ✓', 'success');
  }, [apiKey, cvData, activeProfile, showToast]);

  /* ── Reformuler une mission individuelle (3 variantes) ─────────────────── */
  const [reformOpen, setReformOpen] = useState(null); // { expIdx, missionIdx, variants, loading }

  const reformulateMission = useCallback(async (expIdx, missionIdx) => {
    if (!edFields) return;
    const exp = edFields.experiences?.[expIdx];
    const mission = exp?.missions?.[missionIdx] || '';
    if (!mission.trim()) { showToast('Mission vide', 'info'); return; }

    setReformOpen({ expIdx, missionIdx, variants: [], loading: true });

    // Mode démo sans clé API : variantes pré-construites
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 600));
      const verbs = ['Piloter', 'Coordonner', 'Optimiser'];
      const variants = verbs.map(v => {
        const base = mission.replace(/^[A-ZÀ-Ÿ][a-zà-ÿ]+\s+/, '').replace(/^[a-zà-ÿ]/, c => c.toLowerCase());
        return `${v} ${base}`;
      });
      setReformOpen({ expIdx, missionIdx, variants, loading: false });
      return;
    }

    try {
      const posteGlobal = cvData?.poste || '';
      const profileCtx  = buildProfileContext(activeProfile);
      const prompt = `Tu es expert RH en rédaction de CV. Reformule cette mission en 3 variantes distinctes.
Règles strictes :
- Max 14 mots par variante
- Commence chaque variante par un VERBE D'ACTION DIFFÉRENT à l'infinitif (ex : Piloter, Concevoir, Déployer…)
- Garde exactement le même sens et les mêmes informations — n'ajoute rien d'inventé
- Chaque variante doit sonner différemment (verbe ET structure différents)
- Adapte le ton et le registre au profil ci-dessous si fourni${profileCtx}

Contexte : ${exp.poste||''} · ${exp.entreprise||''}${posteGlobal ? ` · Poste visé : ${posteGlobal}` : ''}
Mission : "${mission}"

Retourne UNIQUEMENT un tableau JSON de 3 strings : ["variante 1", "variante 2", "variante 3"]`;
      const text = await callAnthropicAPI({
        model:      'claude-haiku-3-5', // haiku : rapide et suffisant pour reformuler
        max_tokens: 300,
        messages:   [{ role: 'user', content: prompt }],
      }, apiKey);
      const match = text.match(/\[[\s\S]*\]/);
      const variants = match ? JSON.parse(match[0]).slice(0, 3) : [];
      if (variants.length === 0) throw new Error('Aucune variante générée');
      setReformOpen({ expIdx, missionIdx, variants, loading: false });
    } catch (err) {
      showToast('Erreur reformulation : ' + err.message, 'error');
      setReformOpen(null);
    }
  }, [edFields, apiKey, showToast]);

  const applyReformulation = useCallback((variant) => {
    if (!reformOpen) return;
    const { expIdx, missionIdx } = reformOpen;
    setIsDirty(true);
    skipRenderRef.current = false; // données modifiées → re-rendu nécessaire
    setEdFields(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next.experiences?.[expIdx]?.missions) {
        next.experiences[expIdx].missions[missionIdx] = variant;
      }
      return next;
    });
    showToast('Mission reformulée ✓', 'success');
    setReformOpen(null);
  }, [reformOpen, showToast]);

  /* ── import PDF → remplissage automatique ──────────────────────────────── */
  const importPDF = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      showToast('Sélectionne un fichier PDF valide', 'error');
      return;
    }
    if (!apiKey) {
      showToast('Clé API Anthropic requise pour l\'import PDF (Paramètres)', 'error');
      return;
    }
    setPdfImportLoading(true);
    try {
      // Lire le PDF en base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/parse-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pdf: base64, apiKey }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur serveur ${res.status}`);
      }

      const { data } = await res.json();
      if (!data) throw new Error('Réponse vide');

      // Peupler l'éditeur avec les données extraites
      setCvData(data);
      const name = [data.prenom, data.nom].filter(Boolean).join(' ');
      if (name) setCandidateName(name);
      showToast('CV importé ✓ — vérifiez et complétez les informations', 'success');
    } catch (err) {
      console.error('[importPDF]', err);
      showToast(`Import échoué : ${err.message}`, 'error');
    } finally {
      setPdfImportLoading(false);
      if (pdfImportRef.current) pdfImportRef.current.value = '';
    }
  }, [apiKey, showToast]);

  /* ── download PDF (Puppeteer serveur) ──────────────────────────────────── */
  const downloadPDF = useCallback(async () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setDlLoading(true);
    try {
      const html     = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
      const name     = candidateName || 'Talia';
      const filename = `CV_${name}.pdf`;

      const res = await fetch('/api/pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ html, filename }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur serveur ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('PDF téléchargé ✓', 'success');
    } catch (err) {
      console.error('[downloadPDF]', err);
      showToast('Erreur PDF — impression navigateur en secours', 'error');
      iframeRef.current?.contentWindow?.print();
    } finally {
      setDlLoading(false);
      setDlMenuOpen(false);
    }
  }, [candidateName, showToast]);

  /* ── download PNG ──────────────────────────────────────────────────────── */
  const downloadPNG = useCallback(async () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setDlLoading(true);
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      const cvEl = doc.querySelector('.cv-wrap') || doc.body;
      doc.designMode = 'off';
      const printStyle2 = doc.createElement('style');
      printStyle2.id = 'dsim-print';
      printStyle2.textContent = `
        .section-title { margin-top: 20px !important; padding-top: 5px !important; }
        .section-title:first-child { margin-top: 0 !important; }
        .exp-block, .form-block, .form-talia { margin-bottom: 9px !important; }
      `;
      doc.head.appendChild(printStyle2);
      await new Promise(r => setTimeout(r, 80));
      const canvas = await window.html2canvas(cvEl, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false });
      printStyle2.remove();
      doc.designMode = 'on';
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `CV_${candidateName || 'Talia'}.png`;
      a.click();
      showToast('PNG téléchargé ✓', 'success');
    } catch (err) { console.error(err); showToast('Erreur export PNG', 'error'); }
    finally { setDlLoading(false); setDlMenuOpen(false); }
  }, [candidateName, showToast]);

  /* ── zoom ──────────────────────────────────────────────────────────────── */
  const scaledW = Math.ceil(CV_W * zoom);
  const scaledH = Math.ceil(CV_H * zoom);

  /* ═══════════════════════════════════════════════════════════════════════ */
  const ED_TABS = [
    { key: 'media',       icon: <IconCamera />,     label: 'Médias' },
    { key: 'identite',    icon: <IconUser />,        label: 'Identité' },
    { key: 'experiences', icon: <IconBriefcase />,   label: 'Expériences' },
    { key: 'formations',  icon: <IconCap />,         label: 'Formations' },
    { key: 'competences', icon: <IconSparkle />,     label: 'Profil' },
    { key: 'ordre',       icon: <IconMove />,        label: 'Ordre' },
  ];

  /* ─── Template thumbnail SVG ──────────────────────────────────────────── */
  function TemplateThumbnail({ id }) {
    const thumbs = {
      classic: (
        <svg viewBox="0 0 60 80" width="60" height="80">
          <rect x="0" y="0" width="60" height="80" rx="2" fill="#F7F8FA"/>
          <rect x="0" y="0" width="18" height="80" rx="2" fill="#0B1638"/>
          <rect x="22" y="6" width="32" height="4" rx="1" fill="#CBD0DC"/>
          <rect x="22" y="12" width="22" height="2.5" rx="1" fill="#E5E6EC"/>
          <rect x="22" y="20" width="32" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="22" y="24" width="28" height="1.5" rx="1" fill="#E5E6EC"/>
          <rect x="22" y="27" width="26" height="1.5" rx="1" fill="#E5E6EC"/>
          <rect x="22" y="34" width="32" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="22" y="38" width="28" height="1.5" rx="1" fill="#E5E6EC"/>
          <rect x="22" y="41" width="24" height="1.5" rx="1" fill="#E5E6EC"/>
          <rect x="22" y="50" width="32" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="22" y="54" width="26" height="1.5" rx="1" fill="#E5E6EC"/>
          <rect x="3" y="4" width="12" height="14" rx="1" fill="rgba(255,255,255,0.12)"/>
          <rect x="4" y="22" width="10" height="1.5" rx="0.5" fill="rgba(255,255,255,0.3)"/>
          <rect x="4" y="25" width="10" height="1" rx="0.5" fill="rgba(255,255,255,0.18)"/>
          <rect x="4" y="27" width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.18)"/>
        </svg>
      ),
      compact: (
        <svg viewBox="0 0 60 80" width="60" height="80">
          <rect x="0" y="0" width="60" height="80" rx="2" fill="#fff" stroke="#ECEDF1" strokeWidth="1"/>
          {/* Header: photo gauche + infos droite */}
          <rect x="3" y="4" width="11" height="14" rx="1" fill="#0B1638"/>
          <rect x="17" y="5" width="28" height="4" rx="1" fill="#0B1638"/>
          <rect x="17" y="11" width="18" height="2" rx="1" fill="#0B1638" opacity="0.5"/>
          <rect x="17" y="15" width="30" height="1.5" rx="0.5" fill="#CBD0DC"/>
          {/* Contacts bar */}
          <rect x="0" y="21" width="60" height="5" rx="0" fill="#0B1638"/>
          <rect x="3" y="23" width="40" height="1.5" rx="0.5" fill="rgba(255,255,255,0.4)"/>
          {/* Compétences */}
          <rect x="3" y="30" width="54" height="1.5" rx="0.5" fill="#0B1638" opacity="0.6"/>
          <rect x="3" y="33" width="16" height="4" rx="1" fill="#E5E6EC"/>
          <rect x="21" y="33" width="16" height="4" rx="1" fill="#E5E6EC"/>
          <rect x="39" y="33" width="16" height="4" rx="1" fill="#E5E6EC"/>
          {/* Expériences */}
          <rect x="3" y="42" width="54" height="1.5" rx="0.5" fill="#0B1638" opacity="0.6"/>
          <rect x="3" y="46" width="32" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="3" y="50" width="28" height="1" rx="0.5" fill="#E5E6EC"/>
          <rect x="3" y="52" width="30" height="1" rx="0.5" fill="#E5E6EC"/>
          <rect x="3" y="54" width="26" height="1" rx="0.5" fill="#E5E6EC"/>
          {/* Formations */}
          <rect x="3" y="60" width="54" height="1.5" rx="0.5" fill="#0B1638" opacity="0.6"/>
          <rect x="3" y="64" width="30" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="3" y="68" width="24" height="1.5" rx="0.5" fill="#E5E6EC"/>
        </svg>
      ),
      minimal: (
        <svg viewBox="0 0 60 80" width="60" height="80">
          <rect x="0" y="0" width="60" height="80" rx="2" fill="#fff" stroke="#ECEDF1" strokeWidth="1"/>
          {/* Bande colorée header */}
          <rect x="0" y="0" width="60" height="20" rx="2" fill="#0B1638"/>
          {/* Prénom (gauche de la photo) */}
          <rect x="5" y="7" width="16" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
          {/* Photo cercle (centre, overflow) */}
          <circle cx="30" cy="14" r="7" fill="#1a3a5c" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
          {/* Nom (droite de la photo) */}
          <rect x="39" y="7" width="16" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
          {/* Poste sous la bande */}
          <rect x="18" y="16" width="24" height="2.5" rx="1" fill="rgba(255,255,255,0.45)"/>
          {/* Contacts sous la bande */}
          <rect x="10" y="23" width="40" height="1.5" rx="0.5" fill="#0B1638" opacity="0.4"/>
          {/* Accroche */}
          <rect x="3" y="27" width="2" height="10" rx="1" fill="#0B1638" opacity="0.4"/>
          <rect x="7" y="28" width="30" height="1" rx="0.5" fill="#CBD0DC"/>
          <rect x="7" y="31" width="26" height="1" rx="0.5" fill="#E5E6EC"/>
          <rect x="7" y="34" width="28" height="1" rx="0.5" fill="#E5E6EC"/>
          {/* Section exp */}
          <rect x="3" y="42" width="36" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="3" y="46" width="30" height="1.5" rx="0.5" fill="#E5E6EC"/>
          <rect x="3" y="49" width="26" height="1.5" rx="0.5" fill="#E5E6EC"/>
          <rect x="3" y="58" width="36" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="3" y="62" width="28" height="1.5" rx="0.5" fill="#E5E6EC"/>
          {/* Sidebar light */}
          <rect x="44" y="42" width="13" height="2" rx="1" fill="#CBD0DC"/>
          <rect x="44" y="46" width="11" height="1" rx="0.5" fill="#E5E6EC"/>
          <rect x="44" y="48" width="10" height="1" rx="0.5" fill="#E5E6EC"/>
          <rect x="44" y="50" width="12" height="1" rx="0.5" fill="#E5E6EC"/>
        </svg>
      ),
    };
    return thumbs[id] || null;
  }

  /* ── Écran vide : aucun CV en mémoire ─────────────────────────────────── */
  if (noCVState) {
    return (
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.surface, fontFamily:"'Manrope',sans-serif", gap:20 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');`}</style>
        <div style={{ width:72, height:72, borderRadius:20, background:C.blueSoft, color:C.bluePrimary, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:700, color:C.ink, marginBottom:8 }}>Aucun CV en mémoire</div>
          <div style={{ fontSize:14, color:C.mute, maxWidth:320, lineHeight:1.6 }}>Génère un premier CV depuis la page d'accueil pour pouvoir l'éditer ici.</div>
        </div>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', background:C.ink, color:'#fff', border:'none', borderRadius:99, fontSize:14, fontWeight:600, cursor:'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Générer un CV
        </button>
        <button
          onClick={() => pdfImportRef.current?.click()}
          disabled={pdfImportLoading}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', background:'#fff', color:C.ink, border:`1.5px solid ${C.rule}`, borderRadius:99, fontSize:14, fontWeight:600, cursor:'pointer' }}
        >
          {pdfImportLoading
            ? <><span style={{ width:14, height:14, border:'2px solid rgba(11,16,32,.2)', borderTopColor:C.ink, borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} /> Analyse en cours…</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Importer un CV PDF</>
          }
        </button>
        <input
          ref={pdfImportRef}
          type="file"
          accept="application/pdf"
          style={{ display:'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) importPDF(f); }}
        />
      </div>
    );
  }

  /* ── Score bubbles data ── */
  const { pct: scorePct, tips: scoreTips } = useMemo(
    () => calcBananaScore(cvData, { photo: croppedPhoto }),
    [cvData, croppedPhoto]
  );
  const scoreLevel = getBananaLevel(scorePct);

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:"'Manrope',sans-serif", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes savePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        * { box-sizing: border-box; }
        .ed-input {
          width: 100%; padding: 10px 12px; border: 1px solid #ECEDF1; border-radius: 10px;
          font-size: 13px; font-family: 'Manrope', sans-serif; outline: none;
          background: #fff; color: #0B1020; transition: border-color .15s;
        }
        .ed-input:focus { border-color: #1539B7; }
        .ed-textarea {
          width: 100%; padding: 10px 12px; border: 1px solid #ECEDF1; border-radius: 10px;
          font-size: 13px; font-family: 'Manrope', sans-serif; outline: none; resize: vertical;
          min-height: 72px; background: #fff; color: #0B1020; transition: border-color .15s;
        }
        .ed-textarea:focus { border-color: #1539B7; }
        .ed-label {
          font-size: 11.5px; font-weight: 500; color: #3A4156;
          margin-bottom: 5px; display: block;
        }
        .add-btn {
          width: 100%; padding: 9px; border: 1.5px dashed #ECEDF1; border-radius: 10px;
          background: none; font-size: 12.5px; color: #9AA0AE; cursor: pointer;
          font-family: 'Manrope', sans-serif; font-weight: 500; transition: all .15s;
        }
        .add-btn:hover { border-color: #1539B7; color: #1539B7; }
        .rem-btn {
          width: 26px; height: 26px; border: none; border-radius: 6px; background: #FEE2E2;
          color: #DC2626; font-size: 14px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; transition: background .15s;
        }
        .rem-btn:hover { background: #FECACA; }
        .ai-btn {
          display: flex; align-items: center; gap: 5px; padding: 5px 10px;
          border: 1px solid #ECEDF1; border-radius: 99px; background: #EEF2FF;
          font-size: 11.5px; font-weight: 600; color: #1539B7; cursor: pointer;
          font-family: 'Manrope', sans-serif; transition: all .15s;
        }
        .ai-btn:hover:not(:disabled) { background: #D4DCFF; }
        .ai-btn:disabled { opacity: .5; cursor: not-allowed; }
        .acc-btn {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 11px 16px; border: none; background: none; cursor: pointer; font-size: 12.5px;
          font-weight: 600; color: #0B1020; text-align: left; border-bottom: 1px solid #ECEDF1;
          font-family: 'Manrope', sans-serif;
        }
        .acc-btn:hover { background: #F7F8FA; }
        .float-toolbar {
          position: fixed; z-index: 500; display: flex; align-items: center; gap: 2px;
          background: #111827; color: #fff; border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,.3); padding: 4px 8px;
          border: 1px solid rgba(255,255,255,.1);
        }
        .ft-btn { padding:3px 6px; border-radius:5px; background:none; border:none; color:#fff; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; min-width:24px; height:26px; }
        .ft-btn:hover { background: rgba(255,255,255,.18); }
        .ft-sep { width:1px; height:16px; background:rgba(255,255,255,.2); margin:0 3px; }
        .pal-swatch { width:24px; height:24px; border-radius:8px; cursor:pointer; transition:transform .15s,box-shadow .15s; border:2.5px solid transparent; }
        .pal-swatch:hover { transform:scale(1.12); }
        .pal-swatch.active { border-color:#F5B400; box-shadow:0 0 0 1px #0B1638; }
        .topbar-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 12px;
          border: 1px solid #ECEDF1; border-radius: 10px; background: #fff; color: #3A4156;
          font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: 'Manrope', sans-serif;
          transition: all .15s; white-space: nowrap;
        }
        .topbar-btn:hover { border-color: #1539B7; color: #1539B7; }
        .topbar-icon-btn {
          display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;
          border: 1px solid #ECEDF1; border-radius: 10px; background: #fff; color: #3A4156;
          cursor: pointer; transition: all .15s;
        }
        .topbar-icon-btn:hover { border-color: #1539B7; color: #1539B7; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ECEDF1; border-radius: 4px; }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header style={{ background:'#fff', height:56, display:'flex', alignItems:'center', padding:'0 20px', gap:10, flexShrink:0, borderBottom:`1px solid ${C.rule}` }}>
        {/* Logo */}
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:C.ink, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:C.ink }}>Talia<span style={{ color:C.bluePrimary }}>CV</span></span>
        </button>
        <div style={{ width:1, height:22, background:C.rule, flexShrink:0, marginRight:2 }} />

        {/* ── Lien Historique ── */}
        <button
          onClick={() => navigate('/history')}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'none', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, color:C.mute, fontFamily:"'Manrope',sans-serif", transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.ink; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.mute; }}
          title="Voir tous les CV sauvegardés"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Historique
        </button>

        {/* ── Bouton profil → ouvre la modale ── */}
        <button
          onClick={() => setProfileModalOpen(true)}
          title="Profil personnalité — oriente les reformulations IA"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: "'Manrope',sans-serif",
            background: activeProfile ? '#EEF2FF' : 'none',
            border: `1px solid ${activeProfile ? '#1539B733' : 'transparent'}`,
            color: activeProfile ? '#1539B7' : C.mute,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { if (!activeProfile) { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.ink; } }}
          onMouseLeave={e => { if (!activeProfile) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.mute; } }}
        >
          <span style={{ fontSize: 14 }}>{activeProfile ? activeProfile.emoji : '🧠'}</span>
          <span>{activeProfile ? activeProfile.nom : 'Profil IA'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* ── Retour au lot bulk ── */}
        {hasBulkSession && (
          <button
            onClick={() => {
              sessionStorage.setItem('talia_bulk_returning', '1');
              navigate('/bulk');
            }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 11px', background:'#EEF2FF', border:'1px solid #1539B733', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, color:'#1539B7', fontFamily:'Manrope,sans-serif', flexShrink:0, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#D4DCFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#EEF2FF'; }}
            title="Retourner à la session de génération en masse"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3L5 7L9 11"/><path d="M5 7h11a4 4 0 010 8h-1"/>
            </svg>
            Retour au lot
          </button>
        )}

        {/* ── CV Switcher ── */}
        <div ref={cvPickerRef} style={{ position:'relative', flexShrink:0 }}>
          <button
            onClick={() => setCvPickerOpen(v => !v)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background: cvPickerOpen ? C.surface : 'none', border:'1px solid '+(cvPickerOpen ? C.rule : 'transparent'), borderRadius:8, cursor:'pointer', maxWidth:220, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.rule; }}
            onMouseLeave={e => { if (!cvPickerOpen) { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; } }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.8" style={{ flexShrink:0 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={{ fontSize:13, color:C.ink, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {candidateName || 'Sélectionner un CV'}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink:0, transform: cvPickerOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke={C.mute} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Dropdown */}
          {cvPickerOpen && (() => {
            const hist = getHistorySync();
            return (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, width:300, background:'#fff', border:'1px solid '+C.rule, borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:1000, overflow:'hidden' }}>
                <div style={{ padding:'10px 14px 6px', fontSize:11, fontWeight:700, color:C.mute, textTransform:'uppercase', letterSpacing:'.08em', borderBottom:'1px solid '+C.rule }}>
                  Historique — {hist.length} CV{hist.length > 1 ? 's' : ''}
                </div>
                <div style={{ maxHeight:320, overflowY:'auto' }}>
                  {hist.length === 0 && (
                    <div style={{ padding:'20px 14px', fontSize:12, color:C.mute, textAlign:'center' }}>Aucun CV dans l'historique</div>
                  )}
                  {hist.map(entry => {
                    const isCurrent = String(entry.id) === String(routeId) || (!routeId && entry.name === candidateName);
                    return (
                      <button
                        key={entry.id}
                        onClick={() => { navigate('/editor/' + entry.id); setCvPickerOpen(false); }}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 14px', background: isCurrent ? C.blueSoft : 'none', border:'none', borderBottom:'1px solid '+C.rule, cursor:'pointer', textAlign:'left', transition:'background .1s' }}
                        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = C.surface; }}
                        onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'none'; }}
                      >
                        <div style={{ width:32, height:38, borderRadius:6, background: isCurrent ? C.bluePrimary : C.ink, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:700, color: isCurrent ? C.bluePrimary : C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {entry.name}
                            {isCurrent && <span style={{ marginLeft:6, fontSize:10, background:C.bluePrimary, color:'#fff', padding:'1px 6px', borderRadius:99, verticalAlign:'middle' }}>ouvert</span>}
                          </div>
                          <div style={{ fontSize:10, color:C.mute, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {entry.data?.poste || entry.formation || '—'} · {entry.date}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding:'8px 14px', borderTop:'1px solid '+C.rule, display:'flex', gap:8 }}>
                  <button onClick={() => { navigate('/'); setCvPickerOpen(false); }} style={{ flex:1, padding:'7px 0', background:C.surface, border:'1px solid '+C.rule, borderRadius:8, fontSize:11, fontWeight:600, color:C.ink2, cursor:'pointer', fontFamily:'inherit' }}>
                    Voir tous mes CV →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ flex:1 }} />

        {/* Save status */}
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: isDirty ? '#ef4444' : C.ok, fontWeight:500, flexShrink:0, transition:'color .3s' }}>
          <span style={{
            width:7, height:7, borderRadius:'50%', display:'inline-block', transition:'background .3s',
            background: isDirty ? '#ef4444' : C.ok,
            animation: isDirty ? 'savePulse 1.4s ease-in-out infinite' : 'none',
          }} />
          {isDirty
            ? 'Modifications non sauvegardées'
            : lastSavedAt
              ? `Enregistré · ${new Date(lastSavedAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`
              : 'Tout est enregistré'
          }
        </div>

        {/* Badge CRM si embarqué */}
        {crmEmbedded && crmCandidate && (
          <div style={{ marginLeft:10, display:'flex', alignItems:'center', gap:6, padding:'4px 12px', background:'linear-gradient(135deg, #ecfdf5, #d1fae5)', border:'1px solid #6ee7b7', borderRadius:99, fontSize:11.5, fontWeight:700, color:'#065f46' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
            CRM · {crmCandidate.prenom || ''} {crmCandidate.nom || ''}
          </div>
        )}

        <div style={{ flex:1 }} />

        {/* Tools */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button className="topbar-btn" onClick={saveCurrentToHist} title="Sauvegarder (Ctrl+S)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Sauvegarder
          </button>

          <button
            onClick={validateAndExit}
            title={hasBulkSession ? 'Valider et revenir au lot' : 'Valider et terminer'}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 14px', border:'none', borderRadius:10,
              background:'linear-gradient(135deg, #22c55e, #15803d)', color:'#fff',
              fontSize:12.5, fontWeight:700, cursor:'pointer',
              fontFamily:"'Manrope',sans-serif",
              boxShadow:'0 2px 8px rgba(34,197,94,0.25)',
              transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(34,197,94,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(34,197,94,0.25)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Valider
          </button>

          <button
            className="topbar-icon-btn"
            title="Historique des versions"
            onClick={() => {
              const vs = getVersions(currentHistId);
              setHistoryVersions(vs);
              setHistoryOpen(true);
            }}
            style={{ position:'relative' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {getVersions(currentHistId).length > 0 && (
              <span style={{ position:'absolute', top:2, right:2, width:7, height:7, borderRadius:'50%', background:C.bluePrimary, border:'1.5px solid #fff' }} />
            )}
          </button>

          <div style={{ display:'flex', gap:4 }}>
            <button
              className="topbar-icon-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Annuler Ctrl+Z"
              style={{ opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'default' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            </button>
            <button
              className="topbar-icon-btn"
              onClick={redo}
              disabled={!canRedo}
              title="Rétablir Ctrl+Y"
              style={{ opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'default' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{transform:'scaleX(-1)'}}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            </button>
          </div>

          {/* Focus mode */}
          <button
            className="topbar-icon-btn"
            onClick={toggleFocusMode}
            title={focusMode ? 'Quitter le focus (Échap)' : 'Focus — masquer les panneaux'}
            style={{ background: focusMode ? C.blueSoft : undefined, borderColor: focusMode ? C.bluePrimary : undefined, color: focusMode ? C.bluePrimary : undefined }}
          >
            {focusMode
              ? /* icône "exit fullscreen" */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></svg>
              : /* icône "fullscreen" */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            }
          </button>

          {/* Zoom */}
          <div style={{ display:'flex', alignItems:'center', gap:2, border:`1px solid ${C.rule}`, borderRadius:10, padding:'5px 8px', background:'#fff' }}>
            <button onClick={() => setZoom(z => Math.max(.35, parseFloat((z - .05).toFixed(2))))} style={{ background:'none', border:'none', color:C.ink2, cursor:'pointer', fontSize:15, lineHeight:1, padding:'0 2px' }}>−</button>
            <button
              onClick={() => setZoom(calcAutoZoom())}
              title="Ajuster à la fenêtre"
              style={{ background:'none', border:'none', cursor:'pointer', padding:'0 4px', display:'flex', alignItems:'center', color:C.mute }}
            >
              <span style={{ fontSize:11, fontWeight:700, color:C.ink, minWidth:32, textAlign:'center' }}>{Math.round(zoom*100)}%</span>
            </button>
            <button onClick={() => setZoom(z => Math.min(1.5, parseFloat((z + .05).toFixed(2))))} style={{ background:'none', border:'none', color:C.ink2, cursor:'pointer', fontSize:15, lineHeight:1, padding:'0 2px' }}>+</button>
            <div style={{ width:1, height:14, background:C.rule, margin:'0 4px' }} />
            <button
              onClick={() => setZoom(calcAutoZoom())}
              title="Ajuster à la fenêtre"
              style={{ background:'none', border:'none', cursor:'pointer', padding:'0 2px', display:'flex', alignItems:'center', color:C.mute, transition:'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.ink}
              onMouseLeave={e => e.currentTarget.style.color = C.mute}
            >
              {/* Icône "fit screen" */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>
          </div>

          {/* Import PDF */}
          <button
            className="topbar-btn"
            onClick={() => pdfImportRef.current?.click()}
            disabled={pdfImportLoading}
            title="Importer un CV existant depuis un PDF"
            style={{ opacity: pdfImportLoading ? 0.7 : 1 }}
          >
            {pdfImportLoading
              ? <><span style={{ width:11, height:11, border:'1.5px solid rgba(11,16,32,.2)', borderTopColor:C.ink, borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} /> Analyse…</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Importer PDF</>
            }
          </button>
          <input
            ref={pdfImportRef}
            type="file"
            accept="application/pdf"
            style={{ display:'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) importPDF(f); }}
          />

          {/* Valider — green */}
          <button
            onClick={validateAndExit}
            title={hasBulkSession ? 'Valider et revenir au lot' : 'Valider et terminer'}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 16px', border:'none', borderRadius:10,
              background:'linear-gradient(135deg, #22c55e, #15803d)', color:'#fff',
              fontSize:13, fontWeight:700, cursor:'pointer',
              fontFamily:"'Manrope',sans-serif",
              boxShadow:'0 2px 8px rgba(34,197,94,0.25)',
              transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(34,197,94,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(34,197,94,0.25)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Valider
          </button>

          {/* Download — yellow */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setDlMenuOpen(o => !o)}
              disabled={dlLoading}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', border:'none', borderRadius:10, background:C.star, color:C.ink, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Manrope',sans-serif", transition:'background .15s' }}
            >
              {dlLoading
                ? <><span style={{ width:12, height:12, border:'2px solid rgba(11,16,32,.3)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} /> Génération…</>
                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Télécharger</>
              }
            </button>
            {dlMenuOpen && (
              <div style={{ position:'absolute', right:0, top:'110%', background:'#fff', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,.12)', border:`1px solid ${C.rule}`, overflow:'hidden', zIndex:600, minWidth:140 }}>
                <button onClick={downloadPDF} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', fontSize:13, color:C.ink, fontWeight:600, fontFamily:"'Manrope',sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF
                </button>
                <button onClick={downloadPNG} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', fontSize:13, color:C.ink, fontWeight:600, fontFamily:"'Manrope',sans-serif", borderTop:`1px solid ${C.rule}` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> PNG
                </button>
              </div>
            )}
          </div>

          {/* Nouveau — dark */}
          <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', border:'none', borderRadius:99, background:C.ink, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Manrope',sans-serif" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau
          </button>
        </div>
      </header>

      {/* A4 overflow warning */}
      {overflowWarning && (
        <div style={{ background:'#DC2626', color:'#fff', padding:'8px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, zIndex:200, fontSize:12.5, fontWeight:600, gap:12 }}>
          <span style={{ display:'flex', alignItems:'center', gap:7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Contenu dépasse le format A4
          </span>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button onClick={optimizeSpace} style={{ padding:'4px 12px', border:'1.5px solid rgba(255,255,255,.7)', borderRadius:8, background:'rgba(255,255,255,.15)', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>Optimiser</button>
            <button onClick={() => setOverflowWarning(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.7)', cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
          </div>
        </div>
      )}

      {/* ── FOUR-COLUMN LAYOUT ────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ═══ Col 1 — Barre d'icônes fixe (56px / 0px focus) ═══ */}
        <nav style={{
          width: focusMode ? 0 : 56,
          flexShrink:0, background:'#fff',
          borderRight: focusMode ? 'none' : `1px solid ${C.rule}`,
          display:'flex', flexDirection:'column', alignItems:'center',
          paddingTop:10, paddingBottom:16, gap:2,
          overflow:'hidden',
          transition:'width .25s cubic-bezier(.16,.84,.24,1)',
        }}>
          {ED_TABS.map(tab => {
            const isOpen = edTab === tab.key && !formCollapsed;
            return (
              <button
                key={tab.key}
                title={tab.label}
                onClick={() => {
                  if (isOpen) {
                    setFormCollapsed(true);
                  } else {
                    setEdTab(tab.key);
                    setFormCollapsed(false);
                    if (tab.key === 'media' || tab.key === 'ordre') deactivateFocus();
                    else activateFocus(tab.key);
                  }
                }}
                style={{
                  width:40, height:40, borderRadius:10, border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isOpen ? C.blueSoft : 'none',
                  color: isOpen ? C.bluePrimary : C.mute,
                  position:'relative', transition:'background .15s, color .15s',
                  flexShrink:0,
                }}
              >
                {tab.icon}
                {isOpen && (
                  <span style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', width:3, height:20, borderRadius:'2px 0 0 2px', background:C.bluePrimary }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* ═══ Col 2 — Formulaire (slide 0 → 360px) ═══ */}
        <aside style={{
          width: formCollapsed ? 0 : 360,
          flexShrink:0,
          borderRight: formCollapsed ? 'none' : `1px solid ${C.rule}`,
          display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff',
          transition:'width .25s cubic-bezier(.16,.84,.24,1)',
        }}>
          {/* Focus mode badge */}
          {focusActive && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 16px', background:C.navy, flexShrink:0, minWidth:360 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:C.star, display:'inline-block' }} />
                <span style={{ fontSize:11, fontWeight:700, color:'#fff', letterSpacing:'0.5px' }}>Mode Focus actif</span>
              </div>
              <button onClick={deactivateFocus} style={{ background:'none', border:'none', color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:16, lineHeight:1, padding:0 }}>×</button>
            </div>
          )}

          <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 32px', minWidth:360 }}>

            {/* ── Médias ─────────────────────────────────────────── */}
            {edTab === 'media' && (
              <div>
                <SectionHeader icon={<IconCamera />} title="Médias" subtitle="Photo de profil et logo d'établissement" />

                {/* Photo candidat */}
                <div style={{ marginBottom:20 }}>
                  <label className="ed-label">Photo du candidat</label>
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', border:`1.5px dashed ${croppedPhoto ? C.bluePrimary : C.rule}`, borderRadius:12, cursor:'pointer', background: croppedPhoto ? C.blueSoft : C.surface, transition:'all .2s' }}
                  >
                    <div style={{ width:72, height:72, borderRadius:10, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.04)', color:C.mute }}>
                      {croppedPhoto
                        ? <img src={croppedPhoto} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="photo" />
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color: croppedPhoto ? C.bluePrimary : C.ink2, marginBottom:3 }}>
                        {croppedPhoto ? 'Changer la photo' : 'Choisir ou glisser une photo'}
                      </div>
                      <div style={{ fontSize:11.5, color:C.mute }}>JPG, PNG, WEBP · recadrage automatique</div>
                      {croppedPhoto && (
                        <button
                          onClick={e => { e.stopPropagation(); setCroppedPhoto(''); const doc=iframeRef.current?.contentDocument; if(doc) { const el=doc.querySelector('.block-photo'); if(el) el.innerHTML='<div class="photo-placeholder-wrap"><div class="photo-placeholder-inner"><span>👤</span></div></div>'; } }}
                          style={{ marginTop:4, fontSize:11, color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:"'Manrope',sans-serif" }}
                        >Supprimer</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logo entreprise */}
                <div>
                  <label className="ed-label">Logo entreprise / école</label>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', border:`1.5px dashed ${logoDataURL ? C.bluePrimary : C.rule}`, borderRadius:12, cursor:'pointer', background: logoDataURL ? C.blueSoft : C.surface, transition:'all .2s' }}
                  >
                    <div style={{ width:72, height:52, borderRadius:8, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.04)', color:C.mute }}>
                      {logoDataURL
                        ? <img src={logoDataURL} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} alt="logo" />
                        : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color: logoDataURL ? C.bluePrimary : C.ink2, marginBottom:3 }}>
                        {logoDataURL ? 'Changer le logo' : 'Choisir ou glisser un logo'}
                      </div>
                      <div style={{ fontSize:11.5, color:C.mute }}>PNG, SVG, JPG · fond transparent recommandé</div>
                      {logoDataURL && (
                        <button
                          onClick={e => { e.stopPropagation(); setLogoDataURL(''); const doc=iframeRef.current?.contentDocument; if(doc) { const el=doc.querySelector('.logo-zone'); if(el) el.innerHTML='<span class="logo-placeholder-text">Logo<br>Talia</span>'; } }}
                          style={{ marginTop:4, fontSize:11, color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:"'Manrope',sans-serif" }}
                        >Supprimer</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Identité ───────────────────────────────────────── */}
            {edTab === 'identite' && edFields && (
              <div>
                <SectionHeader icon={<IconUser />} title="Identité" subtitle="Informations personnelles et accroche" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label className="ed-label">Prénom</label><input className="ed-input" value={edFields.prenom||''} onChange={e => handleEdField('prenom', e.target.value)} /></div>
                  <div><label className="ed-label">Nom</label><input className="ed-input" value={edFields.nom||''} onChange={e => handleEdField('nom', e.target.value)} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label className="ed-label">Date de naissance</label><input className="ed-input" value={edFields.dateNaissance||''} onChange={e => handleEdField('dateNaissance', e.target.value)} placeholder="JJ/MM/AAAA" /></div>
                  <div><label className="ed-label">Ville / Adresse</label><input className="ed-input" value={edFields.adresse||''} onChange={e => handleEdField('adresse', e.target.value)} /></div>
                </div>
                <div style={{ marginBottom:12 }}><label className="ed-label">Email</label><input className="ed-input" value={edFields.email||''} onChange={e => handleEdField('email', e.target.value)} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                  <div><label className="ed-label">Téléphone</label><input className="ed-input" value={edFields.telephone||''} onChange={e => handleEdField('telephone', e.target.value)} /></div>
                  <div><label className="ed-label">LinkedIn</label><input className="ed-input" value={edFields.linkedin||''} onChange={e => handleEdField('linkedin', e.target.value)} /></div>
                </div>
                <div style={{ borderTop:`1px solid ${C.rule}`, paddingTop:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <label className="ed-label" style={{ marginBottom:0 }}>Accroche professionnelle</label>
                    <button className="ai-btn" disabled={aiLoading} onClick={() => regenSection('accroche')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {aiLoading && aiSection==='accroche' ? 'En cours…' : 'Suggérer (IA)'}
                    </button>
                  </div>
                  <textarea className="ed-textarea" value={edFields.accroche||''} onChange={e => handleEdField('accroche', e.target.value)} rows={4} />
                </div>
              </div>
            )}

            {/* ── Expériences ────────────────────────────────────── */}
            {edTab === 'experiences' && edFields && (
              <div>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.rule}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'#EEF2FF', color:'#1539B7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IconBriefcase /></div>
                    <div>
                      <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:C.ink, letterSpacing:'-0.5px' }}>Expériences</h2>
                      <p style={{ margin:'4px 0 0', fontSize:13, color:C.mute }}>Parcours professionnel</p>
                    </div>
                  </div>
                  <button className="ai-btn" disabled={aiLoading} onClick={() => regenSection('experiences')} style={{ flexShrink:0, marginTop:4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {aiLoading && aiSection==='experiences' ? 'En cours…' : 'IA'}
                  </button>
                </div>
                {(edFields.experiences||[]).map((exp, i) => (
                  <div key={i} style={{ border:`1px solid ${C.rule}`, borderRadius:12, padding:'14px 14px 12px', marginBottom:10, position:'relative', background:'#fff' }}>
                    <button className="rem-btn" onClick={() => removeEdListItem('experiences', i)} style={{ position:'absolute', top:10, right:10 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label className="ed-label">Poste</label><input className="ed-input" value={exp.poste||''} onChange={e => handleEdListItem('experiences', i, 'poste', e.target.value)} /></div>
                      <div><label className="ed-label">Entreprise</label><input className="ed-input" value={exp.entreprise||''} onChange={e => handleEdListItem('experiences', i, 'entreprise', e.target.value)} /></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label className="ed-label">Lieu</label><input className="ed-input" value={exp.lieu||''} onChange={e => handleEdListItem('experiences', i, 'lieu', e.target.value)} /></div>
                      <div><label className="ed-label">Période</label><input className="ed-input" value={exp.periode||''} onChange={e => handleEdListItem('experiences', i, 'periode', e.target.value)} /></div>
                    </div>
                    <label className="ed-label" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span>Missions</span>
                      <span style={{ fontSize:10, color:C.mute, fontWeight:500, textTransform:'none', letterSpacing:0 }}>
                        {(exp.missions||[]).length} {(exp.missions||[]).length>1?'missions':'mission'} · clique sur ✨ pour reformuler
                      </span>
                    </label>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {(exp.missions||[]).map((m, mIdx) => (
                        <div key={mIdx} style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
                          <span style={{ fontSize:11, color:C.mute, fontWeight:700, marginTop:9, flexShrink:0, width:18, textAlign:'center' }}>•</span>
                          <textarea
                            className="ed-input"
                            rows={1}
                            value={m}
                            onChange={e => {
                              const newMissions = [...(exp.missions||[])];
                              newMissions[mIdx] = e.target.value;
                              handleEdListItem('experiences', i, 'missions', newMissions);
                            }}
                            style={{ flex:1, minHeight:32, resize:'vertical', fontFamily:'inherit', lineHeight:1.5, padding:'7px 10px' }}
                            placeholder="Décris une mission concrète…"
                          />
                          <button
                            type="button"
                            onClick={() => reformulateMission(i, mIdx)}
                            disabled={!m.trim() || (reformOpen && reformOpen.loading)}
                            title="Reformuler avec l'IA (3 variantes)"
                            style={{
                              flexShrink:0, width:30, height:30, borderRadius:8,
                              background:'linear-gradient(135deg, #EEF2FF, #f5f3ff)',
                              border:'1px solid #7c3aed44', color:'#7c3aed',
                              cursor: m.trim() ? 'pointer' : 'not-allowed',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              opacity: m.trim() ? 1 : 0.4, transition:'all .15s', marginTop:1,
                            }}
                            onMouseEnter={e => { if (m.trim()) e.currentTarget.style.transform='scale(1.08)'; }}
                            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2l1.88 5.76L20 9l-4.5 4.39 1.06 6.17L12 16.77l-4.56 2.79L8.5 13.39 4 9l6.12-1.24L12 2z"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newMissions = (exp.missions||[]).filter((_, x) => x !== mIdx);
                              handleEdListItem('experiences', i, 'missions', newMissions);
                            }}
                            title="Supprimer cette mission"
                            style={{
                              flexShrink:0, width:30, height:30, borderRadius:8,
                              background:'#fff', border:'1px solid '+C.rule, color:C.mute,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                              transition:'all .15s', marginTop:1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='#fca5a5'; }}
                            onMouseLeave={e => { e.currentTarget.style.color=C.mute; e.currentTarget.style.borderColor=C.rule; }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleEdListItem('experiences', i, 'missions', [...(exp.missions||[]), ''])}
                        style={{
                          alignSelf:'flex-start', padding:'5px 12px', fontSize:11.5, fontWeight:600,
                          background:'#fff', border:'1px dashed '+C.rule, borderRadius:8, color:C.ink2,
                          cursor:'pointer', fontFamily:'inherit', marginTop:2,
                        }}
                      >+ Ajouter une mission</button>
                    </div>
                  </div>
                ))}
                <button className="add-btn" onClick={() => addEdListItem('experiences', { poste:'', entreprise:'', lieu:'', periode:'', missions:[''] })}>
                  + Ajouter une expérience
                </button>
              </div>
            )}

            {/* ── Formations ─────────────────────────────────────── */}
            {edTab === 'formations' && edFields && (
              <div>
                <SectionHeader icon={<IconCap />} title="Formations" subtitle="Cursus académiques et certifications" />
                {(edFields.formations||[]).map((f, i) => (
                  <div key={i} style={{ border:`1px solid ${C.rule}`, borderRadius:12, padding:'14px 14px 12px', marginBottom:10, position:'relative', background: f.isTalia ? '#F0F5FC' : '#fff' }}>
                    <button className="rem-btn" onClick={() => removeEdListItem('formations', i)} style={{ position:'absolute', top:10, right:10 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    {f.isTalia && <span style={{ fontSize:11, color:C.bluePrimary, fontWeight:700, marginBottom:8, display:'block' }}>Formation Talia</span>}
                    <div style={{ marginBottom:10 }}><label className="ed-label">Titre</label><input className="ed-input" value={f.titre||''} onChange={e => handleEdListItem('formations', i, 'titre', e.target.value)} /></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div><label className="ed-label">Établissement</label><input className="ed-input" value={f.etablissement||''} onChange={e => handleEdListItem('formations', i, 'etablissement', e.target.value)} /></div>
                      <div><label className="ed-label">Période</label><input className="ed-input" value={f.periode||''} onChange={e => handleEdListItem('formations', i, 'periode', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
                <button className="add-btn" onClick={() => addEdListItem('formations', { titre:'', etablissement:'', periode:'', isTalia:false })}>
                  + Ajouter une formation
                </button>
              </div>
            )}

            {/* ── Compétences + Langues + Intérêts (fusionnés) ─── */}
            {edTab === 'competences' && edFields && (
              <div>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${C.rule}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'#EEF2FF', color:'#1539B7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IconSparkle /></div>
                    <div>
                      <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:C.ink, letterSpacing:'-0.5px' }}>Profil</h2>
                      <p style={{ margin:'4px 0 0', fontSize:13, color:C.mute }}>Compétences, langues & intérêts</p>
                    </div>
                  </div>
                  <button className="ai-btn" disabled={aiLoading} onClick={() => regenSection('competences')} style={{ flexShrink:0, marginTop:4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {aiLoading && aiSection==='competences' ? 'En cours…' : 'IA'}
                  </button>
                </div>

                {/* ─ Compétences ─ */}
                <p style={{ fontSize:11, fontWeight:600, color:C.mute, letterSpacing:'1.4px', textTransform:'uppercase', margin:'0 0 10px' }}>Compétences</p>
                <div style={{ marginBottom:12 }}>
                  <label className="ed-label">Techniques (une par ligne)</label>
                  <textarea className="ed-textarea" rows={4} value={(edFields.competences?.techniques||[]).join('\n')} onChange={e => handleEdField('competences.techniques', e.target.value.split('\n').filter(Boolean))} />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className="ed-label">Comportementales (une par ligne)</label>
                  <textarea className="ed-textarea" rows={3} value={(edFields.competences?.comportementales||[]).join('\n')} onChange={e => handleEdField('competences.comportementales', e.target.value.split('\n').filter(Boolean))} />
                </div>
                <div style={{ marginBottom:24 }}>
                  <label className="ed-label">Outils (une par ligne)</label>
                  <textarea className="ed-textarea" rows={3} value={(edFields.competences?.outils||[]).join('\n')} onChange={e => handleEdField('competences.outils', e.target.value.split('\n').filter(Boolean))} />
                </div>

                {/* ─ Langues ─ */}
                <div style={{ borderTop:`1px solid ${C.rule}`, paddingTop:20, marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <IconGlobe />
                    <p style={{ fontSize:11, fontWeight:600, color:C.mute, letterSpacing:'1.4px', textTransform:'uppercase', margin:0 }}>Langues</p>
                  </div>
                  {(edFields.langues||[]).map((l, i) => (
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                      <div style={{ flex:2 }}><input className="ed-input" value={l.langue||''} onChange={e => handleEdListItem('langues', i, 'langue', e.target.value)} placeholder="Ex : Anglais" /></div>
                      <div style={{ flex:1 }}><input className="ed-input" value={l.niveau||''} onChange={e => handleEdListItem('langues', i, 'niveau', e.target.value)} placeholder="C1" /></div>
                      <button className="rem-btn" onClick={() => removeEdListItem('langues', i)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                  <button className="add-btn" onClick={() => addEdListItem('langues', { langue:'', niveau:'' })}>+ Ajouter une langue</button>
                </div>

                {/* ─ Intérêts ─ */}
                <div style={{ borderTop:`1px solid ${C.rule}`, paddingTop:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <IconHeart />
                    <p style={{ fontSize:11, fontWeight:600, color:C.mute, letterSpacing:'1.4px', textTransform:'uppercase', margin:0 }}>Intérêts</p>
                  </div>
                  <label className="ed-label">Un par ligne — Entrée pour ajouter</label>
                  <textarea
                    className="ed-textarea"
                    rows={5}
                    value={(edFields.centresInteret||[]).join('\n')}
                    onChange={e => handleEdField('centresInteret', e.target.value.split('\n'))}
                    onBlur={e => handleEdField('centresInteret', e.target.value.split('\n').filter(s => s.trim()))}
                  />
                </div>
              </div>
            )}

            {/* ── Ordre ──────────────────────────────────────────── */}
            {edTab === 'ordre' && (
              <div>
                <SectionHeader icon={<IconMove />} title="Ordre des sections" subtitle="Réorganise le contenu principal et la sidebar" />
                <SortableSections
                  order={sectionOrder}
                  onDragEnd={onSectionDragEnd}
                  addSection={addSection}
                  removeSection={removeSection}
                  onReset={resetSectionOrder}
                  sidebarOrder={sidebarOrder}
                  onSidebarDragEnd={onSidebarDragEnd}
                  onResetSidebar={resetSidebarOrder}
                />
                <div style={{ marginTop:16, padding:'12px 14px', background:C.surface, borderRadius:10, fontSize:12, color:C.mute, lineHeight:1.6 }}>
                  Le changement se répercute immédiatement dans l'aperçu.
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* ═══ Col 3 — Live Preview (flex 1) ═══ */}
        <main
          style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', background:C.surface }}
          onClick={() => { if (dlMenuOpen) setDlMenuOpen(false); }}
        >
          {/* Preview header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:`1px solid ${C.rule}`, background:'#fff', flexShrink:0 }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.mute, letterSpacing:'0.5px' }}>Aperçu en direct</span>
            <button
              onClick={() => setZoom(calcAutoZoom())}
              title="Ajuster à la fenêtre"
              style={{ fontSize:12, fontWeight:500, color:C.mute, background:'none', border:'none', cursor:'pointer', padding:'2px 6px', borderRadius:6, transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >A4 · {Math.round(zoom*100)}%</button>
          </div>
          {/* CV document + score bubbles */}
          <div style={{ flex:1, overflow:'auto', display:'flex', padding:'28px 16px 28px 12px', gap:14, alignItems:'flex-start' }}>

            {/* ── Score bubbles (left column) ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, width:210, flexShrink:0, position:'sticky', top:0 }}>

              {/* Bulle 1 — Score */}
              <div style={{ background:'#fff', borderRadius:16, padding:'16px 14px', boxShadow:'0 4px 24px rgba(0,0,0,0.10)', border:`1px solid ${C.rule}` }}>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.09em', color:C.mute, textTransform:'uppercase', marginBottom:14 }}>CV Score</div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {/* Cercle SVG */}
                  <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink:0 }}>
                    <circle cx="26" cy="26" r="21" fill="none" stroke={C.rule} strokeWidth="4"/>
                    <circle cx="26" cy="26" r="21" fill="none" stroke={scoreLevel.color} strokeWidth="4"
                      strokeDasharray={`${(scorePct/100)*131.9} 131.9`}
                      strokeLinecap="round"
                      transform="rotate(-90 26 26)"
                      style={{ transition:'stroke-dasharray .6s ease', filter:`drop-shadow(0 0 5px ${scoreLevel.color}55)` }}
                    />
                  </svg>
                  <div>
                    <div style={{ fontSize:24, fontWeight:900, color:C.ink, lineHeight:1 }}>
                      {scorePct}<span style={{ fontSize:12, fontWeight:600, color:C.mute }}>%</span>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:scoreLevel.color, marginTop:3 }}>{scoreLevel.emoji} {scoreLevel.label}</div>
                  </div>
                </div>
                {scorePct < 100 && (
                  <div style={{ marginTop:12, fontSize:10, color:C.mute, lineHeight:1.6, borderTop:`1px solid ${C.rule}`, paddingTop:10 }}>
                    <strong style={{ color:C.ink }}>{100 - scorePct} pts</strong> à gagner pour atteindre l'excellence.
                  </div>
                )}
                {scorePct === 100 && (
                  <div style={{ marginTop:12, fontSize:10, fontWeight:700, color:'#16a34a', borderTop:`1px solid ${C.rule}`, paddingTop:10 }}>🏆 CV parfait !</div>
                )}
              </div>

              {/* Bulle 2 — À faire ensuite */}
              {scoreTips.length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'14px', boxShadow:'0 4px 24px rgba(0,0,0,0.10)', border:`1px solid ${C.rule}` }}>
                  <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.09em', color:C.mute, textTransform:'uppercase', marginBottom:12 }}>À faire ensuite</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                    {scoreTips.slice(0, 4).map((tip, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                        <div style={{ width:15, height:15, borderRadius:'50%', border:`2px solid ${C.rule}`, flexShrink:0, marginTop:1 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:600, color:C.ink, lineHeight:1.35 }}>{tip.tip}</div>
                          <div style={{ fontSize:9.5, color:C.mute, marginTop:2 }}>{TIP_TIMES[tip.id] || '1 min'}</div>
                        </div>
                        <div style={{
                          fontSize:9.5, fontWeight:800, color:'#fff',
                          background:C.bluePrimary, borderRadius:5,
                          padding:'2px 6px', flexShrink:0, marginTop:1,
                        }}>+{tip.pts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── CV centré ── */}
            <div style={{ flex:1, display:'flex', justifyContent:'center', position:'relative' }}>
              {/* Badge focus mode */}
              {focusMode && (
                <button
                  onClick={toggleFocusMode}
                  style={{
                    position:'absolute', top:12, right:16, zIndex:20,
                    display:'flex', alignItems:'center', gap:6,
                    padding:'5px 10px', background:'rgba(11,22,56,0.7)', backdropFilter:'blur(6px)',
                    border:'none', borderRadius:8, cursor:'pointer', color:'rgba(255,255,255,0.85)',
                    fontSize:11, fontWeight:600, letterSpacing:'0.3px',
                    transition:'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(11,22,56,0.9)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(11,22,56,0.7)'}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></svg>
                  Quitter le focus
                  <span style={{ opacity:.55, fontSize:10 }}>Échap</span>
                </button>
              )}
              <div style={{ width:scaledW, minHeight:scaledH }}>
                <div style={{ width:CV_W, height:CV_H, transform:`scale(${zoom})`, transformOrigin:'top left' }}>
                  <div style={{ boxShadow:'0 20px 60px rgba(11,16,32,.14), 0 0 0 1px rgba(0,0,0,.04)', borderRadius:4, position:'relative' }}>
                    {sliderDragging && (
                      <div style={{ position:'absolute', inset:0, zIndex:10, cursor:'ew-resize' }} />
                    )}
                    <iframe
                      ref={iframeRef}
                      srcDoc={generatedHTML}
                      onLoad={handleIframeLoad}
                      sandbox="allow-same-origin allow-modals"
                      title="CV Talia"
                      style={{ width:CV_W, height:CV_H, border:'none', display:'block', background:'#fff' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ═══ Col 4 — Design panel (300px / 52px collapsed / 0px focus) ═══ */}
        <aside style={{
          width: focusMode ? 0 : (designCollapsed ? 52 : 300),
          flexShrink:0, background:'#fff',
          borderLeft: (focusMode) ? 'none' : `1px solid ${C.rule}`,
          display:'flex', flexDirection:'column', overflow:'hidden',
          transition:'width .22s cubic-bezier(.16,.84,.24,1)',
        }}>
          {/* Header with toggle */}
          <div style={{ padding: designCollapsed ? '14px 0' : '14px 16px', borderBottom:`1px solid ${C.rule}`, flexShrink:0, display:'flex', alignItems:'center', justifyContent: designCollapsed ? 'center' : 'space-between' }}>
            {!designCollapsed && (
              <span style={{ fontSize:12, fontWeight:600, color:C.mute, letterSpacing:'1.5px', textTransform:'uppercase' }}>Design</span>
            )}
            <button
              onClick={() => setDesignCollapsed(c => !c)}
              title={designCollapsed ? 'Déplier' : 'Replier'}
              style={{ width:26, height:26, border:`1px solid ${C.rule}`, borderRadius:8, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mute, transition:'all .15s', flexShrink:0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: designCollapsed ? 'rotate(180deg)' : 'none', transition:'transform .22s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Collapsed state — icon shortcuts */}
          {designCollapsed && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', paddingTop:12, gap:4 }}>
              {[
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, label:'Score' },
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>, label:'Couleurs' },
                { icon: <span style={{ fontSize:13, fontWeight:900, color:C.mute }}>T</span>, label:'Typo' },
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, label:'Templates' },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  onClick={() => setDesignCollapsed(false)}
                  title={label}
                  style={{ width:36, height:36, border:`1px solid ${C.rule}`, borderRadius:10, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mute, transition:'all .15s' }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}

          <div style={{ flex:1, overflowY:'auto', display: designCollapsed ? 'none' : 'block' }}>

            {/* Templates accordion */}
            <div style={{ borderTop:`1px solid ${C.rule}` }}>
              <button className="acc-btn" onClick={() => toggleAcc('templates')}>
                <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  Templates
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: designAcc.templates?'rotate(180deg)':'none', transition:'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {designAcc.templates && (
                <div style={{ padding:'14px 12px 16px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {TEMPLATES.map(tpl => {
                      const isActive = templateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => {
                            setTemplateId(tpl.id); // met aussi templateIdRef à jour (useStateRef)
                            localStorage.setItem('talia_template_id', tpl.id);
                            rerenderCV();
                          }}
                          style={{
                            display:'flex', flexDirection:'column', alignItems:'center', gap:7,
                            padding:'10px 8px', border: isActive ? `2px solid ${C.bluePrimary}` : `1px solid ${C.rule}`,
                            borderRadius:10, background: isActive ? C.blueSoft : '#fff',
                            cursor:'pointer', transition:'all .15s', fontFamily:"'Manrope',sans-serif",
                          }}
                        >
                          <div style={{ borderRadius:4, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.08)', border:`1px solid ${C.rule}` }}>
                            <TemplateThumbnail id={tpl.id} />
                          </div>
                          <div>
                            <div style={{ fontSize:11.5, fontWeight: isActive ? 700 : 600, color: isActive ? C.bluePrimary : C.ink, textAlign:'center' }}>{tpl.label}</div>
                            <div style={{ fontSize:10, color:C.mute, textAlign:'center', lineHeight:1.3 }}>{tpl.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Texture sidebar ─────────────────────────────────────────── */}
            <div style={{ borderTop:`1px solid ${C.rule}` }}>
              <button className="acc-btn" onClick={() => toggleAcc('texture')}>
                <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/><circle cx="6.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="9.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                  Texture sidebar
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: designAcc.texture?'rotate(180deg)':'none', transition:'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {designAcc.texture && (() => {
                const activeTx = SIDEBAR_TEXTURES.find(t => t.id === sidebarTextureId) || SIDEBAR_TEXTURES[0];
                const txColors = activeTx.colors || [];
                return (
                  <div style={{ padding:'14px 12px 16px' }}>
                    {/* Grille de swatches texture */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:16 }}>
                      {SIDEBAR_TEXTURES.map(tx => {
                        const isActive = sidebarTextureId === tx.id;
                        return (
                          <button
                            key={tx.id}
                            title={tx.label}
                            onClick={() => {
                              setSidebarTextureId(tx.id);
                              localStorage.setItem('talia_sidebar_texture_id', tx.id);
                              const resolved = SIDEBAR_TEXTURES.find(t => t.id === tx.id) || SIDEBAR_TEXTURES[0];
                              sidebarTextureRef.current = resolved;
                              // Auto-sélectionner la première couleur de la texture
                              const firstColor = resolved.colors?.[0] || selectedPalRef.current.c;
                              setSelectedPal({ ...selectedPalRef.current, c: firstColor, d: firstColor, titleColor: firstColor });
                              rerenderCV();
                            }}
                            style={{
                              border: isActive ? `2px solid ${C.bluePrimary}` : `1.5px solid ${C.rule}`,
                              borderRadius: 8, padding: 3, background: 'none',
                              cursor: 'pointer', transition: 'all .15s',
                            }}
                          >
                            <div style={{
                              height: 52, borderRadius: 5, overflow: 'hidden', position: 'relative',
                              background: tx.id === 'none'
                                ? (selectedPal.c || '#1a3a5c')
                                : (tx.photo ? `url("${tx.preview}") center/cover no-repeat` : (tx.preview || '#1a3a5c')),
                            }}>
                              <div style={{
                                position: 'absolute', inset: 0,
                                background: tx.dark === false
                                  ? 'linear-gradient(to top,rgba(255,255,255,0.55) 0%,transparent 60%)'
                                  : 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)',
                              }} />
                              <span style={{
                                position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
                                fontSize: 9, fontWeight: 700,
                                color: tx.dark === false ? '#222' : '#fff',
                                letterSpacing: '.04em', lineHeight: 1,
                                textShadow: tx.dark === false ? '0 1px 2px rgba(255,255,255,0.6)' : '0 1px 3px rgba(0,0,0,0.7)',
                              }}>{tx.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Couleurs texte sidebar (titres + corps) ── */}
                    {(templateId === 'classic' || templateId === 'minimal') && (() => {
                      const applyPalKey = (palKey, col) => {
                        setSelectedPal({ ...selectedPalRef.current, [palKey]: col });
                        rerenderCV();
                      };
                      const toHex = (color) => (!color || color.startsWith('rgba') || color.startsWith('rgb')) ? '#ffffff' : color;
                      const titleDef = templateId === 'classic' ? '#FFCC00' : '#ffffff';
                      const textDef  = '#ffffff';
                      const curTitle = toHex(selectedPal.sbTitleColor || titleDef);
                      const curText  = toHex(selectedPal.sbTextColor  || textDef);
                      return (
                        <div style={{ marginBottom:14, borderTop:`1px solid ${C.rule}`, paddingTop:12 }}>
                          <p style={{ fontSize:10, fontWeight:600, color:C.mute, letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 10px' }}>Texte sidebar</p>
                          {[
                            { label:'Titres', key:'sbTitleColor', val:curTitle },
                            { label:'Corps du texte', key:'sbTextColor', val:curText },
                          ].map(({ label, key, val }) => (
                            <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                              <span style={{ fontSize:11, color:C.ink2, fontWeight:500 }}>{label}</span>
                              <label style={{
                                width:30, height:30, borderRadius:7,
                                overflow:'hidden', position:'relative',
                                border:`1.5px solid ${C.rule}`, cursor:'pointer',
                                background: val, flexShrink:0, display:'block',
                              }}>
                                <input
                                  type="color"
                                  value={val}
                                  onChange={e => applyPalKey(key, e.target.value)}
                                  style={{ position:'absolute', inset:'-4px', width:'calc(100% + 8px)', height:'calc(100% + 8px)', opacity:0, cursor:'pointer', border:'none', padding:0 }}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {txColors.length > 0 && (
                      <div>
                        <p style={{ fontSize:10, fontWeight:600, color:C.mute, letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 8px' }}>Couleur de la sidebar</p>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                          {txColors.map(col => {
                            const isActive = (selectedPal.c || '#1a3a5c') === col;
                            return (
                              <button
                                key={col}
                                title={col}
                                onClick={() => {
                                  setSelectedPal({ ...selectedPalRef.current, c: col, d: col, titleColor: col });
                                  rerenderCV();
                                }}
                                style={{
                                  width: 26, height: 26, borderRadius: 8, background: col,
                                  border: isActive ? `2.5px solid ${C.bluePrimary}` : `2px solid transparent`,
                                  outline: isActive ? `1px solid ${C.ink}` : 'none',
                                  outlineOffset: 1,
                                  cursor: 'pointer', flexShrink: 0, transition: 'all .15s',
                                }}
                              />
                            );
                          })}
                          {/* Picker personnalisé */}
                          <label title="Couleur personnalisée" style={{
                            width: 26, height: 26, borderRadius: 8, border:`1.5px dashed ${C.rule}`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            cursor:'pointer', overflow:'hidden', flexShrink:0, background:'#fafafa',
                          }}>
                            <input type="color" value={selectedPal.c||'#1a3a5c'} onChange={e => {
                              const col = e.target.value;
                              setSelectedPal({ ...selectedPalRef.current, c: col, d: col, titleColor: col });
                              rerenderCV();
                            }} style={{ width:30, height:30, border:'none', padding:0, cursor:'pointer', opacity:0, position:'absolute' }} />
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Typography accordion */}
            <div style={{ borderTop:`1px solid ${C.rule}` }}>
              <button className="acc-btn" onClick={() => toggleAcc('typo')}>
                <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:C.bluePrimary }}>T</span> Typographie
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: designAcc.typo?'rotate(180deg)':'none', transition:'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {designAcc.typo && (
                <div style={{ padding:'12px 14px 16px' }}>
                  {[
                    { key:'presentation', label:'Présentation', min:8, max:15, hint:'accroche · nom · poste' },
                    { key:'exp', label:'Expériences', min:8, max:15, hint:'poste · missions · méta' },
                    { key:'form', label:'Formations', min:7, max:14, hint:'titre · établissement' },
                    { key:'sidebar', label:'Barre latérale', min:6.5, max:13, hint:'contact · compétences' },
                    ...(['compact','minimal'].includes(templateId) ? [{ key:'contacts', label:'Coordonnées', min:7, max:13, hint:'barre coordonnées' }] : []),
                  ].map(({ key, label, min, max, hint }) => (
                    <div key={key} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                        <label className="ed-label" style={{ margin:0 }}>{label}</label>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:11.5, fontWeight:700, color:C.bluePrimary }}>{fontSizes[key]}px</span>
                          {fontSizes[key] !== DEFAULT_FS[key] && (
                            <button
                              title="Réinitialiser"
                              onClick={() => {
                                const next = { ...fontSizesRef.current, [key]: DEFAULT_FS[key] };
                                fontSizesRef.current = next; setFontSizes(next);
                                applyFontSizesToIframe(next);
                                setTimeout(() => checkOverflow(), 80);
                              }}
                              style={{ background:'none', border:'none', cursor:'pointer', color:C.mute, fontSize:13, lineHeight:1, padding:'0 2px', display:'flex', alignItems:'center', borderRadius:4, transition:'color .15s' }}
                              onMouseEnter={e => e.currentTarget.style.color = C.ink}
                              onMouseLeave={e => e.currentTarget.style.color = C.mute}
                            >↺</button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize:10, color:C.mute, marginBottom:5 }}>{hint}</div>
                      <input type="range" min={min} max={max} step={0.5} value={fontSizes[key]}
                        onMouseDown={() => setSliderDragging(true)}
                        onTouchStart={() => setSliderDragging(true)}
                        onChange={e => {
                          const v=parseFloat(e.target.value);
                          const next={...fontSizesRef.current,[key]:v};
                          fontSizesRef.current=next; setFontSizes(next);
                          applyFontSizesToIframe(next);
                          setTimeout(()=>checkOverflow(),80);
                        }}
                        style={{ width:'100%', accentColor:C.bluePrimary, cursor:'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>


          </div>
        </aside>
      </div>

      {/* ── Version history panel ────────────────────────────────────────────── */}
      {historyOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setHistoryOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(11,16,32,0.35)', backdropFilter:'blur(2px)', zIndex:300 }}
          />

          {/* Drawer */}
          <div style={{
            position:'fixed', top:0, right:0, bottom:0, width:340,
            background:'#fff', boxShadow:'-4px 0 32px rgba(0,0,0,0.14)',
            zIndex:301, display:'flex', flexDirection:'column',
            fontFamily:"'Manrope',sans-serif",
          }}>
            {/* Header du drawer */}
            <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${C.rule}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.ink }}>Historique des versions</div>
                <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>
                  {historyVersions.length === 0
                    ? 'Aucune version sauvegardée'
                    : `${historyVersions.length} version${historyVersions.length > 1 ? 's' : ''} · Sauvegarde automatique`}
                </div>
              </div>
              <button onClick={() => setHistoryOpen(false)} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.rule}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mute }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Info */}
            <div style={{ padding:'10px 20px', background:C.surface, borderBottom:`1px solid ${C.rule}`, fontSize:11, color:C.mute, flexShrink:0 }}>
              💡 Une version est sauvegardée à chaque fois que tu cliques sur <b style={{ color:C.ink }}>Sauvegarder</b>.
            </div>

            {/* Liste des versions */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {historyVersions.length === 0 && (
                <div style={{ padding:'40px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🕐</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.ink, marginBottom:6 }}>Pas encore de versions</div>
                  <div style={{ fontSize:11.5, color:C.mute, lineHeight:1.6 }}>
                    Sauvegarde ton CV pour créer ta première version restaurable.
                  </div>
                </div>
              )}
              {historyVersions.map((v, i) => {
                const isLatest = i === 0;
                return (
                  <div
                    key={v.ts}
                    style={{
                      padding:'14px 20px',
                      borderBottom:`1px solid ${C.rule}`,
                      background: isLatest ? C.blueSoft : '#fff',
                      display:'flex', alignItems:'flex-start', gap:12,
                    }}
                  >
                    {/* Icône timeline */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                      <div style={{
                        width:10, height:10, borderRadius:'50%',
                        background: isLatest ? C.bluePrimary : C.rule,
                        border: isLatest ? `2px solid ${C.bluePrimary}` : `2px solid ${C.mute}`,
                        marginTop:3,
                      }} />
                      {i < historyVersions.length - 1 && (
                        <div style={{ width:2, height:40, background:C.rule, marginTop:3 }} />
                      )}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:12.5, fontWeight:700, color: isLatest ? C.bluePrimary : C.ink }}>
                          {relativeTime(v.ts)}
                        </span>
                        {isLatest && (
                          <span style={{ fontSize:10, background:C.bluePrimary, color:'#fff', padding:'1px 7px', borderRadius:99, fontWeight:700 }}>
                            Actuelle
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:C.mute, marginBottom:8 }}>
                        {v.date}
                        {v.data?.poste ? ` · ${v.data.poste}` : ''}
                      </div>
                      {!isLatest && (
                        <button
                          onClick={() => {
                            if (!v.data) return;
                            // Restaurer les données
                            setEdFields(JSON.parse(JSON.stringify(v.data)));
                            // Régénérer le HTML
                            rerenderCV({ data: v.data });
                            setHistoryOpen(false);
                            showToast(`Version du ${v.date} restaurée ✓`, 'success');
                          }}
                          style={{
                            padding:'5px 12px', border:`1px solid ${C.rule}`,
                            borderRadius:7, background:'#fff', fontSize:11, fontWeight:600,
                            color:C.ink2, cursor:'pointer', transition:'all .15s',
                            fontFamily:'inherit',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.bluePrimary; e.currentTarget.style.color = C.bluePrimary; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.color = C.ink2; }}
                        >
                          ↩ Restaurer cette version
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 20px', borderTop:`1px solid ${C.rule}`, flexShrink:0 }}>
              <button
                onClick={saveCurrentToHist}
                style={{
                  width:'100%', padding:'9px', border:'none',
                  borderRadius:9, background:C.ink, color:'#fff',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                  fontFamily:'inherit',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Sauvegarder maintenant
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Floating text toolbar ─────────────────────────────────────────────── */}
      {selectionPos && (
        <div className="float-toolbar" style={{ left:selectionPos.x, top:Math.max(60,selectionPos.y), transform:'translateX(-50%)' }} onMouseDown={e => e.preventDefault()}>
          <button className="ft-btn" onClick={() => changeFontSize(-1)} title="Réduire">A−</button>
          <button className="ft-btn" onClick={() => changeFontSize(1)} title="Agrandir">A+</button>
          <div className="ft-sep" />
          <button className="ft-btn" onClick={() => exec('bold')}><b>B</b></button>
          <button className="ft-btn" onClick={() => exec('italic')}><i>I</i></button>
          <button className="ft-btn" onClick={() => exec('underline')}><u>U</u></button>
          <div className="ft-sep" />
          <button className="ft-btn" onClick={() => exec('justifyLeft')}>⬅</button>
          <button className="ft-btn" onClick={() => exec('justifyCenter')}>≡</button>
          <button className="ft-btn" onClick={() => exec('justifyRight')}>➡</button>
          <div className="ft-sep" />
          <button className="ft-btn" title="Couleur du texte" style={{ position:'relative', padding:'3px 7px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', pointerEvents:'none' }}>
              <span style={{ fontWeight:800, fontSize:13, lineHeight:1 }}>A</span>
              <div style={{ width:14, height:3, borderRadius:1, background:textColorPick, marginTop:2 }} />
            </div>
            <input type="color" value={textColorPick} onMouseDown={e => e.stopPropagation()} onChange={e => { const c=e.target.value; setTextColorPick(c); applyTextColor(c); }} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
          </button>
          <div className="ft-sep" />
          <button className="ft-btn" onClick={() => exec('removeFormat')} style={{ color:'rgba(255,255,255,.5)' }}>✕</button>
        </div>
      )}

      {/* ── Photo crop modal ──────────────────────────────────────────────────── */}
      {photoMode && (
        <div style={{ position:'fixed', inset:0, background:'rgba(11,16,32,0.45)', backdropFilter:'blur(3px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:480, maxWidth:'94vw', boxShadow:'0 40px 100px rgba(11,16,32,.28), 0 0 0 1px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontWeight:700, fontSize:16, color:C.ink }}>Recadrer la photo</span>
              <button onClick={() => { setPhotoMode(false); setPhotoDraft(''); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:C.mute }}>×</button>
            </div>
            <div style={{ maxHeight:380, overflow:'hidden', borderRadius:10, background:C.surface }}>
              <img ref={cropImgRef} style={{ display:'block', maxWidth:'100%' }} alt="crop" />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <button onClick={() => { setPhotoMode(false); setPhotoDraft(''); }} style={{ padding:'9px 18px', border:`1px solid ${C.rule}`, borderRadius:10, background:'none', cursor:'pointer', fontSize:13, color:C.ink2, fontFamily:"'Manrope',sans-serif" }}>Annuler</button>
              <button onClick={confirmCrop} style={{ padding:'9px 22px', border:'none', borderRadius:10, background:C.navy, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Manrope',sans-serif" }}>Valider</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoFileSelect} />
      <input ref={logoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoUpload} />

      {/* ── Modal Reformulation ─────────────────────────────────────────── */}
      {reformOpen && (
        <div onClick={() => !reformOpen.loading && setReformOpen(null)}
          style={{ position:'fixed', inset:0, zIndex:9100, background:'rgba(11,16,32,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, animation:'fadeIn .2s ease' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'min(560px, 96vw)', background:'#fff', borderRadius:20, padding:'30px 30px 24px', boxShadow:'0 40px 100px rgba(11,16,32,.4)', fontFamily:"'Manrope',sans-serif", animation:'fadeInUp .3s cubic-bezier(.16,.84,.24,1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, #7c3aed, #1539B7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l1.88 5.76L20 9l-4.5 4.39 1.06 6.17L12 16.77l-4.56 2.79L8.5 13.39 4 9l6.12-1.24L12 2z"/>
                </svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:800, color:'#0B1020', letterSpacing:'-0.3px' }}>Reformuler avec l'IA</div>
                <div style={{ fontSize:12, color:'#9AA0AE', marginTop:2 }}>Choisis la formulation qui te parle</div>
              </div>
              {!reformOpen.loading && (
                <button onClick={() => setReformOpen(null)} style={{ width:32, height:32, border:'1px solid #ECEDF1', borderRadius:8, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9AA0AE' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>

            {/* Mission originale */}
            <div style={{ padding:'12px 14px', background:'#F7F8FA', border:'1px solid #ECEDF1', borderRadius:10, marginBottom:16 }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Mission actuelle</div>
              <div style={{ fontSize:13, color:'#3A4156', lineHeight:1.5 }}>
                {edFields?.experiences?.[reformOpen.expIdx]?.missions?.[reformOpen.missionIdx]}
              </div>
            </div>

            {/* Loading or variants */}
            {reformOpen.loading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 0', gap:12 }}>
                <div style={{ width:36, height:36, border:'3px solid #ECEDF1', borderTopColor:'#7c3aed', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                <div style={{ fontSize:13, color:'#9AA0AE', fontWeight:600 }}>Génération des 3 variantes…</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Propositions IA</div>
                {reformOpen.variants.map((v, idx) => (
                  <button key={idx} onClick={() => applyReformulation(v)}
                    style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 14px', background:'#fff', border:'1.5px solid #ECEDF1', borderRadius:12, cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.background='#faf5ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#ECEDF1'; e.currentTarget.style.background='#fff'; }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#f5f3ff', color:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0, marginTop:1 }}>{idx+1}</div>
                    <div style={{ flex:1, fontSize:13.5, color:'#0B1020', lineHeight:1.5 }}>{v}</div>
                  </button>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                  <button onClick={() => reformulateMission(reformOpen.expIdx, reformOpen.missionIdx)}
                    style={{ padding:'6px 12px', background:'transparent', border:'none', color:'#7c3aed', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                    ↺ Re-générer
                  </button>
                  <button onClick={() => setReformOpen(null)}
                    style={{ padding:'8px 16px', background:'transparent', border:'1px solid #ECEDF1', borderRadius:8, color:'#3A4156', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    Garder l'original
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />

      {/* ── Modale de sélection de profil ─────────────────────────────── */}
      {profileModalOpen && (
        <ProfileModal
          profiles={profiles}
          activeProfileId={activeProfileId}
          onApply={(id) => {
            setActiveProfileId(id);
            const p = profiles.find(pr => String(pr.id) === String(id));
            if (p) showToast(`Profil "${p.nom}" appliqué ✓`, 'success');
          }}
          onRegenerate={regenAll}
          onManage={() => navigate('/profils')}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  );
}
