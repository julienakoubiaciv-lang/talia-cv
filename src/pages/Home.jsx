import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHist, setHist, saveEditorState, PALETTES, colorForFormation } from '@/lib/cvData';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  bluePrimary: '#1539B7',
  blueHover:   '#1F4FE0',
  blueSoft:    '#EEF2FF',
  navy:        '#0B1638',
  navyDeep:    '#0F1A40',
  ink:         '#0B1020',
  ink2:        '#3A4156',
  mute:        '#9AA0AE',
  rule:        '#ECEDF1',
  bg:          '#FFFFFF',
  surface:     '#F7F8FA',
  ok:          '#1F8A5B',
  okBg:        'rgba(31,138,91,0.10)',
  star:        '#F5B400',
};

const FONT = "'Manrope', system-ui, sans-serif";

/* ─── SVG Icons ─────────────────────────────────────────────────────────── */
const IconDoc = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconGrid = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IconPlus = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconClock = ({ s = 12 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconEdit = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconEye = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconTrash = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconCheck = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconStar = ({ s = 22, filled }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? C.star : 'none'} stroke={filled ? C.star : '#E5E6EC'} strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconDownload = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconX = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSearch = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconLayers = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
const IconSort = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M6 12h12M10 18h4"/>
  </svg>
);

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(ts) {
  try { return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return ''; }
}
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

/* ─── Stars ──────────────────────────────────────────────────────────────── */
function Stars({ value = 5, size = 22 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => <IconStar key={i} s={size} filled={i <= value} />)}
    </div>
  );
}

/* ─── Confirm Delete ─────────────────────────────────────────────────────── */
function ConfirmModal({ name, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.45)', backdropFilter: 'blur(3px)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 400, width: '90%', boxShadow: '0 40px 100px rgba(11,16,32,.28), 0 0 0 1px rgba(0,0,0,.04)', fontFamily: FONT }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <IconTrash s={20} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, letterSpacing: '-0.3px' }}>Supprimer ce CV ?</div>
        <div style={{ fontSize: 13.5, color: C.ink2, marginBottom: 28, lineHeight: 1.55 }}>
          <strong style={{ color: C.ink }}>{name}</strong> sera définitivement supprimé.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', border: `1px solid ${C.rule}`, borderRadius: 10, background: '#fff', fontSize: 13.5, fontWeight: 600, color: C.ink2, cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 10, background: '#ef4444', fontSize: 13.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Preview Modal ──────────────────────────────────────────────────────── */
