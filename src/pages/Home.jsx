import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveEditorState, PALETTES, colorForFormation } from '@/lib/cvData';
import { getHistorySync, deleteHistory } from '@/lib/historySync';
import { useCRMBridge } from '@/hooks/useCRMBridge.jsx';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useIsMobile } from '@/hooks/useWindowWidth';
import { useCRMToken } from '@/hooks/useCRMToken';
import { useEntitlements } from '@/hooks/useEntitlements';
import { PlanBanner } from '@/components/PlanGate';
import { CheckoutSuccessBanner } from '@/components/CheckoutSuccessBanner.jsx';
import { useCheckoutSuccess } from '@/hooks/useCheckoutSuccess';
import { getOverallCompletion } from '@/lib/interviewProgress';
import { getTotalXp, levelForXp, getDailyStreak } from '@/lib/playerProfile';
import { getDiagnostic } from '@/lib/employability';
import { useSeo } from '@/lib/seo';
import { isDemoMode, setDemoMode } from '@/lib/demoMode';
import { getJoinNotice, clearJoinNotice } from '@/lib/orgAccess';
import { useEncadrant } from '@/hooks/useEncadrant';
import { isDemoEncadrant, setDemoEncadrant } from '@/lib/demoCohort';
import GameOnboarding from '@/components/GameOnboarding';
import { alpha } from '@/lib/gameTheme';
import { useTheme } from '@/hooks/useTheme.jsx';
import EnergyBar from '@/components/EnergyBar';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  bluePrimary: 'var(--altio-blue)',
  blueHover:   'var(--altio-blue-hover)',
  blueSoft:    'var(--altio-blue-soft)',
  navy:        'var(--altio-ink)',
  navyDeep:    'var(--altio-ink)',
  ink:         'var(--altio-ink)',
  ink2:        'var(--altio-ink2)',
  mute:        'var(--altio-mute)',
  rule:        'var(--altio-line)',
  bg:          'var(--altio-bg)',
  surface:     'var(--altio-card2)',
  card:        'var(--altio-card)',
  ok:          'var(--altio-green)',
  okBg:        'var(--altio-green-soft)',
  star:        'var(--altio-star)',
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
const IconUserPlus = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
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
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 20, padding: '32px', maxWidth: 400, width: '90%', boxShadow: '0 40px 100px rgba(11,16,32,.28), 0 0 0 1px rgba(0,0,0,.04)', fontFamily: FONT }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <IconTrash s={20} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, letterSpacing: '-0.3px' }}>Supprimer ce CV ?</div>
        <div style={{ fontSize: 13.5, color: C.ink2, marginBottom: 28, lineHeight: 1.55 }}>
          <strong style={{ color: C.ink }}>{name}</strong> sera définitivement supprimé.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', border: `1px solid ${C.rule}`, borderRadius: 10, background: C.card, fontSize: 13.5, fontWeight: 600, color: C.ink2, cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 10, background: '#ef4444', fontSize: 13.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Preview Modal ──────────────────────────────────────────────────────── */
