import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FORMATIONS, DATES, POSTES, COMP_TECH, COMP_SOFT, PALETTES,
  adaptPoste, renderCVFromData, saveEditorState, escH
} from '@/lib/cvData';
import { saveHistory } from '@/lib/historySync';
import { getProfiles, buildProfileContext } from '@/lib/profileData';
import { useSettings } from '@/hooks/useSettings.jsx';
import { useCRMBridge } from '@/hooks/useCRMBridge.jsx';
import { useCRMToken } from '@/hooks/useCRMToken';

// ─── Color tokens ───────────────────────────────────────────────────────────────
const C = {
  bluePrimary: '#1539B7',
  blueHover:   '#1F4FE0',
  blueSoft:    '#EEF2FF',
  ink:         '#0B1020',
  ink2:        '#3A4156',
  mute:        '#9AA0AE',
  rule:        '#ECEDF1',
  bg:          '#FFFFFF',
  surface:     '#F7F8FA',
  star:        '#F5B400',
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  const colors = {
    success: { border: '#6ee7b7', bg: '#f0fdf4' },
    error:   { border: '#fca5a5', bg: '#fff1f2' },
    info:    { border: C.blueSoft, bg: '#f0f4ff' },
  };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => {
        const col = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: col.bg, border: '1px solid ' + col.border,
            borderRadius: 10, padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            maxWidth: 360, animation: 'fadeInUp 0.25s ease',
            fontFamily: 'Manrope, sans-serif',
          }}>
            <span style={{ flex: 1, fontSize: 13, color: C.ink }}>{t.msg}</span>
            <button onClick={() => remove(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: C.mute, padding: '0 0 0 8px', lineHeight: 1,
            }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info', dur = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), dur);
  }, []);
  const remove = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, show, remove };
}

// ─── API Anthropic ─────────────────────────────────────────────────────────────
const ANTHROPIC_URL = import.meta.env.DEV
  ? '/api/anthropic/v1/messages'
  : 'https://api.anthropic.com/v1/messages';

async function callAnthropicAPI(body, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  if (!import.meta.env.DEV) {
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw Object.assign(new Error(e.error?.message || 'Erreur API (HTTP ' + res.status + ')'), { status: res.status });
  }
  return res.json();
}

// ─── Mock CV (test sans clé API) ───────────────────────────────────────────────
function buildMockCvData({ formation, formationVal, poste, genre, comp, dateVal }) {
  const techPool  = (COMP_TECH[formationVal] || []).slice(0, 6);
  const softPool  = (COMP_SOFT[formationVal] || []).slice(0, 5);
  const techniques        = [...new Set([...comp.tech, ...techPool])].slice(0, 8);
  const comportementales  = [...new Set([...comp.soft, ...softPool])].slice(0, 6);

  return {
    prenom: 'Prénom',
    nom: 'NOM',
    telephone: '06 00 00 00 00',
    email: 'prenom.nom@email.fr',
    adresse: 'Ville (00)',
    dateNaissance: '',
    poste: poste || (POSTES[formationVal]?.[0] || 'POSTE VISÉ').toUpperCase(),
    accroche: `Actuellement en recherche d'alternance dans le cadre de la formation ${formation?.l || ''} au sein de l'école Talia, je suis motivé(e) à mettre mes compétences au service d'une entreprise dynamique. Rigoureux(se) et organisé(e), j'aspire à développer mes connaissances professionnelles dans un environnement stimulant.`,
    experiences: [
      {
        poste: 'Exemple de poste',
        entreprise: 'Entreprise exemple',
        lieu: 'Ville',
        periode: 'Jan. 2024 – Août 2024',
        missions: [
          'Mission principale liée au poste occupé',
          "Participation aux tâches de l'équipe",
          'Gestion et suivi des dossiers courants',
        ],
      },
    ],
    formations: [
      {
        titre: formation?.l || 'Formation Talia',
        etablissement: 'Talia · France',
        periode: (dateVal || 'Sept. 2024') + ' — ' + (formation?.d || '16 mois'),
        isTalia: true,
      },
      {
        titre: 'Baccalauréat Général',
        etablissement: 'Lycée Exemple · Ville',
        periode: '2023',
        isTalia: false,
      },
    ],
    competences: {
      techniques,
      comportementales,
      outils: ['Pack Office', 'Google Workspace'],
    },
    langues: [{ langue: 'Français', niveau: 'Natif' }, { langue: 'Anglais', niveau: 'B1' }],
    centresInteret: ['Sport', 'Voyages', 'Culture générale'],
    lettreMotivation: '',
  };
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function Badge({ children, variant = 'gray' }) {
  const styles = {
    blue: { background: C.blueSoft, color: C.bluePrimary, border: '1px solid ' + C.bluePrimary + '33' },
    gray: { background: C.surface, color: C.mute, border: '1px solid ' + C.rule },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
      fontFamily: 'Manrope, sans-serif',
      ...styles[variant],
    }}>{children}</span>
  );
}

const SectionCard = React.forwardRef(function SectionCard({ children, active, complete, style }, ref) {
  return (
    <div ref={ref} style={{
      background: C.bg,
      border: '1.5px solid ' + (complete ? '#22c55e55' : active ? C.bluePrimary + '66' : C.rule),
      borderRadius: 16,
      padding: 22,
      marginBottom: 16,
      transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
      boxShadow: active ? '0 6px 24px '+C.bluePrimary+'18' : complete ? '0 2px 12px #22c55e15' : 'none',
      position: 'relative',
      ...style,
    }}>
      {complete && (
        <div style={{
          position:'absolute', top:14, right:14,
          width:24, height:24, borderRadius:'50%', background:'#22c55e',
          display:'flex', alignItems:'center', justifyContent:'center',
          animation:'checkPop .4s cubic-bezier(.16,.84,.24,1)',
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
      {children}
    </div>
  );
});

function CardHeader({ label, status }) {
  const statusConfig = {
    active:  { text: 'En cours',    variant: 'blue' },
    pending: { text: 'À compléter', variant: 'gray' },
    locked:  { text: 'Verrouillé',  variant: 'gray' },
  };
  const s = statusConfig[status] || statusConfig.pending;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: 'Manrope, sans-serif' }}>{label}</span>
      <Badge variant={s.variant}>{s.text}</Badge>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.mute,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 5, fontFamily: 'Manrope, sans-serif',
    }}>{children}</div>
  );
}

const selectStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid ' + C.rule, borderRadius: 10,
  fontSize: 13, color: C.ink, background: C.bg,
  fontFamily: 'Manrope, sans-serif',
  outline: 'none', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%239AA0AE' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
  cursor: 'pointer',
  transition: 'border-color 0.18s',
};

const textareaStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid ' + C.rule, borderRadius: 10,
  fontSize: 13, color: C.ink, background: C.bg,
  fontFamily: 'Manrope, sans-serif',
  outline: 'none', resize: 'vertical',
  lineHeight: 1.6, transition: 'border-color 0.18s',
};

// ─── Accordéon Annonce ─────────────────────────────────────────────────────
function AnnonceAccordion({ active, text, keywords, onChange }) {
  const [open, setOpen] = useState(false);

  // S'ouvre automatiquement si du texte a été saisi
  useEffect(() => { if (active && !open) setOpen(true); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      background: C.bg, borderRadius: 16, overflow: 'hidden',
      border: '1.5px solid ' + (active ? '#FDE68A' : C.rule),
      marginBottom: 16,
      transition: 'border-color 0.3s',
      boxShadow: active ? '0 2px 12px #F5B40015' : 'none',
    }}>
      {/* Header cliquable */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', textAlign: 'left',
        }}
      >
        {/* Icône cible */}
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: active ? '#FFFBEB' : C.surface,
          border: '1px solid ' + (active ? '#FDE68A' : C.rule),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? '#92400e' : C.mute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 2 }}>
            Adapter à une annonce
          </div>
          <div style={{ fontSize: 12, color: C.mute, lineHeight: 1.4 }}>
            {active
              ? `Annonce ajoutée · ${keywords.length} mots-clés détectés`
              : 'Optionnel — reformule les missions selon une offre d\'emploi'}
          </div>
        </div>

        {/* Badge + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {active && (
            <span style={{ padding: '3px 10px', borderRadius: 99, background: '#FFF9E6', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, color: '#92400e' }}>
              ✓ Ajoutée
            </span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={C.mute} strokeWidth="2" strokeLinecap="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Corps accordéon */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid ' + C.rule, animation: 'fadeIn 0.18s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start', paddingTop: 16 }}>
            {/* Explication */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e', lineHeight: 1.65 }}>
              <strong>Comment ça marche :</strong> Collez le texte d'une offre pour adapter les missions du CV au vocabulaire de l'annonce — sans jamais inventer d'expériences.
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Texte de l'annonce</div>
              <textarea
                value={text}
                onChange={e => onChange(e.target.value)}
                placeholder="Collez ici le texte de l'offre d'emploi…"
                rows={4}
                style={{ ...textareaStyle }}
                autoFocus
              />
              {keywords.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Mots-clés détectés</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {keywords.map(k => (
                      <span key={k} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#FFF9E6', color: '#92400e', border: '1px solid #FDE68A', fontFamily: 'Manrope, sans-serif' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generation Overlay (animated stages) ──────────────────────────────────
function GenerationOverlay({ visible, progress, progressText, stage, error, onClose }) {
  if (!visible) return null;
  const stages = [
    { key:'extract',  label:'Lecture du CV',         icon: '📄', desc:'Extraction des informations…' },
    { key:'enrich',   label:'Enrichissement IA',     icon: '✨', desc:'Adaptation au programme Talia…' },
    { key:'design',   label:'Mise en page',          icon: '🎨', desc:'Création du design premium…' },
    { key:'done',     label:'CV prêt',               icon: '✓',  desc:'Préparation de l\'éditeur…' },
  ];

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9000,
      background:'rgba(11,16,32,0.55)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      animation:'fadeIn .25s ease',
    }}>
      <div style={{
        width:'min(560px, 92vw)', background:'#fff', borderRadius:24,
        padding:'36px 36px 30px', boxShadow:'0 40px 100px rgba(11,16,32,.35)',
        animation:'fadeInUp .35s cubic-bezier(.16,.84,.24,1)',
      }}>
        {/* Top illustration */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <div style={{
            width:64, height:64, borderRadius:20,
            background:'linear-gradient(135deg, '+C.bluePrimary+', '+C.blueHover+')',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 12px 30px '+C.bluePrimary+'55',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.3) 50%, transparent 70%)', backgroundSize:'200% 100%', animation:'shimmer 2s linear infinite' }} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize:22, fontWeight:800, color:C.ink, textAlign:'center', letterSpacing:'-0.5px', marginBottom:6 }}>
          {error ? 'Une erreur est survenue' : stage === 3 ? 'CV généré !' : 'Génération en cours'}
        </h2>
        <p style={{ fontSize:13.5, color:C.mute, textAlign:'center', marginBottom:24, lineHeight:1.55 }}>
          {error ? error : progressText || 'L\'IA Talia prépare ton CV…'}
        </p>

        {/* Progress bar */}
        {!error && (
          <div style={{ marginBottom:24 }}>
            <div style={{ position:'relative', height:6, background:C.rule, borderRadius:99, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:99,
                background:'linear-gradient(90deg, '+C.bluePrimary+', '+C.blueHover+')',
                width: progress + '%', transition:'width 0.5s cubic-bezier(.16,.84,.24,1)',
                boxShadow:'0 0 16px '+C.bluePrimary+'66',
              }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:C.mute, fontWeight:600 }}>
              <span>{progress}%</span>
              {stage < 3 && (
                <span style={{ display:'flex', gap:3 }}>
                  <span className="gen-stage-dot" style={{ display:'inline-block', width:4, height:4, borderRadius:'50%', background:C.bluePrimary }} />
                  <span className="gen-stage-dot" style={{ display:'inline-block', width:4, height:4, borderRadius:'50%', background:C.bluePrimary }} />
                  <span className="gen-stage-dot" style={{ display:'inline-block', width:4, height:4, borderRadius:'50%', background:C.bluePrimary }} />
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stages list */}
        {!error && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {stages.map((s, i) => {
              const done = i < stage;
              const active = i === stage;
              return (
                <div key={s.key} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 14px', borderRadius:12,
                  background: active ? C.blueSoft : done ? '#f0fdf4' : C.surface,
                  border:'1px solid '+(active ? C.bluePrimary+'44' : done ? '#22c55e44' : C.rule),
                  transition:'all .3s',
                  opacity: i > stage ? .5 : 1,
                }}>
                  <div style={{
                    width:30, height:30, borderRadius:'50%', flexShrink:0,
                    background: done ? '#22c55e' : active ? C.bluePrimary : '#fff',
                    border:'1.5px solid '+(done ? '#22c55e' : active ? C.bluePrimary : C.rule),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: done || active ? '#fff' : C.mute, fontSize:14,
                  }}>
                    {done
                      ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation:'checkPop .35s cubic-bezier(.16,.84,.24,1)' }}><path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : active
                        ? <div style={{ width:12, height:12, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                        : <span>{s.icon}</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: active ? C.bluePrimary : done ? '#15803d' : C.ink2 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:C.mute, marginTop:1 }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error retry */}
        {error && (
          <button onClick={onClose} style={{
            width:'100%', marginTop:8, padding:'12px',
            background:C.ink, color:'#fff', border:'none', borderRadius:12,
            fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Manrope, sans-serif',
          }}>Fermer</button>
        )}
      </div>
    </div>
  );
}

// ─── Stepper (animated, with descriptions + sub-progress) ───────────────────
function Stepper({ steps, activeIndex, onStepClick }) {
  const totalPct = Math.min(100, Math.round((activeIndex / (steps.length - 1)) * 100));
  return (
    <div style={{ marginBottom: 36 }}>
      {/* Progress bar globale */}
      <div style={{ position:'relative', height: 4, background: C.rule, borderRadius: 99, marginBottom: 22, overflow:'hidden' }}>
        <div style={{
          position:'absolute', inset:0, width: totalPct+'%',
          background: 'linear-gradient(90deg, '+C.bluePrimary+', '+C.blueHover+')',
          borderRadius: 99, transition: 'width 0.6s cubic-bezier(.16,.84,.24,1)',
          boxShadow: '0 0 12px '+C.bluePrimary+'55',
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 14 }}>
        {steps.map((step, i) => {
          const done   = i < activeIndex;
          const active = i === activeIndex;
          const clickable = !!onStepClick && i <= activeIndex;
          return (
            <button
              key={i}
              type="button"
              onClick={clickable ? () => onStepClick(i) : undefined}
              style={{
                display:'flex', alignItems:'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: active ? C.blueSoft : 'transparent',
                border: '1px solid ' + (active ? C.bluePrimary+'55' : done ? '#22c55e33' : C.rule),
                cursor: clickable ? 'pointer' : 'default',
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                animation: active ? 'stepPulse 1.8s ease-in-out infinite' : 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: done ? '#22c55e' : active ? C.bluePrimary : '#fff',
                border: '2px solid ' + (done ? '#22c55e' : active ? C.bluePrimary : C.rule),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s', color: done || active ? '#fff' : C.mute,
                fontSize: 14, fontWeight: 700,
                boxShadow: active ? '0 0 0 6px '+C.bluePrimary+'15' : 'none',
              }}>
                {done
                  ? <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ animation:'checkPop .35s cubic-bezier(.16,.84,.24,1)' }}><path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : i + 1
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: active || done ? 700 : 600,
                  color: active ? C.bluePrimary : done ? '#15803d' : C.ink2,
                  marginBottom: 2, letterSpacing: '-0.1px',
                  transition: 'color 0.2s',
                }}>{step.label}</div>
                <div style={{ fontSize: 11, color: C.mute, lineHeight: 1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {done ? '✓ Complété' : step.hint}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ProfilePicker ─────────────────────────────────────────────────────────────
// Sélecteur compact de profil dans la page Nouveau CV, avant le stepper
function ProfilePicker({ profiles, selectedId, onChange, onCreateNew }) {
  const selected = profiles.find(p => String(p.id) === String(selectedId));

  return (
    <div style={{
      marginBottom: 24, padding: '14px 18px', borderRadius: 14,
      border: '1.5px solid ' + (selected ? C.bluePrimary + '55' : C.rule),
      background: selected ? C.blueSoft : C.bg,
      transition: 'all .2s',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: profiles.length > 0 ? 12 : 0 }}>
        <span style={{ fontSize: 20 }}>🧠</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: selected ? C.bluePrimary : C.ink }}>
            Profil IA{selected ? ` — ${selected.emoji} ${selected.nom}` : ''}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.mute }}>
            {profiles.length === 0
              ? "Crée un profil pour que l'IA génère un CV à ta voix (optionnel)"
              : selected
                ? "Le profil oriente la voix, le ton et le contexte du CV généré"
                : "Choisis un profil pour personnaliser la voix du CV (optionnel)"}
          </p>
        </div>
      </div>

      {/* Chips de sélection */}
      {profiles.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {/* Sans profil */}
          <button
            onClick={() => onChange('')}
            style={{
              padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: '1.5px solid ' + (!selectedId ? C.bluePrimary : C.rule),
              background: !selectedId ? C.bluePrimary : C.bg,
              color: !selectedId ? '#fff' : C.ink2,
              cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s',
            }}
          >🚫 Sans profil</button>

          {profiles.map(p => {
            const isSel = String(selectedId) === String(p.id);
            return (
              <button key={p.id} onClick={() => onChange(String(p.id))} style={{
                padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1.5px solid ' + (isSel ? C.bluePrimary : C.rule),
                background: isSel ? C.bluePrimary : C.bg,
                color: isSel ? '#fff' : C.ink2,
                cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
              }}>
                <span style={{ fontSize: 15 }}>{p.emoji || '🚀'}</span>
                {p.nom}
                {isSel && <span style={{ fontSize: 11 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Lien créer un profil */}
      <button
        onClick={onCreateNew}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 12, fontWeight: 600, color: C.mute,
          fontFamily: 'Manrope, sans-serif',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
        onMouseEnter={e => e.currentTarget.style.color = C.bluePrimary}
        onMouseLeave={e => e.currentTarget.style.color = C.mute}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Créer un nouveau profil
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { toasts, show: showToast, remove: removeToast } = useToast();

  // Clé API : centralisée et protégée par PIN (voir ⚙️ Paramètres)
  const { apiKey } = useSettings();

  // Bridge CRM (postMessage talia-saas ↔ talia-cv)
  const { embedded, candidate: crmCandidate } = useCRMBridge();
  const { push: crmTokenPush } = useCRMToken();

  // Profils personnalité
  const [profiles] = useState(() => getProfiles());
  const [selectedProfileId, setSelectedProfileId] = useState(
    () => localStorage.getItem('talia_cv_active_profile') || ''
  );
  const selectedProfile = profiles.find(p => String(p.id) === String(selectedProfileId)) || null;

  // Persiste le profil actif dès qu'il change
  useEffect(() => {
    if (selectedProfileId) {
      localStorage.setItem('talia_cv_active_profile', selectedProfileId);
    } else {
      localStorage.removeItem('talia_cv_active_profile');
    }
  }, [selectedProfileId]);

  // Form state
  const [genre,        setGenre]        = useState('');
  const [formationVal, setFormationVal] = useState('');
  const [dateVal,      setDateVal]      = useState('');
  const [posteVal,     setPosteVal]     = useState('');
  const [selectedTech, setSelectedTech] = useState([]);
  const [selectedSoft, setSelectedSoft] = useState([]);

  // Upload state
  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [uploadLoading,  setUploadLoading]  = useState(false);
  const [cvText,         setCvText]         = useState('');

  // Annonce state
  const [annonceText,        setAnnonceText]        = useState('');
  const [annonceBadgeActive, setAnnonceBadgeActive] = useState(false);
  const [annonceKeywords,    setAnnonceKeywords]    = useState([]);

  // Generation state
  const [generating,       setGenerating]       = useState(false);
  const [genProgress,      setGenProgress]      = useState(0);
  const [genProgressText,  setGenProgressText]  = useState('');
  const [genStage,         setGenStage]         = useState(0); // 0:extract, 1:enrich, 2:design, 3:done
  const [genError,         setGenError]         = useState('');

  const fileInputRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);
  const prevStepRef = useRef(0);

  const formation = FORMATIONS.find(f => f.v === formationVal);
  const dates     = formation ? (DATES[formation.n] || []) : [];
  const postes    = formationVal ? (POSTES[formationVal] || []) : [];
  const techTags  = formationVal ? (COMP_TECH[formationVal] || []) : [];
  const softTags  = formationVal ? (COMP_SOFT[formationVal] || []) : [];

  const hasFormation = !!formationVal;
  const hasCV        = !!(cvText.trim().length >= 20 || uploadedFile);
  const canGenerate  = hasFormation && hasCV;

  // Determine stepper active step
  const stepperActive = !hasFormation ? 0 : !hasCV ? 1 : 2;

  // Auto-scroll vers la prochaine carte quand l'étape avance
  useEffect(() => {
    if (stepperActive > prevStepRef.current) {
      const targets = [card1Ref, card2Ref, card3Ref];
      const next = targets[stepperActive]?.current;
      if (next) {
        // petit délai pour laisser l'animation du stepper se faire
        setTimeout(() => next.scrollIntoView({ behavior:'smooth', block:'start' }), 280);
      }
    }
    prevStepRef.current = stepperActive;
  }, [stepperActive]);

  // ── Keyboard shortcut Ctrl+Enter ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canGenerate && !generating) {
        e.preventDefault();
        generate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ── Pré-remplissage automatique depuis le CRM (postMessage) ──
  useEffect(() => {
    if (!crmCandidate) return;
    // Formation : utiliser formationVal (slug) si fourni, sinon matcher par label
    if (crmCandidate.formationVal && !formationVal) {
      setFormationVal(crmCandidate.formationVal);
    } else if (crmCandidate.formation && !formationVal) {
      const match = FORMATIONS.find(f => f.l === crmCandidate.formation);
      if (match) setFormationVal(match.v);
    }
    // Poste visé
    if (crmCandidate.poste && !posteVal) setPosteVal(crmCandidate.poste);
    // Genre
    if (crmCandidate.genre && !genre) setGenre(crmCandidate.genre);
    // Pré-remplir le texte avec les infos candidat
    if (!cvText.trim() && !uploadedFile) {
      const parts = [];
      if (crmCandidate.prenom || crmCandidate.nom) parts.push(`${crmCandidate.prenom || ''} ${crmCandidate.nom || ''}`.trim());
      if (crmCandidate.email)     parts.push('Email : ' + crmCandidate.email);
      if (crmCandidate.telephone) parts.push('Téléphone : ' + crmCandidate.telephone);
      if (crmCandidate.ville)     parts.push('Ville : ' + crmCandidate.ville);
      if (crmCandidate.dateNaissance) parts.push('Date de naissance : ' + crmCandidate.dateNaissance);
      if (parts.length) setCvText(parts.join('\n'));
    }
    showToast(`Candidat ${crmCandidate.prenom || ''} ${crmCandidate.nom || ''} chargé depuis le CRM`, 'success', 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crmCandidate?.id]);

  // ── Réception d'un fichier (PDF/image) envoyé via postMessage ──
  useEffect(() => {
    const handler = async (event) => {
      const file = event.detail;
      if (!file?.base64) return;
      setUploadedFile({ type: file.type === 'image' ? 'image' : 'pdf', base64: file.base64, mediaType: file.mediaType, name: file.name || 'CV depuis CRM' });
      showToast('CV reçu du CRM ✓', 'success');
    };
    window.addEventListener('talia-crm-file-received', handler);
    return () => window.removeEventListener('talia-crm-file-received', handler);
  }, [showToast]);

  // ── Formation change ──
  const onFormationChange = (val) => {
    setFormationVal(val); setDateVal(''); setPosteVal('');
    setSelectedTech([]); setSelectedSoft([]);
  };

  // ── Toggle tag ──
  const toggleTag = (list, setList, tag) => {
    setList(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // ── File upload ──
  const processFile = async (file) => {
    const isImage = file.type.startsWith('image/');
    const isPDF   = file.type === 'application/pdf';
    if (!isImage && !isPDF) { showToast('Format non supporté. Utilise PDF ou image JPG/PNG.', 'error'); return; }
    setUploadLoading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(',')[1]);
        r.onerror = () => rej(new Error('Lecture échouée'));
        r.readAsDataURL(file);
      });
      setUploadedFile({ type: isImage ? 'image' : 'pdf', base64, mediaType: file.type, name: file.name });
    } catch (err) {
      showToast('Erreur lecture: ' + err.message, 'error');
    } finally { setUploadLoading(false); }
  };

  // ── Annonce keywords ──
  const handleAnnonceInput = (val) => {
    setAnnonceText(val);
    setAnnonceBadgeActive(val.trim().length > 30);
    if (val.trim().length > 30) extractKeywords(val);
    else setAnnonceKeywords([]);
  };

  const extractKeywords = (text) => {
    const stopWords = new Set(['de','le','la','les','du','des','un','une','en','et','ou','à','au','aux','par','pour','dans','sur','avec','son','sa','ses','ce','cette','ces','qui','que','dont','où','est','sont','être','avoir','faire','nous','vous','ils','notre','votre','leur','plus','très','bien','tout','tous','peut','doit','sera','seront','pas','ne','ni','aussi','mais','donc','car','si','comme','entre','sous','sans','chez','vers','contre','après','avant','depuis','même','autre','autres','chaque','quelques','plusieurs','peu','beaucoup','trop','fois','ici','là','alors','puis','enfin','déjà','encore','toujours','jamais','souvent','parfois','type','profil','recherche','recherchons','poste','candidat','candidature','contrat','entreprise','société','missions','mission','activités','expérience','formation','diplôme','bac','minimum','ans','idéalement']);
    const words = text.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüÿçœæ\s\-\/]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const kw = Object.entries(freq).filter(([w]) => !stopWords.has(w)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
    setAnnonceKeywords(kw);
  };

  // ── Generate ──
  const generate = async () => {
    if (!canGenerate || generating) return;
    setGenError(''); setGenerating(true); setGenStage(0);
    setGenProgress(10); setGenProgressText('Préparation…');

    const hasAnnonce = annonceText.trim().length > 30;
    const poste = adaptPoste(posteVal, genre);
    const comp  = { tech: selectedTech, soft: selectedSoft };
    const formDomain   = formation.f || '';
    const formCompTech = COMP_TECH[formationVal] || [];
    const formCompSoft = COMP_SOFT[formationVal] || [];
    const formPostes   = POSTES[formationVal] || [];

    const profileCtxGenerate = buildProfileContext(selectedProfile);
    const contextInfo = `\n---\nFormation Talia : ${formation.l} (${formation.d})\nDomaine : ${formDomain}\nNiveau : ${formation.n === 'tp' ? 'Bac / Bac+2' : formation.n === 'bachelor' ? 'Bac+3 (Bachelor)' : 'Bac+5 (Mastère)'}\nCompétences programme : ${formCompTech.join(', ')}\nSoft skills programme : ${formCompSoft.join(', ')}\nPostes types : ${formPostes.join(', ')}\nDate de rentrée : ${dateVal || 'Non précisée'}\nPoste visé : ${poste || 'Non précisé'}\nGenre : ${genre === 'F' ? 'Féminin' : genre === 'M' ? 'Masculin' : 'Non précisé'}\nCompétences techniques sélectionnées : ${comp.tech.join(', ') || 'Aucune'}\nCompétences comportementales sélectionnées : ${comp.soft.join(', ') || 'Aucune'}${profileCtxGenerate}${hasAnnonce ? '\n\n--- ANNONCE À MATCHER ---\n' + annonceText.slice(0, 3000) : ''}`;

    const annonceRules = hasAnnonce ? `\n\nADAPTATION À L'ANNONCE (RÈGLES STRICTES) :\n- REFORMULER les missions pour utiliser le vocabulaire de l'annonce quand pertinent et honnête\n- NE JAMAIS AJOUTER de compétences ou expériences que le candidat ne possède pas\n- Ajouter dans le JSON un champ "matchAnalysis" : { "matched": [], "missing": [], "score": 0..100, "adaptations": "", "formationFit": "" }` : '';

    const extractPrompt = `Tu es un extracteur de données CV expert. Extrais TOUTES les informations et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.

STRUCTURE JSON EXACTE :
{
  "prenom": "string",
  "nom": "string",
  "telephone": "string ou vide",
  "email": "string ou vide",
  "adresse": "string ou vide",
  "dateNaissance": "JJ/MM/AAAA ou vide",
  "poste": "INTITULÉ EN MAJUSCULES",
  "accroche": "4-6 lignes, 1ère personne, parcours réel, formation Talia, poste visé",
  "experiences": [{"poste":"","entreprise":"","lieu":"","periode":"","missions":[]}],
  "formations": [{"titre":"","etablissement":"","periode":"","isTalia":false}],
  "competences": {"techniques":[],"comportementales":[],"outils":[]},
  "langues": [{"langue":"","niveau":""}],
  "centresInteret": [],
  "lettreMotivation": "Si AUCUNE expérience, 3 paragraphes séparés \\n\\n. Sinon vide."${hasAnnonce ? ',\n  "matchAnalysis": {"matched":[],"missing":[],"score":0,"adaptations":"","formationFit":""}' : ''}
}

RÈGLES :
- CONSERVER coordonnées EXACTES du CV source
- CONSERVER TOUTES les expériences et formations (antéchronologique)
- 3 à 5 missions par expérience avec verbes d'action
- Fusionner compétences du CV avec celles sélectionnées, sans doublons
- Formation Talia EN PREMIER dans formations avec isTalia:true
- Si date de naissance fournie dans les paramètres, l'utiliser
- Le poste doit être adapté au genre si précisé
- Répondre UNIQUEMENT avec le JSON${annonceRules}`;

    let userContent;
    const textComp = cvText.trim().length > 5 ? `\n\nInfos complémentaires :\n${cvText}` : '';
    if (uploadedFile) {
      if (uploadedFile.type === 'image') {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: uploadedFile.mediaType, data: uploadedFile.base64 } },
          { type: 'text', text: `Extrais toutes les données de ce CV en image.${textComp}${contextInfo}` },
        ];
      } else {
        userContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: uploadedFile.base64 } },
          { type: 'text', text: `Extrais toutes les données de ce CV en PDF.${textComp}${contextInfo}` },
        ];
      }
    } else {
      userContent = `Extrais toutes les données de ce CV :\n${cvText.slice(0, 7000)}${contextInfo}`;
    }

    // ── Mode démo : pas de clé API → génération locale ──────────────────
    if (!apiKey.trim()) {
      setGenStage(0); setGenProgress(25); setGenProgressText('Extraction (mode démo)…');
      await new Promise(r => setTimeout(r, 500));
      setGenStage(1); setGenProgress(55); setGenProgressText('Enrichissement…');
      await new Promise(r => setTimeout(r, 400));
      const cvData = buildMockCvData({ formation, formationVal, poste, genre, comp, dateVal });
      setGenStage(2); setGenProgress(85); setGenProgressText('Mise en page…');
      await new Promise(r => setTimeout(r, 300));
      const generatedHTML = renderCVFromData(cvData, PALETTES[0]);
      const name = 'Prénom NOM (démo)';
      saveHistory(name, generatedHTML, cvData, formation.l, selectedProfile
        ? { profileId: String(selectedProfile.id), profileName: selectedProfile.nom }
        : {});
      saveEditorState({ generatedHTML, cvData, palette: PALETTES[0], croppedPhoto: '', logoDataURL: '', name });
      setGenStage(3); setGenProgress(100); setGenProgressText('CV démo prêt !');
      showToast("CV de démonstration généré — remplace les données fictives dans l'éditeur", 'info', 5000);
      setTimeout(() => { setGenerating(false); setGenProgress(0); setGenStage(0); navigate('/editor'); }, 900);
      return;
    }

    try {
      setGenStage(0); setGenProgress(25); setGenProgressText('Extraction des données du CV…');
      const data1 = await callAnthropicAPI({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: extractPrompt,
        messages: [{ role: 'user', content: userContent }],
      }, apiKey);

      let jsonStr = data1.content.map(b => b.text || '').join('').trim();
      jsonStr = jsonStr.replace(/^```json?\s*/, '').replace(/```\s*$/, '').trim();
      let cvData;
      try {
        cvData = JSON.parse(jsonStr);
      } catch {
        const first = jsonStr.indexOf('{'), last = jsonStr.lastIndexOf('}');
        if (first >= 0 && last > first) cvData = JSON.parse(jsonStr.slice(first, last + 1));
        else throw new Error('Réponse JSON invalide. Réessayez.');
      }

      setGenStage(1); setGenProgress(65); setGenProgressText('Enrichissement des données…');

      if (poste && !cvData.poste) cvData.poste = poste.toUpperCase();
      if (cvData.poste) cvData.poste = cvData.poste.toUpperCase();

      const hasTalia = cvData.formations?.some(f => f.isTalia);
      if (!hasTalia) {
        cvData.formations = cvData.formations || [];
        cvData.formations.unshift({
          titre: formation.l,
          etablissement: 'Talia · France',
          periode: (dateVal || 'Sept.') + ' — ' + formation.d,
          isTalia: true,
        });
      }
      if (comp.tech.length) {
        cvData.competences = cvData.competences || { techniques: [], comportementales: [], outils: [] };
        const ex = new Set((cvData.competences.techniques || []).map(c => c.toLowerCase()));
        comp.tech.forEach(c => { if (!ex.has(c.toLowerCase())) cvData.competences.techniques.push(c); });
      }
      if (comp.soft.length) {
        cvData.competences = cvData.competences || { techniques: [], comportementales: [], outils: [] };
        const ex = new Set((cvData.competences.comportementales || []).map(c => c.toLowerCase()));
        comp.soft.forEach(c => { if (!ex.has(c.toLowerCase())) cvData.competences.comportementales.push(c); });
      }

      setGenStage(2); setGenProgress(85); setGenProgressText('Mise en page du CV…');
      const generatedHTML = renderCVFromData(cvData, PALETTES[0]);
      const name = [(cvData.prenom || ''), (cvData.nom || '')].filter(Boolean).join(' ') || 'Candidat';

      saveHistory(name, generatedHTML, cvData, formation.l, selectedProfile
        ? { profileId: String(selectedProfile.id), profileName: selectedProfile.nom }
        : {});
      // Push CRM via token si lié (mode standalone, pas iframe)
      if (!embedded) crmTokenPush({ name, cvData, html: generatedHTML });

      const editorState = {
        generatedHTML, cvData,
        palette: PALETTES[0],
        croppedPhoto: '',
        logoDataURL: '',
        name,
      };
      saveEditorState(editorState);

      setGenStage(3); setGenProgress(100); setGenProgressText('CV généré !');
      showToast(name + ' — CV généré', 'success');

      setTimeout(() => {
        setGenerating(false);
        setGenProgress(0);
        setGenStage(0);
        navigate('/editor');
      }, 900);

    } catch (e) {
      setGenError('Erreur : ' + e.message);
      showToast('Erreur : ' + e.message, 'error');
      setGenerating(false);
      setGenProgress(0);
      console.error(e);
    }
  };

  // ─── Recap values for sidebar ─────────────────────────────────────────────
  const recapRows = [
    { label: 'Formation', value: formation?.l || '—' },
    { label: 'Rentrée',   value: dateVal || '—' },
    { label: 'Poste',     value: posteVal || '—' },
    { label: 'Genre',     value: genre === 'F' ? 'Féminin' : genre === 'M' ? 'Masculin' : '—' },
    { label: 'Source',    value: uploadedFile ? uploadedFile.name : cvText.trim().length > 5 ? 'Saisie manuelle' : '—' },
    { label: 'Annonce',   value: annonceBadgeActive ? 'Ajoutée' : '—' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: 'Manrope, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Manrope', sans-serif; }
        input, textarea, select, button { font-family: 'Manrope', sans-serif; }
        select:focus, textarea:focus, input:focus { border-color: ${C.bluePrimary} !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes progressPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes stepPulse { 0%,100% { box-shadow: 0 0 0 0 ${C.bluePrimary}00; } 50% { box-shadow: 0 0 0 4px ${C.bluePrimary}18; } }
        @keyframes checkPop { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-6px); opacity: 1; } }
        .gen-stage-dot { animation: dotBounce 1.4s infinite ease-in-out; }
        .gen-stage-dot:nth-child(2) { animation-delay: .15s; }
        .gen-stage-dot:nth-child(3) { animation-delay: .3s; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.rule}; border-radius: 3px; }
      `}</style>

      {/* ── TOPBAR ─────────────────────────────────────────────────────── */}
      <div style={{
        height: 79, background: C.bg,
        borderBottom: '1px solid ' + C.rule,
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, background: C.ink, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.ink, letterSpacing: '-0.3px' }}>TaliaCV</span>
        </div>

        {/* Breadcrumb center */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, color: C.mute, fontFamily: 'Manrope, sans-serif',
              fontWeight: 500, padding: '4px 6px', borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.ink}
            onMouseLeave={e => e.currentTarget.style.color = C.mute}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Mes CV
          </button>
          <span style={{ color: C.rule, fontSize: 14 }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Nouveau CV</span>
          {embedded && crmCandidate && (
            <>
              <span style={{ color: C.rule, fontSize: 14 }}>|</span>
              <span style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 12px', background:'linear-gradient(135deg, #ecfdf5, #d1fae5)', border:'1px solid #6ee7b7', borderRadius:99, fontSize:12, fontWeight:700, color:'#065f46' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
                CRM · {crmCandidate.prenom || ''} {crmCandidate.nom || ''}
              </span>
            </>
          )}
          <span style={{ color: C.rule, fontSize: 14 }}>|</span>
          <button
            onClick={() => navigate('/bulk')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f5f3ff', border: '1px solid #7c3aed33', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#f5f3ff'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            En masse
          </button>
        </div>

      </div>

      {/* ── PAGE BODY ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── MAIN LEFT ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Hero */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: 52, fontWeight: 700, color: C.ink,
              letterSpacing: '-1.6px', lineHeight: 1.05, marginBottom: 10,
            }}>
              Nouveau CV
            </h1>
            <p style={{ fontSize: 15, color: C.ink2, fontWeight: 400, lineHeight: 1.6, marginBottom: 16 }}>
              Génère un CV Talia professionnel en 3 étapes — formation, contenu, génération.
            </p>

            {/* Promesse Talia — inline sous le sous-titre */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: C.blueSoft, border: '1px solid ' + C.bluePrimary + '33',
              borderRadius: 12, padding: '10px 16px',
            }}>
              <div style={{
                width: 28, height: 28, background: C.bluePrimary,
                borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <p style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: C.bluePrimary }}>Promesse Talia —</strong>{' '}
                Le CV est personnalisé au parcours réel du candidat. L'IA ne <strong>jamais invente</strong> d'expériences — elle restructure uniquement les informations fournies.
              </p>
            </div>
          </div>

          {/* ── Sélecteur de profil IA ─────────────────────────────────── */}
          <ProfilePicker
            profiles={profiles}
            selectedId={selectedProfileId}
            onChange={setSelectedProfileId}
            onCreateNew={() => navigate('/profils/nouveau')}
          />

          {/* Stepper */}
          <Stepper
            steps={[
              { label:'Formation', hint:'Programme & poste visé' },
              { label:'Contenu',   hint:'CV du candidat' },
              { label:'Génération', hint:'L\'IA prend le relais' },
            ]}
            activeIndex={stepperActive}
            onStepClick={(i) => {
              const targets = [card1Ref, card2Ref, card3Ref];
              targets[i]?.current?.scrollIntoView({ behavior:'smooth', block:'start' });
            }}
          />

          {/* ── CARD 1 : Formation & objectif ─────────────────────────── */}
          <SectionCard ref={card1Ref} active={stepperActive === 0} complete={hasFormation && stepperActive > 0}>
            <CardHeader label="Formation & objectif" status={hasFormation ? 'pending' : 'active'} />

            {/* Ligne principale : 4 champs compacts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <FieldLabel>Formation souhaitée</FieldLabel>
                <select value={formationVal} onChange={e => onFormationChange(e.target.value)} style={selectStyle}>
                  <option value="">Choisir une formation</option>
                  {(() => {
                    const groups = {};
                    FORMATIONS.forEach(f => { if (!groups[f.f]) groups[f.f] = []; groups[f.f].push(f); });
                    return Object.entries(groups).map(([g, items]) => (
                      <optgroup key={g} label={g}>
                        {items.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <FieldLabel>Date de rentrée</FieldLabel>
                <select value={dateVal} onChange={e => setDateVal(e.target.value)} disabled={!dates.length} style={{ ...selectStyle, opacity: dates.length ? 1 : 0.5 }}>
                  <option value="">Choisir</option>
                  {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Poste visé</FieldLabel>
                <select value={posteVal} onChange={e => setPosteVal(e.target.value)} disabled={!postes.length} style={{ ...selectStyle, opacity: postes.length ? 1 : 0.5 }}>
                  <option value="">Choisir</option>
                  {postes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Genre — compact pills alignées en bas */}
              <div style={{ paddingBottom: 1 }}>
                <FieldLabel>Genre</FieldLabel>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { val: 'F', label: '♀', title: 'Féminin',  activeColor: '#C2185B', activeBg: '#FDE7F0', activeBorder: '#E91E8C' },
                    { val: 'M', label: '♂', title: 'Masculin', activeColor: C.bluePrimary, activeBg: C.blueSoft, activeBorder: C.bluePrimary },
                  ].map(({ val, label, title, activeColor, activeBg, activeBorder }) => {
                    const on = genre === val;
                    return (
                      <button
                        key={val} title={title}
                        onClick={() => setGenre(g => g === val ? '' : val)}
                        style={{
                          width: 38, height: 38, borderRadius: 10,
                          border: '1px solid ' + (on ? activeBorder : C.rule),
                          background: on ? activeBg : C.bg,
                          color: on ? activeColor : C.mute,
                          fontSize: 16, fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                          transition: 'all 0.15s', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >{label}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Badge formation sélectionnée */}
            {formation && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: C.blueSoft, border: '1px solid ' + C.bluePrimary + '33',
                  borderRadius: 99, padding: '4px 12px',
                  fontSize: 11, fontWeight: 600, color: C.bluePrimary,
                }}>
                  ✓ {formation.l} · {formation.d} · 1j cours / 4j entreprise
                </div>
                {genre && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: genre === 'F' ? '#FDE7F0' : C.blueSoft,
                    border: '1px solid ' + (genre === 'F' ? '#E91E8C33' : C.bluePrimary + '33'),
                    borderRadius: 99, padding: '4px 10px',
                    fontSize: 11, fontWeight: 600,
                    color: genre === 'F' ? '#C2185B' : C.bluePrimary,
                  }}>
                    {genre === 'F' ? '♀ Féminin' : '♂ Masculin'}
                  </div>
                )}
              </div>
            )}

            {/* Compétences (shown when formation selected) */}
            {formationVal && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + C.rule }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  Compétences à mettre en avant <span style={{ fontWeight: 400, color: C.mute }}>(optionnel)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { title: 'Techniques', tags: techTags, selected: selectedTech, setSelected: setSelectedTech },
                    { title: 'Comportementales', tags: softTags, selected: selectedSoft, setSelected: setSelectedSoft },
                  ].map(({ title, tags, selected, setSelected }) => (
                    <div key={title}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>{title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {tags.map(tag => {
                          const on = selected.includes(tag);
                          return (
                            <span key={tag} onClick={() => toggleTag(selected, setSelected, tag)} style={{
                              display: 'inline-flex', alignItems: 'center',
                              padding: '3px 10px', borderRadius: 99,
                              border: '1px solid ' + (on ? C.bluePrimary : C.rule),
                              background: on ? C.bluePrimary : C.bg,
                              color: on ? '#fff' : C.ink2,
                              fontSize: 11.5, fontWeight: 500,
                              cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                              transition: 'all 0.15s',
                            }}>{tag}</span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── CARD 2 : Votre CV ─────────────────────────────────────── */}
          <SectionCard ref={card2Ref} active={hasFormation && !hasCV} complete={hasFormation && hasCV}>
            <CardHeader label="Votre CV" status={!hasFormation ? 'locked' : hasCV ? 'pending' : 'active'} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              {/* Upload zone */}
              <div>
                <FieldLabel>Glisser un CV (PDF ou image)</FieldLabel>
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.bluePrimary; e.currentTarget.style.background = C.blueSoft; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = uploadedFile ? '#22c55e55' : C.rule; e.currentTarget.style.background = uploadedFile ? '#f0fdf4' : C.surface; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.background = C.surface; const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                  onClick={() => !uploadedFile && fileInputRef.current?.click()}
                  style={{
                    border: '1px dashed ' + (uploadedFile ? '#22c55e55' : C.rule),
                    borderRadius: 12, padding: '18px 16px',
                    textAlign: 'center', cursor: uploadedFile ? 'default' : 'pointer',
                    background: uploadedFile ? '#f0fdf4' : C.surface,
                    transition: 'all 0.2s', minHeight: 108,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {uploadLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink2, fontSize: 13 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid ' + C.rule, borderTopColor: C.bluePrimary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Lecture en cours…
                    </div>
                  )}
                  {!uploadLoading && !uploadedFile && (
                    <div>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 8px', display: 'block' }}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <polyline points="9 15 12 12 15 15"/>
                      </svg>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 3 }}>Glisser un CV ici</div>
                      <div style={{ fontSize: 11, color: C.mute }}>PDF · JPG · PNG</div>
                    </div>
                  )}
                  {!uploadLoading && uploadedFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left' }}>
                      {uploadedFile.type === 'image'
                        ? <img src={'data:' + uploadedFile.mediaType + ';base64,' + uploadedFile.base64} style={{ width: 36, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid ' + C.rule, flexShrink: 0 }} alt="prev" />
                        : <div style={{ width: 36, height: 44, background: '#fee2e2', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                          <div style={{ width: 16, height: 16, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: C.mute }}>{uploadedFile.type === 'image' ? 'Image' : 'PDF'} · Prêt</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setUploadedFile(null); }} style={{ flexShrink: 0, background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, fontSize: 11, padding: '3px 9px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>Retirer</button>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) processFile(f); e.target.value = ''; }} />
              </div>

              {/* Texte libre */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 1, background: C.rule }} />
                  <span style={{ fontSize: 11, color: C.mute, whiteSpace: 'nowrap', fontWeight: 500 }}>ou coller le texte</span>
                  <div style={{ flex: 1, height: 1, background: C.rule }} />
                </div>
                <textarea
                  value={cvText}
                  onChange={e => setCvText(e.target.value)}
                  placeholder="Copiez-collez le contenu du CV : nom, coordonnées, expériences, formations, compétences…"
                  rows={5}
                  style={{ ...textareaStyle, flex: 1, minHeight: 108 }}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── ACCORDÉON : Adapter à une annonce ─────────────────────── */}
          <AnnonceAccordion
            active={annonceBadgeActive}
            text={annonceText}
            keywords={annonceKeywords}
            onChange={handleAnnonceInput}
          />

          {/* ── BOUTON GÉNÉRER ────────────────────────────────────────── */}
          <div ref={card3Ref} style={{ marginBottom: 16 }}>
            <button
              onClick={generate}
              disabled={generating || !canGenerate}
              style={{
                width: '100%', padding: '16px 24px',
                background: canGenerate && !generating
                  ? 'linear-gradient(135deg, ' + C.ink + ' 0%, #1a1a40 100%)'
                  : C.mute,
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px',
                cursor: generating || !canGenerate ? 'not-allowed' : 'pointer',
                fontFamily: 'Manrope, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: !canGenerate && !generating ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: canGenerate && !generating
                  ? '0 8px 28px rgba(11,16,32,0.28), 0 1px 2px rgba(0,0,0,0.1)'
                  : 'none',
              }}
              onMouseEnter={e => { if (canGenerate && !generating) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.opacity = canGenerate ? '1' : '0.5'; e.currentTarget.style.transform = 'none'; }}
            >
              {generating
                ? <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              }
              {generating
                ? (genProgressText || 'Génération en cours…')
                : apiKey.trim() ? 'Générer mon CV Talia' : 'Tester sans clé (données fictives)'}
            </button>

            {/* Progress bar */}
            {genProgress > 0 && generating && (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 4, background: C.rule, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, ' + C.bluePrimary + ', ' + C.blueHover + ')', width: genProgress + '%', transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: C.mute, marginTop: 4, textAlign: 'center' }}>{genProgressText}</div>
              </div>
            )}

            {/* Missing info */}
            {!canGenerate && !generating && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.mute, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.star} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Il manque : {[!hasFormation && 'une formation', !hasCV && 'le CV du candidat'].filter(Boolean).join(' et ')}
              </div>
            )}

            {/* Error */}
            {genError && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 12, color: '#dc2626' }}>{genError}</div>
            )}

            {/* Keyboard shortcut */}
            <div style={{ marginTop: 10, fontSize: 11, color: C.mute, textAlign: 'center' }}>
              <span style={{ display: 'inline-block', background: C.surface, border: '1px solid ' + C.rule, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontFamily: 'monospace' }}>Ctrl</span>
              &nbsp;+&nbsp;
              <span style={{ display: 'inline-block', background: C.surface, border: '1px solid ' + C.rule, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontFamily: 'monospace' }}>Enter</span>
              &nbsp;pour générer directement
            </div>
          </div>
        </div>

        {/* ── SIDEBAR RIGHT ─────────────────────────────────────────────── */}
        <div style={{ width: 340, flexShrink: 0, position: 'sticky', top: 99, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Recap card */}
          <div style={{ background: C.bg, border: '1px solid ' + C.rule, borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Récapitulatif</div>

            {/* Recap rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recapRows.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.mute, minWidth: 70, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 1 }}>{label}</span>
                  <span style={{
                    fontSize: 12, fontWeight: value === '—' ? 400 : 600,
                    color: value === '—' ? C.mute : C.ink,
                    flex: 1, lineHeight: 1.5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={value}>{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <Toast toasts={toasts} remove={removeToast} />

      {/* Overlay de génération animé */}
      <GenerationOverlay
        visible={generating || !!genError}
        progress={genProgress}
        progressText={genProgressText}
        stage={genStage}
        error={genError}
        onClose={() => { setGenError(''); setGenerating(false); setGenProgress(0); setGenStage(0); }}
      />
    </div>
  );
}