function PreviewModal({ item, onModify, onClose }) {
  if (!item) return null;
  const stars = 4;
  const pct = 83;
  const scale = 0.52;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.45)', backdropFilter: 'blur(3px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 1040, height: 'min(740px, 90vh)',
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(11,16,32,.28), 0 0 0 1px rgba(0,0,0,.04)',
        display: 'flex', flexDirection: 'column', fontFamily: FONT,
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{item.name}</span>
              <span style={{ padding: '2px 8px', background: C.okBg, color: C.ok, fontSize: 11, fontWeight: 600, borderRadius: 99 }}>Prêt à l'envoi</span>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.bluePrimary, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              {item.data?.poste || item.formation || ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => { onModify(item); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: `1px solid ${C.rule}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, color: C.ink, cursor: 'pointer' }}>
              <IconDownload s={13} /> Télécharger PDF
            </button>
            <button onClick={() => { onModify(item); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 10, background: C.bluePrimary, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              <IconEdit s={13} /> Modifier
            </button>
            <button onClick={onClose} style={{ width: 36, height: 36, border: `1px solid ${C.rule}`, borderRadius: 10, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mute }}>
              <IconX s={16} />
            </button>
          </div>
        </div>

        {/* Modal body: preview + sidebar */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden' }}>
          {/* CV preview centered */}
          <div style={{ background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 32 }}>
            <div style={{ width: 794 * scale, height: 1122 * scale, position: 'relative', flexShrink: 0, boxShadow: '0 20px 60px rgba(11,16,32,.18), 0 0 0 1px rgba(0,0,0,.04)', borderRadius: 4, overflow: 'hidden' }}>
              <iframe srcDoc={item.html} style={{ width: 794, height: 1122, border: 'none', display: 'block', transformOrigin: 'top left', transform: `scale(${scale})` }} title={item.name} scrolling="no" />
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ borderLeft: `1px solid ${C.rule}`, overflow: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Quality */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.mute, textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 14 }}>QUALITÉ DU CV</div>
              <Stars value={stars} size={22} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginTop: 10 }}>Excellent — prêt à l'envoi</div>
              <div style={{ fontSize: 12, color: C.mute, marginTop: 4 }}>{pct} / 100 · {stars} étoiles sur 5</div>
            </div>

            {/* Next actions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.mute, textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 14 }}>PROCHAINES ACTIONS</div>
              {['Ajouter une photo', 'Lier votre LinkedIn', 'Télécharger en PDF'].map((action, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 18, height: 18, border: `1.5px solid ${C.rule}`, borderRadius: 5, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.ink2 }}>{action}</span>
                </div>
              ))}
            </div>

            {/* Details */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.mute, textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 14 }}>DÉTAILS</div>
              {[
                ['Créé', formatDate(item.id)],
                ['Format', 'A4'],
                ['Formation', item.formation || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: C.mute }}>{k}</span>
                  <span style={{ color: C.ink, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CV Card ────────────────────────────────────────────────────────────── */
function CVCard({ item, onModify, onView, onDelete, animDelay }) {
  const poste = item.data?.poste || item.formation || '—';
  const formColor = colorForFormation(item.formation);
  return (
    <div style={{
      background: C.navy,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 12px 30px rgba(11,22,56,.18)',
      display: 'flex', flexDirection: 'column',
      animation: `cardIn 0.65s cubic-bezier(.16,.84,.24,1) ${animDelay}s both`,
    }}>
      {/* Card body */}
      <div style={{ padding: '22px 22px 18px', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Radial gradient accent */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, background: `radial-gradient(circle, ${formColor.fg}55 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
              {item.name}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.4px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {poste}
            </div>
          </div>
          <span style={{ background: C.blueHover, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap', marginLeft: 12, flexShrink: 0 }}>
            Prêt
          </span>
        </div>

        {/* Formation tag */}
        {item.formation && (
          <div style={{ marginBottom: 12, position: 'relative' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:700, padding:'4px 10px', borderRadius:99, background:`${formColor.fg}22`, color:'#fff', border:`1px solid ${formColor.fg}55`, maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:formColor.fg, flexShrink:0 }} />
              {item.formation}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>
          <IconClock s={12} />
          {formatDate(item.id)}
        </div>
      </div>

      {/* Actions footer — 3 columns separated by 1px transparent lines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 44px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => onModify(item)} style={{ padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#7BA7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <IconEdit s={13} /> Modifier
        </button>
        <div style={{ background: 'rgba(255,255,255,0.08)' }} />
        <button onClick={() => onView(item)} style={{ padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <IconEye s={13} /> Voir
        </button>
        <div style={{ background: 'rgba(255,255,255,0.08)' }} />
        <button onClick={() => onDelete(item)} style={{ padding: '12px', border: 'none', background: 'none', cursor: 'pointer', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <IconTrash s={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ icon, value, label, sub, badge }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.rule}`, boxShadow: '0 1px 2px rgba(15,20,40,.02)', display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 180px' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: C.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.bluePrimary, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: badge ? 24 : 28, fontWeight: 700, color: C.ink, letterSpacing: '-0.5px' }}>{value}</div>
          {badge && <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ok, background: C.okBg, padding: '2px 8px', borderRadius: 99 }}>{badge}</span>}
        </div>
        <div style={{ fontSize: 12, color: C.mute, fontWeight: 500, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.mute, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [cvList, setCvList] = useState([]);
  const [viewCV, setViewCV] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent | old | az | za | formation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForms, setSelectedForms] = useState([]); // formations sélectionnées
  const [groupByBulk, setGroupByBulk] = useState(false);

  useEffect(() => { setCvList(getHist()); }, []);

  // ── Liste unique des formations présentes ──
  const formations = React.useMemo(() => {
    const set = new Set();
    cvList.forEach(c => { if (c.formation) set.add(c.formation); });
    return [...set].sort();
  }, [cvList]);

  // ── Filtrer + trier ──
  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = cvList.filter(c => {
      if (selectedForms.length && !selectedForms.includes(c.formation)) return false;
      if (!q) return true;
      const poste = (c.data?.poste || '').toLowerCase();
      return c.name.toLowerCase().includes(q) || poste.includes(q) || (c.formation||'').toLowerCase().includes(q);
    });
    switch (sortBy) {
      case 'az':        list = [...list].sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'za':        list = [...list].sort((a,b) => b.name.localeCompare(a.name)); break;
      case 'old':       list = [...list].sort((a,b) => a.id - b.id); break;
      case 'formation': list = [...list].sort((a,b) => (a.formation||'').localeCompare(b.formation||'')); break;
      default: break; // recent = ordre par défaut (déjà décroissant)
    }
    return list;
  }, [cvList, searchQuery, selectedForms, sortBy]);

  // ── Grouper par session bulk (si demandé) ──
  const groupedView = React.useMemo(() => {
    if (!groupByBulk) return null;
    const groups = new Map();
    filtered.forEach(c => {
      const key = c.bulkId || '_none_';
      if (!groups.has(key)) groups.set(key, { id: key, label: c.bulkLabel || (key === '_none_' ? 'CV individuels' : 'Lot'), items: [], formation: c.formation });
      groups.get(key).items.push(c);
    });
    return [...groups.values()];
  }, [filtered, groupByBulk]);

  const toggleForm = (f) => setSelectedForms(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const clearFilters = () => { setSearchQuery(''); setSelectedForms([]); };
  const hasActiveFilters = searchQuery || selectedForms.length > 0;

  const handleModify = useCallback((item) => {
    saveEditorState({ generatedHTML: item.html, cvData: item.data || null, palette: PALETTES[0], croppedPhoto: '', logoDataURL: '', name: item.name });
    navigate('/editor');
  }, [navigate]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const next = cvList.filter(c => c.id !== deleteTarget.id);
    setHist(next); setCvList(next); setDeleteTarget(null);
  }, [cvList, deleteTarget]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        @keyframes cardIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <header style={{ background: C.bg, borderBottom: `1px solid ${C.rule}`, height: 79, display: 'flex', alignItems: 'center', padding: '0 40px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: C.ink, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <IconDoc s={17} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: '-0.2px' }}>
            Talia<span style={{ color: C.bluePrimary }}>CV</span>
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 99, fontSize: 13.5, fontWeight: 600, color: C.ink }}>
            <IconGrid s={14} />
            Tableau de bord
          </div>
        </div>

        <button onClick={() => navigate('/generate')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: C.ink, color: '#fff', border: 'none', borderRadius: 99, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'opacity .15s', letterSpacing: '-0.1px' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <IconPlus s={13} /> Nouveau CV
        </button>
        <button onClick={() => navigate('/bulk')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: C.bg, color: C.ink, border: '1.5px solid ' + C.rule, borderRadius: 99, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'border-color .15s', letterSpacing: '-0.1px' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.ink}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.rule}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          En masse
        </button>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 64px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 48, animation: 'fadeIn 0.8s ease both' }}>
          <h1 style={{ fontSize: 64, fontWeight: 700, color: C.ink, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 12 }}>Mes CV</h1>
          <p style={{ fontSize: 16.5, color: C.ink2, fontWeight: 400, lineHeight: 1.55 }}>
            Créez et gérez vos CV professionnels avec un design premium.
          </p>
        </div>

        {/* Stats */}
        {cvList.length > 0 && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 48, flexWrap: 'wrap' }}>
            <StatCard icon={<IconDoc s={20} />} value={cvList.length} label="CV créés" />
            <StatCard icon={<IconCheck s={20} />} value={cvList.length} label="Prêts à l'envoi" badge="100 %" />
            <StatCard icon={<IconClock s={20} />} value={formatDate(cvList[0]?.id)} label="Dernière mise à jour" sub={timeAgo(cvList[0]?.id)} />
          </div>
        )}

        {/* Section header — hidden when no CVs */}
        {cvList.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap:'wrap' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '-0.2px' }}>
                Vos documents{' '}
                <span style={{ color: C.mute, fontWeight: 500 }}>
                  {hasActiveFilters ? `${filtered.length} sur ${cvList.length}` : cvList.length}
                </span>
              </div>

              {/* Toolbar : recherche + tri + group */}
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                {/* Search */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:C.surface, border:`1px solid ${C.rule}`, borderRadius:99, minWidth:240, transition:'border-color .15s' }}>
                  <IconSearch s={14} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un nom, poste, formation…"
                    style={{ flex:1, border:'none', background:'transparent', fontSize:13, color:C.ink, outline:'none', fontFamily:FONT, minWidth:160 }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ background:'none', border:'none', cursor:'pointer', color:C.mute, padding:0, display:'flex' }}>
                      <IconX s={13} />
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div style={{ position:'relative', display:'flex', alignItems:'center', gap:6, padding:'8px 12px', background:'#fff', border:`1px solid ${C.rule}`, borderRadius:99, fontSize:12.5, fontWeight:600, color:C.ink }}>
                  <IconSort s={13} />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{ border:'none', background:'transparent', fontSize:12.5, fontWeight:600, color:C.ink, fontFamily:FONT, cursor:'pointer', outline:'none', paddingRight:18, appearance:'none', backgroundImage:'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239AA0AE\' stroke-width=\'2.5\'><polyline points=\'6 9 12 15 18 9\'/></svg>")', backgroundRepeat:'no-repeat', backgroundPosition:'right 0 center' }}>
                    <option value="recent">Plus récents</option>
                    <option value="old">Plus anciens</option>
                    <option value="az">Nom A → Z</option>
                    <option value="za">Nom Z → A</option>
                    <option value="formation">Par formation</option>
                  </select>
                </div>

                {/* Group by bulk */}
                <button onClick={() => setGroupByBulk(v => !v)}
                  title="Regrouper par session de génération en masse"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', border:`1px solid ${groupByBulk ? C.bluePrimary : C.rule}`, borderRadius:99, background:groupByBulk ? C.blueSoft : '#fff', color:groupByBulk ? C.bluePrimary : C.ink, fontSize:12.5, fontWeight:600, cursor:'pointer', transition:'all .15s', fontFamily:FONT }}>
                  <IconLayers s={13} />
                  Grouper par lot
                </button>
              </div>
            </div>

            {/* Formation filter chips */}
            {formations.length > 0 && (
              <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:600, color:C.mute, textTransform:'uppercase', letterSpacing:'1.4px', marginRight:4 }}>Filtrer :</span>
                {formations.map(f => {
                  const col = colorForFormation(f);
                  const active = selectedForms.includes(f);
                  return (
                    <button key={f} onClick={() => toggleForm(f)}
                      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:99, border:`1px solid ${active ? col.fg : C.rule}`, background:active ? col.bg : '#fff', color:active ? col.fg : C.ink2, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s', fontFamily:FONT }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:col.fg }} />
                      {f}
                      {active && <IconX s={11} />}
                    </button>
                  );
                })}
                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    style={{ padding:'5px 11px', border:'none', background:'transparent', color:C.mute, fontSize:12, fontWeight:600, cursor:'pointer', textDecoration:'underline', fontFamily:FONT }}>
                    Réinitialiser
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty state — full immersive when no CVs */}
        {cvList.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', animation: 'fadeIn 0.7s ease both', textAlign: 'center' }}>
            {/* Illustration */}
            <div style={{ position: 'relative', marginBottom: 32 }}>
              <div style={{ width: 96, height: 96, borderRadius: 24, background: C.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.bluePrimary, margin: '0 auto' }}>
                <IconDoc s={42} />
              </div>
              {/* Floating badge */}
              <div style={{ position: 'absolute', top: -8, right: -12, background: C.star, borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.ink, boxShadow: '0 2px 8px rgba(245,180,0,0.35)', whiteSpace: 'nowrap' }}>
                ✦ IA incluse
              </div>
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: '-0.6px', marginBottom: 10, lineHeight: 1.2 }}>
              Votre premier CV en 3 minutes
            </h2>
            <p style={{ fontSize: 15, color: C.ink2, maxWidth: 420, lineHeight: 1.6, marginBottom: 36 }}>
              Collez votre CV existant ou repartez de zéro — l'IA le reformule, le met en page et l'optimise pour l'alternance.
            </p>

            {/* Steps */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { n: '1', label: 'Formation & poste' },
                { n: '2', label: 'Votre contenu' },
                { n: '3', label: 'Génération IA' },
              ].map(({ n, label }) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: C.surface, borderRadius: 99, border: `1px solid ${C.rule}` }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: C.bluePrimary, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/generate')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: C.ink, color: '#fff', border: 'none', borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.1px', boxShadow: '0 4px 20px rgba(11,16,32,.18)', transition: 'opacity .15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <IconPlus s={15} /> Créer mon premier CV
              </button>
              <button
                onClick={() => navigate('/bulk')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: C.bg, color: C.ink, border: `1.5px solid ${C.rule}`, borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.1px', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.ink}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.rule}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Générer en masse
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.mute, marginTop: 14 }}>Gratuit · Aucune inscription requise</p>
          </div>
        ) : (
          /* Grid — only shown when there are CVs */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {/* Create card */}
            <div onClick={() => navigate('/generate')} style={{ border: `1.5px dashed ${C.rule}`, borderRadius: 16, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer', background: C.bg, transition: 'border-color .2s, background .2s', minHeight: 220, animation: 'cardIn 0.65s cubic-bezier(.16,.84,.24,1) 0s both' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.bluePrimary; e.currentTarget.style.background = C.blueSoft; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.background = C.bg; }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: C.bluePrimary, fontWeight: 400 }}>
                <IconPlus s={22} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 5, letterSpacing: '-0.2px' }}>Créer un nouveau CV</div>
                <div style={{ fontSize: 13, color: C.mute }}>Commencer depuis zéro</div>
              </div>
            </div>

            {/* Bulk card */}
            <div onClick={() => navigate('/bulk')} style={{ border: `1.5px dashed ${C.rule}`, borderRadius: 16, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer', background: C.bg, transition: 'border-color .2s, background .2s', minHeight: 220, animation: 'cardIn 0.65s cubic-bezier(.16,.84,.24,1) 0.05s both' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#f5f3ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.background = C.bg; }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 5, letterSpacing: '-0.2px' }}>Générer en masse</div>
                <div style={{ fontSize: 13, color: C.mute }}>Plusieurs CV en une fois</div>
              </div>
            </div>

            {!groupByBulk && filtered.map((item, i) => (
              <CVCard key={item.id} item={item} animDelay={Math.min((i + 1) * 0.05, 0.4)}
                onModify={handleModify} onView={setViewCV} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}

        {/* Empty filtered state */}
        {cvList.length > 0 && filtered.length === 0 && !groupByBulk && (
          <div style={{ textAlign:'center', padding:'48px 24px', animation:'fadeIn .3s ease' }}>
            <div style={{ width:64, height:64, borderRadius:16, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:C.mute, margin:'0 auto 16px' }}>
              <IconSearch s={26} />
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:6 }}>Aucun CV ne correspond</div>
            <div style={{ fontSize:13, color:C.mute, marginBottom:18 }}>Essaie une autre recherche ou retire des filtres.</div>
            <button onClick={clearFilters} style={{ padding:'9px 20px', border:`1px solid ${C.rule}`, background:'#fff', borderRadius:99, fontSize:13, fontWeight:600, color:C.ink, cursor:'pointer', fontFamily:FONT }}>
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Grouped view by bulk session */}
        {groupByBulk && cvList.length > 0 && groupedView && groupedView.map(group => {
          const col = colorForFormation(group.formation);
          return (
            <div key={group.id} style={{ marginBottom:36, animation:'fadeIn .3s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:10, borderBottom:`2px solid ${col.fg}33` }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:col.fg, flexShrink:0 }} />
                <span style={{ fontSize:15, fontWeight:800, color:C.ink, letterSpacing:'-0.2px' }}>{group.label}</span>
                <span style={{ fontSize:11, color:C.mute, marginLeft:'auto' }}>{group.items.length} CV</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:20 }}>
                {group.items.map((item, i) => (
                  <CVCard key={item.id} item={item} animDelay={Math.min(i * 0.04, 0.3)}
                    onModify={handleModify} onView={setViewCV} onDelete={setDeleteTarget} />
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <PreviewModal item={viewCV} onModify={handleModify} onClose={() => setViewCV(null)} />
      {deleteTarget && <ConfirmModal name={deleteTarget.name} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