function PreviewModal({ item, onModify, onDownload, downloading, onClose }) {
  const isMobile = useIsMobile();
  if (!item) return null;
  const stars = 4;
  const pct = 83;
  // Adapte le scale selon la largeur disponible
  const scale = isMobile ? 0.38 : 0.52;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.45)', backdropFilter: 'blur(3px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: isMobile ? '100%' : 1040,
        height: isMobile ? 'min(88vh, 640px)' : 'min(740px, 90vh)',
        background: C.card, borderRadius: isMobile ? 16 : 20, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(11,16,32,.28), 0 0 0 1px rgba(0,0,0,.04)',
        display: 'flex', flexDirection: 'column', fontFamily: FONT,
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '12px 16px' : '16px 24px', borderBottom: `1px solid ${C.rule}`, flexShrink: 0, gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 160 : 'none' }}>{item.name}</span>
              {!isMobile && <span style={{ padding: '2px 8px', background: C.okBg, color: C.ok, fontSize: 11, fontWeight: 600, borderRadius: 99, whiteSpace: 'nowrap' }}>Prêt à l'envoi</span>}
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.bluePrimary, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                {item.data?.poste || item.formation || ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {!isMobile && (
              <button
                onClick={() => onDownload?.(item)}
                disabled={downloading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                  border: `1px solid ${C.rule}`, borderRadius: 10, background: C.card,
                  fontSize: 13, fontWeight: 600, color: C.ink,
                  cursor: downloading ? 'wait' : 'pointer',
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                {downloading
                  ? <><span style={{ width:11, height:11, border:'1.5px solid rgba(11,16,32,.2)', borderTopColor:C.ink, borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} /> Génération…</>
                  : <><IconDownload s={13} /> Télécharger PDF</>}
              </button>
            )}
            <button onClick={() => { onModify(item); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '8px 14px' : '9px 18px', border: 'none', borderRadius: 10, background: C.bluePrimary, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              <IconEdit s={13} /> Modifier
            </button>
            <button onClick={onClose} style={{ width: 34, height: 34, border: `1px solid ${C.rule}`, borderRadius: 10, background: C.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mute, flexShrink: 0 }}>
              <IconX s={15} />
            </button>
          </div>
        </div>

        {/* Modal body: preview + sidebar (sidebar masquée sur mobile) */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', overflow: 'hidden' }}>
          {/* CV preview */}
          <div style={{ background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: isMobile ? 16 : 32 }}>
            <div style={{ width: 794 * scale, height: 1122 * scale, position: 'relative', flexShrink: 0, boxShadow: '0 20px 60px rgba(11,16,32,.18), 0 0 0 1px rgba(0,0,0,.04)', borderRadius: 4, overflow: 'hidden' }}>
              <iframe srcDoc={item.html} style={{ width: 794, height: 1122, border: 'none', display: 'block', transformOrigin: 'top left', transform: `scale(${scale})` }} title={item.name} scrolling="no" />
            </div>
          </div>

          {/* Sidebar — desktop uniquement */}
          {!isMobile && (
            <div style={{ borderLeft: `1px solid ${C.rule}`, overflow: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.mute, textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 14 }}>QUALITÉ DU CV</div>
                <Stars value={stars} size={22} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginTop: 10 }}>Excellent — prêt à l'envoi</div>
                <div style={{ fontSize: 12, color: C.mute, marginTop: 4 }}>{pct} / 100 · {stars} étoiles sur 5</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.mute, textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 14 }}>PROCHAINES ACTIONS</div>
                {['Ajouter une photo', 'Lier votre LinkedIn', 'Télécharger en PDF'].map((action, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 18, height: 18, border: `1.5px solid ${C.rule}`, borderRadius: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.ink2 }}>{action}</span>
                  </div>
                ))}
              </div>
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
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── CV Card ────────────────────────────────────────────────────────────── */
function CVCard({ item, onModify, onView, onDelete, onCreateLead, animDelay }) {
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

      {/* Actions footer */}
      <div style={{ display: 'grid', gridTemplateColumns: onCreateLead ? '1fr 1px 1fr 1px 1fr 1px 44px' : '1fr 1px 1fr 1px 44px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
        {onCreateLead && <>
          <div style={{ background: 'rgba(255,255,255,0.08)' }} />
          <button onClick={() => onCreateLead(item)}
            title="Créer un lead dans le CRM"
            style={{ padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <IconUserPlus s={13} /> Lead
          </button>
        </>}
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
    <div style={{ background: C.card, borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.rule}`, boxShadow: '0 1px 2px rgba(15,20,40,.02)', display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 180px' }}>
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

/* ─── Onboarding Tour ────────────────────────────────────────────────────── */
function OnboardingTour({ onClose, onAction }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      emoji: '👋',
      title: 'Bienvenue sur Altio CV',
      subtitle: 'Le générateur de CV intelligent pour Talia',
      text: "Génère des CV professionnels en quelques clics — l'IA reformule, met en page et optimise pour l'alternance.",
      cta: 'Commencer la visite →',
      bg: 'linear-gradient(135deg, #1539B7, #1F4FE0)',
    },
    {
      emoji: '✨',
      title: 'Créer un CV en 3 étapes',
      subtitle: 'Formation → Contenu → Génération',
      text: "Choisis la formation Talia, dépose le CV du candidat (PDF/image) ou colle son texte, et laisse l'IA faire le reste. Un stepper visuel te guide à chaque étape.",
      cta: 'Étape suivante →',
      bg: 'linear-gradient(135deg, #1539B7, #7c3aed)',
    },
    {
      emoji: '📚',
      title: 'Générer en masse',
      subtitle: 'Plusieurs CV en une fois',
      text: "Organise les candidats par groupes (par formation, par session). Génère tous les CV en parallèle puis ouvre-les un par un pour les finaliser dans l'éditeur.",
      cta: 'Étape suivante →',
      bg: 'linear-gradient(135deg, #7c3aed, #db2777)',
    },
    {
      emoji: '🎨',
      title: 'Éditeur intelligent',
      subtitle: 'Modifie, reformule, perfectionne',
      text: "Édite chaque section avec aperçu en temps réel. Clique sur ✨ à côté d'une mission pour 3 reformulations IA. Le score qualité te guide vers l'optimal.",
      cta: 'Étape suivante →',
      bg: 'linear-gradient(135deg, #059669, #1539B7)',
    },
    {
      emoji: '🔍',
      title: 'Retrouve tes CV',
      subtitle: 'Recherche, filtre, regroupe',
      text: "Tes CV sont sauvegardés ici. Utilise la recherche, filtre par formation, trie comme tu veux, ou regroupe par lot pour voir les CV générés ensemble.",
      cta: 'C\'est parti !',
      bg: 'linear-gradient(135deg, #d97706, #dc2626)',
    },
  ];
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9500,
      background:'rgba(11,16,32,0.55)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      animation:'fadeIn .25s ease', fontFamily:FONT,
    }}>
      <div style={{
        width:'min(540px, 96vw)', background: C.card, borderRadius:24,
        overflow:'hidden', boxShadow:'0 40px 100px rgba(11,16,32,.4)',
        animation:'fadeInUp .35s cubic-bezier(.16,.84,.24,1)',
      }}>
        {/* Header coloré */}
        <div style={{
          background: current.bg, padding:'34px 32px 30px', color:'#fff',
          position:'relative', overflow:'hidden', textAlign:'center',
        }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.12)' }} />
          <div style={{ position:'absolute', bottom:-40, left:-40, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.08)' }} />
          <button onClick={onClose} style={{
            position:'absolute', top:14, right:14, width:32, height:32,
            border:'1px solid rgba(255,255,255,.3)', borderRadius:8,
            background:'rgba(255,255,255,.15)', color:'#fff', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background .15s',
          }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.25)'}
             onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.15)'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ fontSize:54, marginBottom:6, position:'relative', animation:'fadeIn .5s ease' }} key={step}>{current.emoji}</div>
          <div style={{ fontSize:11, fontWeight:700, opacity:0.85, letterSpacing:'2px', textTransform:'uppercase', marginBottom:8, position:'relative' }}>
            Étape {step+1} / {steps.length}
          </div>
          <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.5px', marginBottom:4, position:'relative' }}>{current.title}</h2>
          <div style={{ fontSize:13.5, opacity:0.85, position:'relative' }}>{current.subtitle}</div>
        </div>

        {/* Body */}
        <div style={{ padding:'26px 32px 24px' }}>
          <p style={{ fontSize:14.5, color:C.ink2, lineHeight:1.65, marginBottom:22, textAlign:'center' }}>
            {current.text}
          </p>

          {/* Progress dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:22 }}>
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                width: i === step ? 24 : 6, height: 6, borderRadius:99,
                background: i <= step ? C.bluePrimary : C.rule,
                border:'none', padding:0, cursor:'pointer',
                transition:'all .3s cubic-bezier(.16,.84,.24,1)',
              }} />
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {step > 0 && (
              <button onClick={() => setStep(step-1)} style={{
                padding:'11px 18px', border:`1px solid ${C.rule}`, borderRadius:10,
                background: C.card, fontSize:13, fontWeight:600, color:C.ink2,
                cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', gap:5,
              }}>
                ← Précédent
              </button>
            )}
            <button onClick={() => {
              if (isLast) { onClose(); onAction?.('done'); }
              else setStep(step+1);
            }} style={{
              flex:1, padding:'12px 18px', border:'none', borderRadius:10,
              background: C.ink, color:'#fff',
              fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:FONT,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              transition:'opacity .15s',
            }} onMouseEnter={e => e.currentTarget.style.opacity='.85'}
               onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              {current.cta}
            </button>
          </div>
          {!isLast && (
            <button onClick={onClose} style={{
              width:'100%', marginTop:10, padding:'8px', border:'none',
              background:'transparent', color:C.mute, fontSize:12, fontWeight:500,
              cursor:'pointer', fontFamily:FONT,
            }}>
              Passer la visite
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
const HOME_MODULES = [
  { route: '/parcours',         emoji: '🧗', accent: '#1539B7', title: "Ton chemin vers l'emploi",  desc: "Suis ta progression : CV, métier, entretien. Gagne de l'XP et des badges.", cta: 'Mon parcours' },
  { route: '/entretien',        emoji: '🎤', accent: '#0CA678', title: "Simulateur d'entretien",     desc: "Mises en situation réelles, feedback immédiat. Entraîne-toi avant le jour J.", cta: "S'entraîner" },
  { route: '/metiers',          emoji: '🧭', accent: '#1098AD', title: 'Décrypte les métiers',       desc: 'Les compétences clés attendues pour chaque poste, en mode jeu.', cta: 'Explorer' },
  { route: '/diagnostic',       emoji: '🧪', accent: '#7048E8', title: "Mon bilan d'employabilité",  desc: "Ton score global, tes forces et ce qu'il reste à travailler.", cta: 'Mon bilan' },
  { route: '/analyse',          emoji: '🔍', accent: '#1F4FE0', title: 'Analyse CV ↔ offre',         desc: 'Score de correspondance, mots-clés manquants et compatibilité ATS.', cta: 'Analyser' },
  { route: '/codes',            emoji: '🏢', accent: '#E8590C', title: "Les codes de l'entreprise",  desc: 'Savoir-être en poste : la meilleure réaction face à des situations réelles.', cta: "S'entraîner" },
  { route: '/lettre',           emoji: '✉️', accent: '#C2255C', title: 'Kit de candidature IA',      desc: 'Lettre de motivation, mail de relance ou de remerciement, depuis ton CV.', cta: 'Rédiger' },
  { route: '/entretien-oral',   emoji: '🗣️', accent: '#0CA678', title: "Entretien à l'oral IA",      desc: 'Réponds à voix haute : le coach évalue le fond, la structure et la clarté.', cta: "S'entraîner" },
  { route: '/test-recrutement', emoji: '🧩', accent: '#7048E8', title: 'Test de recrutement IA',     desc: "Aptitudes, métier et mises en situation, adaptés à ton CV et à l'annonce.", cta: 'Passer le test' },
];

const NAV_ITEMS = [
  { id: 'home',        icon: '🏠', label: 'Accueil' },
  { id: 'cv',          icon: '📄', label: 'Mes CV' },
  { id: 'prep',        icon: '🎯', label: 'Préparation' },
  { id: 'encadrement', icon: '👩‍🏫', label: 'Encadrement', optional: true },
  { id: 'account',     icon: '⚙️', label: 'Compte' },
];

function Sidebar({ section, setSection, isMobile, showEncadrement }) {
  const items = NAV_ITEMS.filter((n) => !n.optional || showEncadrement);
  if (isMobile) {
    return (
      <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, display: 'flex',
        background: C.bg, borderTop: `1px solid ${C.rule}`, padding: '6px 2px', boxShadow: '0 -4px 18px rgba(11,22,56,.06)' }}>
        {items.map((n) => (
          <button key={n.id} onClick={() => setSection(n.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', fontFamily: 'Manrope,sans-serif', color: section === n.id ? C.bluePrimary : C.mute }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700 }}>{n.label}</span>
          </button>
        ))}
      </nav>
    );
  }
  return (
    <aside style={{ width: 208, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((n) => {
          const on = section === n.id;
          return (
            <button key={n.id} onClick={() => setSection(n.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                background: on ? C.blueSoft : 'transparent', color: on ? C.bluePrimary : C.ink2,
                border: 'none', borderRadius: 12, padding: '11px 14px', fontSize: 14.5, fontWeight: on ? 800 : 600,
                cursor: 'pointer', fontFamily: 'Manrope,sans-serif', transition: 'background .15s' }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { embedded, notifyCreateLead } = useCRMBridge();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { crmLink, isLinked: isCRMLinked, linkFromURL, unlink: unlinkCRM } = useCRMToken();
  const { isFree, plan, canCV, remainingCVs, canBulk, nextPlan, upgrade, isSchool, orgName } = useEntitlements();

  // Taux de complétion global du simulateur d'entretien (localStorage)
  const interviewPct = getOverallCompletion();

  // ── Retour paiement Stripe (?checkout=success) ──────────────────────────
  const { checkoutState, activatedTier, dismiss: dismissCheckout } = useCheckoutSuccess({
    onActivated: (tier) => upgrade(tier, 'stripe'),
  });

  const [cvList, setCvList] = useState([]);
  const [viewCV, setViewCV] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent | old | az | za | formation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForms, setSelectedForms] = useState([]); // formations sélectionnées
  const [groupByBulk, setGroupByBulk] = useState(false);
  const [demoOn, setDemoOn] = useState(() => isDemoMode());
  const [joinNotice, setJoinNotice] = useState(() => getJoinNotice());
  const [section, setSection] = useState('home'); // home | cv | prep | encadrement | account
  const [showOnboard, setShowOnboard] = useState(() => { try { return !localStorage.getItem('talia_onboarded'); } catch { return false; } });
  const { mode, toggle: toggleTheme } = useTheme();
  const isEncadrant = useEncadrant();
  useSeo({ title: 'Altio CV — Générateur de CV gratuit & préparation à l\'emploi', description: 'Crée ton CV gratuitement et entraîne-toi à décrocher ton poste : entretien, tests de recrutement, oral, lettre de motivation. Gagne en employabilité, étape par étape.' });

  // Rafraîchit la notice de bienvenue une fois le rattachement école résolu.
  useEffect(() => { const n = getJoinNotice(); if (n) setJoinNotice(n); }, [orgName, isSchool]);

  // Tableau de bord : niveau/XP, série, snapshot employabilité.
  const dashXp = useMemo(() => getTotalXp(), []);
  const dashLvl = useMemo(() => levelForXp(dashXp), [dashXp]);
  const dashStreak = useMemo(() => getDailyStreak(), []);
  const dashDiag = useMemo(() => { try { return getDiagnostic(); } catch { return null; } }, []);
  const [leadSentIds, setLeadSentIds] = useState(new Set()); // IDs déjà envoyés au CRM

  useEffect(() => { setCvList(getHistorySync()); }, []);

  // Détection du token CRM dans l'URL (?crm_token=…)
  useEffect(() => { linkFromURL(); }, [linkFromURL]);


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
    navigate('/editor/' + item.id);
  }, [navigate]);

  // Fix #2 : téléchargement direct PDF depuis Home (sans passer par l'éditeur)
  const [downloadingId, setDownloadingId] = useState(null);
  const handleDownload = useCallback(async (item) => {
    if (!item?.html) return;
    setDownloadingId(item.id);
    try {
      // Injecter photo/logo dans le HTML si présents en URL Storage
      let html = item.html;
      if (item.photoUrl || item.logoUrl) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          if (item.photoUrl) {
            const el = doc.querySelector('.block-photo');
            if (el) el.innerHTML = `<div class="block-photo-inner"><img src="${item.photoUrl}" style="width:100%;height:auto;object-fit:cover;display:block;" /></div>`;
          }
          if (item.logoUrl) {
            const el = doc.querySelector('.logo-zone');
            if (el) el.innerHTML = `<img src="${item.logoUrl}" style="max-width:80%;max-height:40px;object-fit:contain;display:block;margin:auto;" />`;
          }
          html = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
        } catch {/* ignore — on retombe sur le html brut */}
      }

      const filename = `CV_${item.name || 'Talia'}.pdf`;
      let downloaded = false;

      // 1. Tente l'API Vercel/Puppeteer (rendu fidèle)
      try {
        const res = await fetch('/api/pdf', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ html, filename }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href     = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          downloaded = true;
        }
      } catch {/* on tente le fallback */}

      // 2. Fallback client-side (html2canvas + jsPDF)
      if (!downloaded) {
        const { renderPdfFromHtml } = await import('@/lib/pdfClient');
        await renderPdfFromHtml(html, filename);
      }
    } catch (err) {
      console.error('[handleDownload]', err);
      alert("Impossible de télécharger le PDF. Ouverture dans l'éditeur…");
      handleModify(item);
    } finally {
      setDownloadingId(null);
    }
  }, [handleModify]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteHistory(deleteTarget.id);
    setCvList(getHistorySync());
    setDeleteTarget(null);
  }, [deleteTarget]);

  // ── Envoi lead vers le CRM ─────────────────────────────────────────────
  const handleCreateLead = useCallback((item) => {
    if (!embedded) return;
    notifyCreateLead({ cv_data: item.data, html: item.html, name: item.name });
    setLeadSentIds(prev => new Set([...prev, item.id]));
  }, [embedded, notifyCreateLead]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>
      {showOnboard && <GameOnboarding onDone={() => { try { localStorage.setItem('talia_onboarded', '1'); } catch { /* */ } setShowOnboard(false); }} />}

      {/* ── Bandeau retour Stripe ── */}
      <CheckoutSuccessBanner
        checkoutState={checkoutState}
        activatedTier={activatedTier}
        onDismiss={dismissCheckout}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        @keyframes cardIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <header style={{
        background: C.bg, borderBottom: `1px solid ${C.rule}`,
        height: isMobile ? 60 : 79,
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 16px' : '0 40px',
        gap: isMobile ? 8 : 12,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: C.ink, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <IconDoc s={16} />
          </div>
          {!isMobile && (
            <span style={{ fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: '-0.2px' }}>
              Altio <span style={{ color: C.bluePrimary }}>CV</span>
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Parrainage école (accès offert) */}
        {isSchool && (
          <span title={orgName ? `Accès offert par ${orgName}` : 'Accès offert par ton école'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800,
              color: C.ok, background: alpha(C.ok, 12), padding: '5px 11px', borderRadius: 99, whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🎓 {orgName || 'École'}
          </span>
        )}

        {/* Énergie IA du jour */}
        <EnergyBar variant="pill" />
      </header>

      {/* ── Layout : sidebar gauche + contenu ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 0 : 28, maxWidth: 1300, margin: '0 auto', padding: isMobile ? '16px 0 88px' : '28px 28px 80px' }}>
        <Sidebar section={section} setSection={setSection} isMobile={isMobile} showEncadrement={isEncadrant} />
        <main style={{ flex: 1, minWidth: 0, maxWidth: 1180, padding: isMobile ? '0 16px' : 0 }}>

        {section === 'home' && (
        <>
        {/* Tableau de bord */}
        <div style={{ marginBottom: isMobile ? 16 : 22 }}>
          <h1 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: C.ink, letterSpacing: '-1px', lineHeight: 1.05, margin: 0 }}>
            {user ? 'Bonjour 👋' : 'Bienvenue sur Altio CV'}
          </h1>
          <p style={{ fontSize: isMobile ? 13.5 : 15.5, color: C.ink2, marginTop: 8, lineHeight: 1.5, maxWidth: 520 }}>
            Prépare-toi à décrocher ton poste : CV, entraînements et suivi, au même endroit.
          </p>
        </div>

        {/* Tableau de bord : niveau/XP + énergie */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 16, padding: '16px 18px', boxShadow: '0 4px 18px rgba(11,22,56,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 11 }}>
              <span style={{ fontSize: 26 }}>{dashLvl.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>Niveau {dashLvl.index + 1} · {dashLvl.label}</div>
                <div style={{ fontSize: 12.5, color: C.mute }}>⚡ {dashXp} XP{dashLvl.next ? ` · encore ${dashLvl.toNext} pour ${dashLvl.next.label}` : ' · niveau max 👑'}</div>
              </div>
              {dashStreak > 0 && <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.star, background: alpha(C.star, 16), padding: '5px 10px', borderRadius: 99 }}>🔥 {dashStreak} j</span>}
            </div>
            <div style={{ height: 8, background: C.surface, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${dashLvl.progress}%`, background: C.bluePrimary, borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
          </div>
          <EnergyBar variant="card" />
        </div>

        {/* Snapshot employabilité */}
        {dashDiag && (
          <div onClick={() => navigate('/diagnostic')}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.card, border: `1px solid ${C.rule}`, borderRadius: 16, padding: '14px 18px', marginBottom: isMobile ? 16 : 22, cursor: 'pointer', boxShadow: '0 4px 18px rgba(11,22,56,.05)' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${dashDiag.tier.color} ${dashDiag.global * 3.6}deg, ${C.rule} 0deg)`, display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.card, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, color: dashDiag.tier.color }}>{dashDiag.global}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>{dashDiag.tier.emoji} {dashDiag.tier.label}</div>
              <div style={{ fontSize: 12.5, color: C.mute }}>Score d'employabilité · {dashDiag.global}%</div>
            </div>
            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: C.bluePrimary }}>Voir le bilan →</span>
          </div>
        )}

        {/* Bienvenue après rattachement à une école (one-shot) */}
        {joinNotice && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: isMobile ? '13px 15px' : '15px 20px',
            background: alpha(C.ok, 12), border: `1px solid ${alpha(C.ok, 34)}`,
            borderRadius: 14, marginBottom: isMobile ? 18 : 24,
          }}>
            <span style={{ fontSize: isMobile ? 22 : 26 }}>🎓</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 14 : 15.5, fontWeight: 800, color: C.ink }}>
                Bienvenue ! Tu as rejoint {joinNotice} 🎉
              </div>
              <div style={{ fontSize: isMobile ? 12 : 13, color: C.ink2, lineHeight: 1.45 }}>
                Ton accès aux fonctionnalités est offert par ton école — pas d'abonnement à payer.
              </div>
            </div>
            <button onClick={() => { clearJoinNotice(); setJoinNotice(null); }}
              style={{ flexShrink: 0, background: 'transparent', border: 'none', color: C.mute, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Bandeau Mode démo — IA simulée en local (en attendant le backend) */}
        {demoOn && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
            padding: isMobile ? '12px 14px' : '14px 20px',
            background: 'linear-gradient(90deg,#FFF8E6,#FEF1F6)',
            border: '1px solid #F0D8A8', borderRadius: 14,
            marginBottom: isMobile ? 18 : 24,
          }}>
            <span style={{ fontSize: isMobile ? 22 : 26 }}>🧪</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 13.5 : 15, fontWeight: 800, color: C.ink }}>Mode démo actif</div>
              <div style={{ fontSize: isMobile ? 11.5 : 13, color: C.ink2, lineHeight: 1.45 }}>
                Les fonctionnalités IA (lettre, test, oral, optimisation…) sont simulées en local, sans backend.
              </div>
            </div>
            <button
              onClick={() => { setDemoMode(false); setDemoOn(false); }}
              style={{
                flexShrink: 0, background: C.card, color: C.ink2, border: '1px solid #E7C98F',
                borderRadius: 99, padding: isMobile ? '7px 12px' : '8px 14px',
                fontSize: isMobile ? 11.5 : 12.5, fontWeight: 700, cursor: 'pointer',
              }}>
              Désactiver
            </button>
          </div>
        )}

        {/* Accès espace encadrant — réservé aux conseillers / direction */}
        {isEncadrant && (
          <div onClick={() => navigate('/encadrement')}
            style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16,
              padding: isMobile ? '13px 15px' : '15px 20px',
              background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14,
              marginBottom: isMobile ? 18 : 24, cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(11,22,56,.05)',
            }}>
            <span style={{ fontSize: isMobile ? 24 : 28 }}>👩‍🏫</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 14 : 15.5, fontWeight: 800, color: C.ink }}>Espace encadrant</div>
              <div style={{ fontSize: isMobile ? 12 : 13, color: C.mute, lineHeight: 1.45 }}>
                Vue conseiller & direction : la progression de la cohorte (démo).
              </div>
            </div>
            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: C.bluePrimary }}>Ouvrir →</span>
          </div>
        )}

        {/* Raccourcis */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { ic: '🎯', lb: "S'entraîner", on: () => setSection('prep') },
            { ic: '📄', lb: 'Nouveau CV', on: () => navigate('/generate') },
            { ic: '🧪', lb: 'Mon bilan', on: () => navigate('/diagnostic') },
          ].map((q) => (
            <button key={q.lb} onClick={q.on}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: isMobile ? '14px 8px' : '18px 12px', cursor: 'pointer', fontFamily: 'Manrope,sans-serif', boxShadow: '0 4px 18px rgba(11,22,56,.05)' }}>
              <span style={{ fontSize: isMobile ? 22 : 26 }}>{q.ic}</span>
              <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 800, color: C.ink }}>{q.lb}</span>
            </button>
          ))}
        </div>
        </>
        )}

        {section === 'prep' && (
        <>
        <h1 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: C.ink, letterSpacing: '-1px', lineHeight: 1.05, margin: '0 0 6px' }}>Préparation</h1>
        <p style={{ fontSize: isMobile ? 13.5 : 15.5, color: C.ink2, margin: '0 0 20px', lineHeight: 1.5, maxWidth: 520 }}>Tes modules d'entraînement vers l'emploi.</p>

        {/* Modules — grille 5 par ligne */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? 10 : 14,
          marginBottom: isMobile ? 24 : 36,
        }}>
          {HOME_MODULES.map((m, i) => (
            <div key={m.route} onClick={() => navigate(m.route)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 7,
                background: C.card, border: `1px solid ${C.rule}`,
                borderRadius: 16, padding: isMobile ? '13px 13px' : '16px 16px 14px',
                cursor: 'pointer', boxShadow: '0 4px 18px rgba(11,22,56,.05)',
                transition: 'transform .15s, box-shadow .15s',
                animation: 'fadeIn .6s ease both', animationDelay: `${i * 0.04}s`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 26px rgba(11,22,56,.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(11,22,56,.05)'; }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 22, background: alpha(m.accent, 14), color: m.accent }}>{m.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', color: C.ink, lineHeight: 1.25 }}>{m.title}</div>
              <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.desc}</div>
              {m.route === '/entretien' && interviewPct > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 5, background: C.track, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${interviewPct}%`, background: m.accent, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: C.mute }}>{interviewPct}%</span>
                </div>
              )}
              <div style={{ fontSize: 12.5, fontWeight: 800, color: m.accent, marginTop: 2 }}>{m.cta} →</div>
            </div>
          ))}
        </div>
        </>
        )}

        {section === 'cv' && (
        <>
        {/* Hero — titre de la liste des CV (placé sous les modules) */}
        <div style={{ margin: isMobile ? '8px 0 28px' : '16px 0 48px', animation: 'fadeIn 0.8s ease both' }}>
          <h1 style={{ fontSize: isMobile ? 36 : 64, fontWeight: 700, color: C.ink, letterSpacing: isMobile ? '-0.8px' : '-2px', lineHeight: 1.05, marginBottom: 8 }}>Mes CV</h1>
          {!isMobile && (
            <p style={{ fontSize: 16.5, color: C.ink2, fontWeight: 400, lineHeight: 1.55 }}>
              Créez et gérez vos CV professionnels avec un design premium.
            </p>
          )}
        </div>

        {/* Stats */}
        {cvList.length > 0 && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 48, flexWrap: 'wrap' }}>
            <StatCard icon={<IconDoc s={20} />} value={cvList.length} label="CV créés" />
            <StatCard icon={<IconCheck s={20} />} value={cvList.length} label="Prêts à l'envoi" badge="100 %" />
            <StatCard icon={<IconClock s={20} />} value={formatDate(cvList[0]?.id)} label="Dernière mise à jour" sub={timeAgo(cvList[0]?.id)} />
          </div>
        )}

        {/* Bannière CRM lié */}
        {!embedded && isCRMLinked && crmLink && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, marginBottom: 28, animation: 'fadeIn .4s ease' }}>
            <span style={{ fontSize: 20 }}>🔗</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>
                Connecté à {crmLink.orgName}
              </div>
              <div style={{ fontSize: 11.5, color: '#16A34A', marginTop: 1 }}>
                Les CV générés sont automatiquement envoyés vers votre espace CRM.
              </div>
            </div>
            <button onClick={unlinkCRM}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', color: '#16A34A', border: '1px solid #86EFAC', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: FONT }}
              onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Délier
            </button>
          </div>
        )}

        {/* Invite lien CRM — si pas lié, pas embedded, et page non vide */}
        {!embedded && !isCRMLinked && cvList.length > 0 && !isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 10, marginBottom: 24, animation: 'fadeIn .4s ease' }}>
            <span style={{ fontSize: 16 }}>🔗</span>
            <div style={{ flex: 1, fontSize: 12.5, color: C.ink2 }}>
              <strong style={{ color: C.ink }}>Lier votre CRM Talia</strong> — demandez un lien de connexion à votre administrateur pour synchroniser les CV automatiquement.
            </div>
          </div>
        )}

        {/* Bannière limite CVs (plan Free) */}
        {isFree && !canCV(cvList.length) && (
          <div style={{ marginBottom: 24 }}>
            <PlanBanner
              variant="limit"
              message={`Limite atteinte — le plan Gratuit permet ${plan.maxCVs} CV. Passez au plan Personnel pour créer des CV sans limite.`}
              next={nextPlan || 'Personnel'}
              onUpgrade={() => navigate('/pricing')}
            />
          </div>
        )}
        {isFree && canCV(cvList.length) && remainingCVs(cvList.length) !== Infinity && remainingCVs(cvList.length) <= 1 && (
          <div style={{ marginBottom: 24 }}>
            <PlanBanner
              variant="warning"
              message={`Il vous reste ${remainingCVs(cvList.length)} CV${remainingCVs(cvList.length) > 1 ? 's' : ''} sur votre plan Gratuit (${cvList.length}/${plan.maxCVs}).`}
              next={nextPlan || 'Personnel'}
              onUpgrade={() => navigate('/pricing')}
            />
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
                <div style={{ position:'relative', display:'flex', alignItems:'center', gap:6, padding:'8px 12px', background: C.card, border:`1px solid ${C.rule}`, borderRadius:99, fontSize:12.5, fontWeight:600, color:C.ink }}>
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
          <>
            {/* Quick actions — toujours en haut, indépendamment du mode */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 28 }}>
              {/* Create card */}
              <div onClick={() => navigate('/generate')} style={{ border: `1.5px dashed ${C.rule}`, borderRadius: 16, padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: C.bg, transition: 'border-color .2s, background .2s', minHeight: 110, animation: 'cardIn 0.65s cubic-bezier(.16,.84,.24,1) 0s both' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.bluePrimary; e.currentTarget.style.background = C.blueSoft; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.background = C.bg; }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.bluePrimary, flexShrink: 0 }}>
                  <IconPlus s={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 3, letterSpacing: '-0.2px' }}>Créer un nouveau CV</div>
                  <div style={{ fontSize: 12.5, color: C.mute }}>Commencer depuis zéro</div>
                </div>
              </div>

              {/* Bulk card */}
              <div onClick={() => navigate('/bulk')} style={{ border: `1.5px dashed ${C.rule}`, borderRadius: 16, padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: C.bg, transition: 'border-color .2s, background .2s', minHeight: 110, animation: 'cardIn 0.65s cubic-bezier(.16,.84,.24,1) 0.05s both' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#f5f3ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.background = C.bg; }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 3, letterSpacing: '-0.2px' }}>Générer en masse</div>
                  <div style={{ fontSize: 12.5, color: C.mute }}>Plusieurs CV en une fois</div>
                </div>
              </div>
            </div>

            {/* Grille des CV existants (mode classique) */}
            {!groupByBulk && filtered.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {filtered.map((item, i) => (
                  <CVCard key={item.id} item={item} animDelay={Math.min((i + 1) * 0.05, 0.4)}
                    onModify={handleModify} onView={setViewCV} onDelete={setDeleteTarget}
                    onCreateLead={embedded ? (leadSentIds.has(item.id) ? null : handleCreateLead) : null} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty filtered state */}
        {cvList.length > 0 && filtered.length === 0 && !groupByBulk && (
          <div style={{ textAlign:'center', padding:'48px 24px', animation:'fadeIn .3s ease' }}>
            <div style={{ width:64, height:64, borderRadius:16, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', color:C.mute, margin:'0 auto 16px' }}>
              <IconSearch s={26} />
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:6 }}>Aucun CV ne correspond</div>
            <div style={{ fontSize:13, color:C.mute, marginBottom:18 }}>Essaie une autre recherche ou retire des filtres.</div>
            <button onClick={clearFilters} style={{ padding:'9px 20px', border:`1px solid ${C.rule}`, background: C.card, borderRadius:99, fontSize:13, fontWeight:600, color:C.ink, cursor:'pointer', fontFamily:FONT }}>
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
                    onModify={handleModify} onView={setViewCV} onDelete={setDeleteTarget}
                    onCreateLead={embedded ? (leadSentIds.has(item.id) ? null : handleCreateLead) : null} />
                ))}
              </div>
            </div>
          );
        })}
        </>
        )}

        {section === 'encadrement' && (
          <>
            <h1 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: C.ink, letterSpacing: '-1px', lineHeight: 1.05, margin: '0 0 6px' }}>Encadrement</h1>
            <p style={{ fontSize: isMobile ? 13.5 : 15.5, color: C.ink2, margin: '0 0 20px', lineHeight: 1.5, maxWidth: 520 }}>
              Suis la progression de tes élèves (conseiller) ou de toute la cohorte (direction).
            </p>
            <div onClick={() => navigate('/encadrement')}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.card, border: `1px solid ${C.rule}`, borderRadius: 16, padding: '18px 20px', cursor: 'pointer', boxShadow: '0 4px 18px rgba(11,22,56,.05)' }}>
              <span style={{ fontSize: 30 }}>👩‍🏫</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Ouvrir l'espace encadrant</div>
                <div style={{ fontSize: 13, color: C.mute }}>Liste des élèves, relances, fiches, réattribution.</div>
              </div>
              <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.bluePrimary }}>Ouvrir →</span>
            </div>
          </>
        )}

        {section === 'account' && (
          <>
            <h1 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: C.ink, letterSpacing: '-1px', lineHeight: 1.05, margin: '0 0 18px' }}>Compte</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>{plan?.emoji} Forfait {plan?.label}</div>
                {isSchool && orgName && <div style={{ fontSize: 12.5, color: C.ok, fontWeight: 700, marginTop: 2 }}>🎓 Accès offert par {orgName}</div>}
              </div>
              {!isSchool && nextPlan && (
                <button onClick={() => navigate('/pricing')} style={{ background: C.bluePrimary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope,sans-serif', whiteSpace: 'nowrap' }}>Passer à {nextPlan}</button>
              )}
            </div>
            {[
              { lb: '🌙 Thème', btn: mode === 'dark' ? '☀️ Clair' : '🌙 Sombre', on: toggleTheme },
              { lb: '🧪 Mode démo', btn: demoOn ? 'Désactiver' : 'Activer', on: () => { setDemoMode(!demoOn); setDemoOn(!demoOn); } },
              { lb: '🎨 Charte graphique', btn: 'Voir', on: () => navigate('/charte') },
              { lb: '🧭 Visite guidée', btn: 'Lancer', on: () => setShowOnboard(true) },
              ...(demoOn ? [{ lb: '👩‍🏫 Mode encadrant (démo)', btn: isDemoEncadrant() ? 'Désactiver' : 'Activer', on: () => { setDemoEncadrant(!isDemoEncadrant()); location.reload(); } }] : []),
              { lb: user ? `👤 ${user.email}` : '👤 Non connecté', btn: user ? 'Déconnexion' : 'Connexion', on: user ? signOut : () => navigate('/auth') },
            ].map((r) => (
              <div key={r.lb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: C.card, border: `1px solid ${C.rule}`, borderRadius: 12, padding: '13px 16px', marginTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.lb}</span>
                <button onClick={r.on} style={{ flexShrink: 0, background: C.surface, color: C.ink2, border: `1px solid ${C.rule}`, borderRadius: 99, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>{r.btn}</button>
              </div>
            ))}
          </>
        )}
        </main>
      </div>

      <PreviewModal
        item={viewCV}
        onModify={handleModify}
        onDownload={handleDownload}
        downloading={downloadingId === viewCV?.id}
        onClose={() => setViewCV(null)}
      />
      {deleteTarget && <ConfirmModal name={deleteTarget.name} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
