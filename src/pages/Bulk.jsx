import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FORMATIONS, DATES, POSTES, COMP_TECH, COMP_SOFT, PALETTES,
  adaptPoste, renderCVFromData, saveEditorState,
  saveBulkSession, loadBulkSession,
} from '@/lib/cvData';
import { saveHistory } from '@/lib/historySync';
import { useSettings } from '@/hooks/useSettings.jsx';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  bluePrimary:'#1539B7', blueHover:'#1F4FE0', blueSoft:'#EEF2FF',
  ink:'#0B1020', ink2:'#3A4156', mute:'#9AA0AE', rule:'#ECEDF1',
  bg:'#FFFFFF', surface:'#F7F8FA', star:'#F5B400',
  green:'#22c55e', greenSoft:'#f0fdf4', greenBorder:'#6ee7b7',
  red:'#dc2626', redSoft:'#fff1f2', redBorder:'#fca5a5',
  orange:'#f59e0b', orangeSoft:'#fffbeb', orangeBorder:'#fde68a',
};

const GROUP_COLORS = [
  { accent:'#1539B7', soft:'#EEF2FF', border:'#1539B733' },
  { accent:'#7c3aed', soft:'#f5f3ff', border:'#7c3aed33' },
  { accent:'#059669', soft:'#ecfdf5', border:'#05966933' },
  { accent:'#d97706', soft:'#fffbeb', border:'#d9770633' },
  { accent:'#db2777', soft:'#fdf2f8', border:'#db277733' },
  { accent:'#0891b2', soft:'#ecfeff', border:'#0891b233' },
];

let _uid = 0;
const uid = () => `${Date.now()}-${++_uid}`;

// ─── Toast ───────────────────────────────────────────────────────────────────
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
function Toast({ toasts, remove }) {
  const colors = { success:{border:C.greenBorder,bg:C.greenSoft}, error:{border:C.redBorder,bg:C.redSoft}, info:{border:C.rule,bg:'#f0f4ff'} };
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => {
        const col = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, background:col.bg, border:'1px solid '+col.border, borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,.10)', maxWidth:360, fontFamily:'Manrope,sans-serif' }}>
            <span style={{ flex:1, fontSize:13, color:C.ink }}>{t.msg}</span>
            <button onClick={() => remove(t.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:C.mute }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── API ─────────────────────────────────────────────────────────────────────
const ANTHROPIC_URL = import.meta.env.DEV ? '/api/anthropic/v1/messages' : 'https://api.anthropic.com/v1/messages';
async function callAPI(body, apiKey) {
  const headers = { 'Content-Type':'application/json', 'anthropic-version':'2023-06-01' };
  if (!import.meta.env.DEV) headers['anthropic-dangerous-direct-browser-access'] = 'true';
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(ANTHROPIC_URL, { method:'POST', headers, body:JSON.stringify(body) });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message || 'Erreur API (HTTP '+res.status+')'); }
  return res.json();
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
function buildMock({ formation, formationVal, poste, genre, dateVal }, fileName) {
  const techPool = (COMP_TECH[formationVal]||[]).slice(0,6);
  const softPool = (COMP_SOFT[formationVal]||[]).slice(0,5);
  const firstName = fileName.split(/[\s_\-.]/)[0] || 'Prénom';
  return {
    prenom:firstName, nom:'NOM (démo)', telephone:'06 00 00 00 00',
    email:'prenom.nom@email.fr', adresse:'Ville (00)', dateNaissance:'',
    poste:(poste||POSTES[formationVal]?.[0]||'POSTE VISÉ').toUpperCase(),
    accroche:`Actuellement en recherche d'alternance dans le cadre de la formation ${formation?.l||''} au sein de l'école Talia, je suis motivé(e) à mettre mes compétences au service d'une entreprise dynamique.`,
    experiences:[{ poste:'Exemple de poste', entreprise:'Entreprise exemple', lieu:'Ville', periode:'Jan. 2024 – Août 2024', missions:['Mission principale','Participation aux tâches de l\'équipe','Gestion des dossiers'] }],
    formations:[
      { titre:formation?.l||'Formation Talia', etablissement:'Talia · France', periode:(dateVal||'Sept. 2024')+' — '+(formation?.d||'16 mois'), isTalia:true },
      { titre:'Baccalauréat Général', etablissement:'Lycée Exemple · Ville', periode:'2023', isTalia:false },
    ],
    competences:{ techniques:[...techPool], comportementales:[...softPool], outils:['Pack Office','Google Workspace'] },
    langues:[{ langue:'Français', niveau:'Natif' },{ langue:'Anglais', niveau:'B1' }],
    centresInteret:['Sport','Voyages','Culture générale'],
    lettreMotivation:'',
  };
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    pending:    { label:'En attente',  bg:C.surface,  color:C.mute,        border:C.rule },
    processing: { label:'En cours…',   bg:C.blueSoft, color:C.bluePrimary, border:C.bluePrimary+'55' },
    done:       { label:'Généré ✓',    bg:C.greenSoft,color:C.green,       border:C.greenBorder },
    error:      { label:'Erreur',      bg:C.redSoft,  color:C.red,         border:C.redBorder },
  };
  const s = cfg[status]||cfg.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:s.bg, color:s.color, border:'1px solid '+s.border, fontFamily:'Manrope,sans-serif', flexShrink:0 }}>
      {status==='processing' && <span style={{ width:8, height:8, border:'1.5px solid '+C.bluePrimary+'44', borderTopColor:C.bluePrimary, borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />}
      {s.label}
    </span>
  );
}

// ─── FileIcon ─────────────────────────────────────────────────────────────────
function FileIcon({ type }) {
  return type === 'image'
    ? <div style={{ width:34,height:40,borderRadius:6,background:'#e0f2fe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </div>
    : <div style={{ width:34,height:40,borderRadius:6,background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>;
}

// ─── SelectField ─────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, disabled, children }) {
  return (
    <div style={{ flex:1 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.mute, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{
        width:'100%', padding:'8px 28px 8px 10px', border:'1px solid '+C.rule, borderRadius:8,
        fontSize:12, color:disabled?C.mute:C.ink, background:C.bg, fontFamily:'Manrope,sans-serif',
        outline:'none', appearance:'none', opacity:disabled?.5:1,
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239AA0AE' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', cursor:disabled?'default':'pointer',
      }}>
        {children}
      </select>
    </div>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────
function ReviewCard({ job, colorSet, onOpen, onRegenre, onRetry }) {
  const [hovered, setHovered] = useState(false);
  const wasOpened = !!job.histId;

  if (job.status === 'error') {
    return (
      <div style={{ padding:'14px 16px', background:C.redSoft, border:'1px solid '+C.redBorder, borderRadius:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:C.redBorder, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>⚠</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.name}</div>
            <div style={{ fontSize:10, color:C.red, marginTop:1 }}>{job.error}</div>
          </div>
        </div>
        <button onClick={onRetry} style={{ width:'100%', padding:'7px', background:C.redSoft, color:C.red, border:'1px solid '+C.redBorder, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
          ↺ Réessayer ce CV
        </button>
      </div>
    );
  }

  const initials = (job.candidateName||job.name||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:'14px 16px', borderRadius:12, transition:'all .2s',
        background: wasOpened ? C.greenSoft : C.bg,
        border:'1.5px solid '+(wasOpened ? C.greenBorder : hovered ? colorSet.accent+'88' : C.rule),
        boxShadow: hovered && !wasOpened ? '0 4px 16px rgba(0,0,0,.07)' : 'none',
      }}
    >
      {/* Avatar + nom */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:wasOpened ? C.green : colorSet.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0, letterSpacing:'-0.5px' }}>
          {wasOpened ? '✓' : initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {job.candidateName || job.name}
          </div>
          <div style={{ fontSize:10, color:wasOpened?C.green:C.mute, fontWeight:wasOpened?700:400, marginTop:1 }}>
            {wasOpened ? '✓ Déjà ouvert dans l\'éditeur' : `Genre : ${job.genre==='F'?'Féminin':job.genre==='M'?'Masculin':'Non précisé'}`}
          </div>
        </div>

        {/* Genre toggle */}
        <div style={{ display:'flex', gap:4, flexShrink:0 }} title="Changer le genre">
          {[{ val:'F', label:'♀' },{ val:'M', label:'♂' }].map(({ val, label }) => {
            const active = job.genre===val;
            return (
              <button key={val} onClick={() => !active && onRegenre(val)}
                style={{ width:28, height:28, borderRadius:7, border:'1px solid '+(active?colorSet.accent:C.rule), background:active?colorSet.soft:C.bg, color:active?colorSet.accent:C.mute, fontSize:13, cursor:active?'default':'pointer', transition:'all .15s', fontFamily:'Manrope,sans-serif' }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action unique */}
      <button onClick={onOpen}
        style={{ width:'100%', padding:'8px', background:wasOpened ? C.surface : colorSet.accent, color:wasOpened ? C.ink2 : '#fff', border:wasOpened ? '1px solid '+C.rule : 'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
        {wasOpened ? 'Rouvrir l\'éditeur' : 'Ouvrir dans l\'éditeur'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  );
}

// ─── GroupCard (build mode) ───────────────────────────────────────────────────
function GroupCard({ group, colorSet, isRunning, onUpdate, onRemove, onAddFiles, onRemoveJob, onUpdateJob }) {
  const fileInputRef = useRef(null);
  const formation    = FORMATIONS.find(f => f.v === group.formationVal);
  const dates        = formation ? (DATES[formation.n]||[]) : [];
  const [editingName, setEditingName] = useState(false);
  const [nameDraft,   setNameDraft]   = useState(group.label);

  const pendingCount = group.jobs.filter(j => j.status==='pending').length;
  const doneCount    = group.jobs.filter(j => j.status==='done').length;
  const errorCount   = group.jobs.filter(j => j.status==='error').length;
  const procCount    = group.jobs.filter(j => j.status==='processing').length;
  const totalCount   = group.jobs.length;

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = C.rule;
    e.currentTarget.style.background  = C.surface;
    onAddFiles(group.uid, e.dataTransfer.files);
  };

  return (
    <div style={{ background:C.bg, border:'1.5px solid '+(group.collapsed ? C.rule : colorSet.border), borderRadius:18, overflow:'hidden', transition:'border-color .2s', marginBottom:14 }}>

      {/* Header */}
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, background:group.collapsed ? C.bg : colorSet.soft, borderBottom: group.collapsed ? 'none' : '1px solid '+colorSet.border, transition:'background .2s' }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:colorSet.accent, flexShrink:0 }} />

        {editingName
          ? <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
              onBlur={() => { setEditingName(false); onUpdate(group.uid, { label: nameDraft||group.label }); }}
              onKeyDown={e => { if (e.key==='Enter'||e.key==='Escape') { setEditingName(false); onUpdate(group.uid, { label: nameDraft||group.label }); } }}
              style={{ flex:1, fontSize:14, fontWeight:700, color:C.ink, border:'1px solid '+colorSet.accent, borderRadius:6, padding:'2px 8px', fontFamily:'Manrope,sans-serif', outline:'none', background:'transparent' }}
            />
          : <div onClick={() => { setEditingName(true); setNameDraft(group.label); }} title="Cliquer pour renommer"
              style={{ flex:1, fontSize:14, fontWeight:700, color:C.ink, cursor:'text', display:'flex', alignItems:'center', gap:6 }}>
              {group.label}
              {formation && <span style={{ fontSize:11, fontWeight:500, color:colorSet.accent, background:colorSet.soft, border:'1px solid '+colorSet.border, borderRadius:99, padding:'1px 8px' }}>{formation.l}</span>}
            </div>
        }

        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {totalCount > 0 && (
            <>
              <span style={{ fontSize:11, fontWeight:600, color:C.mute }}>{totalCount} CV</span>
              {doneCount > 0    && <span style={{ fontSize:11, fontWeight:700, color:C.green }}>✓ {doneCount}</span>}
              {errorCount > 0   && <span style={{ fontSize:11, fontWeight:700, color:C.red }}>✕ {errorCount}</span>}
              {procCount > 0    && <span style={{ fontSize:11, fontWeight:700, color:C.bluePrimary }}>⟳ {procCount}</span>}
            </>
          )}
        </div>

        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <button onClick={() => onUpdate(group.uid, { collapsed:!group.collapsed })}
            style={{ width:28, height:28, border:'1px solid '+C.rule, background:C.bg, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mute }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d={group.collapsed ? 'M2 4L6 8L10 4' : 'M2 8L6 4L10 8'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button onClick={() => onRemove(group.uid)} disabled={isRunning}
            style={{ width:28, height:28, border:'1px solid '+C.rule, background:C.bg, borderRadius:7, cursor:isRunning?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mute, opacity:isRunning?.4:1 }}
            onMouseEnter={e => { if(!isRunning) e.currentTarget.style.color=C.red; }} onMouseLeave={e => e.currentTarget.style.color=C.mute}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {!group.collapsed && (
        <div style={{ padding:18 }}>
          {/* Settings */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <SelectField label="Formation Talia *" value={group.formationVal} onChange={v => onUpdate(group.uid, { formationVal:v, dateVal:'' })}>
              <option value="">Choisir une formation</option>
              {(() => {
                const grps = {};
                FORMATIONS.forEach(f => { if (!grps[f.f]) grps[f.f]=[]; grps[f.f].push(f); });
                return Object.entries(grps).map(([g, items]) => (
                  <optgroup key={g} label={g}>{items.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}</optgroup>
                ));
              })()}
            </SelectField>
            <SelectField label="Date de rentrée" value={group.dateVal} onChange={v => onUpdate(group.uid, { dateVal:v })} disabled={!dates.length}>
              <option value="">Choisir</option>
              {dates.map(d => <option key={d} value={d}>{d}</option>)}
            </SelectField>
            <div style={{ flex:'0 0 auto' }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.mute, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Genre par défaut</div>
              <div style={{ display:'flex', gap:6 }}>
                {[{ val:'F', label:'♀ F' },{ val:'M', label:'♂ M' }].map(({ val, label }) => {
                  const on = group.genre===val;
                  return <button key={val} onClick={() => onUpdate(group.uid, { genre: group.genre===val?'':val })}
                    style={{ padding:'6px 12px', borderRadius:8, border:'1px solid '+(on?colorSet.accent:C.rule), background:on?colorSet.soft:C.bg, color:on?colorSet.accent:C.mute, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif', transition:'all .15s' }}>{label}</button>;
                })}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor=colorSet.accent; e.currentTarget.style.background=colorSet.soft; }}
              onDragLeave={e => { e.currentTarget.style.borderColor=C.rule; e.currentTarget.style.background=C.surface; }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ width:120, flexShrink:0, border:'1.5px dashed '+C.rule, borderRadius:12, padding:'18px 10px', textAlign:'center', cursor:'pointer', background:C.surface, transition:'all .2s', userSelect:'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.5" strokeLinecap="round" style={{ display:'block', margin:'0 auto 8px' }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ fontSize:11, fontWeight:600, color:C.ink2, marginBottom:2 }}>Déposer</div>
              <div style={{ fontSize:10, color:C.mute }}>PDF / image</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple style={{ display:'none' }} onChange={e => { onAddFiles(group.uid, e.target.files); e.target.value=''; }} />

            {/* Jobs list */}
            <div style={{ flex:1, minWidth:0 }}>
              {group.jobs.length === 0 && (
                <div style={{ padding:'20px 16px', textAlign:'center', color:C.mute, fontSize:12, border:'1px dashed '+C.rule, borderRadius:10 }}>
                  Dépose des CV ici (PDF ou image)
                </div>
              )}
              {group.jobs.map(job => (
                <div key={job.uid} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:job.status==='done'?C.greenSoft:job.status==='error'?C.redSoft:C.surface, border:'1px solid '+(job.status==='done'?C.greenBorder:job.status==='error'?C.redBorder:C.rule), borderRadius:10, marginBottom:6, transition:'all .2s' }}>
                  <FileIcon type={job.fileType} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.name}</div>
                    {job.status==='processing' && (
                      <div style={{ height:2, background:C.rule, borderRadius:99, marginTop:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:99, background:colorSet.accent, width:(job.progress||10)+'%', transition:'width .4s ease' }} />
                      </div>
                    )}
                    {job.status==='error'   && <div style={{ fontSize:10, color:C.red, marginTop:1 }}>⚠ {job.error}</div>}
                    {job.status==='done'    && <div style={{ fontSize:10, color:C.green, marginTop:1 }}>Prêt à réviser</div>}
                    {job.status==='pending' && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                        <span style={{ fontSize:10, color:C.mute }}>{job.fileType==='pdf'?'PDF':'Image'}</span>
                        {/* Genre individuel avant génération */}
                        <div style={{ display:'flex', gap:3 }} title="Genre pour ce candidat">
                          {[{ val:'F', label:'♀' },{ val:'M', label:'♂' }].map(({ val, label }) => {
                            const on = job.genre===val;
                            return (
                              <button key={val} onClick={() => onUpdateJob(group.uid, job.uid, { genre: job.genre===val?'':val })}
                                style={{ width:20, height:20, borderRadius:4, border:'1px solid '+(on?colorSet.accent:C.rule), background:on?colorSet.soft:C.bg, color:on?colorSet.accent:C.mute, fontSize:11, cursor:'pointer', transition:'all .1s', fontFamily:'Manrope,sans-serif', lineHeight:1, padding:0 }}>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <StatusBadge status={job.status} />

                  {(job.status==='pending'||job.status==='error') && (
                    <button onClick={() => onRemoveJob(group.uid, job.uid)}
                      style={{ width:24, height:24, border:'1px solid '+C.rule, background:'none', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mute, fontSize:13, flexShrink:0 }}
                      onMouseEnter={e => e.currentTarget.style.color=C.red} onMouseLeave={e => e.currentTarget.style.color=C.mute}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!group.formationVal && group.jobs.length > 0 && (
            <div style={{ marginTop:10, padding:'8px 12px', background:C.orangeSoft, border:'1px solid '+C.orangeBorder, borderRadius:8, fontSize:11, color:'#92400e' }}>
              ⚠ Sélectionne une formation pour pouvoir générer ce groupe.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Bulk() {
  const navigate = useNavigate();
  const { toasts, show: showToast, remove: removeToast } = useToast();

  const { apiKey } = useSettings();
  const [sessionMode, setSessionMode] = useState('build'); // 'build' | 'review'
  const [bulkId]                  = useState(() => 'bulk-' + Date.now());
  const [groups, setGroups]       = useState([{
    uid: uid(), label:'Groupe 1', formationVal:'', dateVal:'', genre:'',
    jobs:[], collapsed:false,
  }]);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef              = useRef(false);

  // ── Restaurer la session si on revient depuis l'éditeur ──
  useEffect(() => {
    const isReturning = sessionStorage.getItem('talia_bulk_returning');
    if (isReturning) {
      sessionStorage.removeItem('talia_bulk_returning');
      const session = loadBulkSession();
      if (session?.groups?.length) {
        setGroups(session.groups);
        setSessionMode('review');
      }
    }
  }, []);

  // ── Auto-sauvegarder la session en mode review ──
  useEffect(() => {
    if (sessionMode === 'review') saveBulkSession(groups);
  }, [groups, sessionMode]);


  // ── Group operations ──
  const addGroup = () => {
    setGroups(prev => [...prev, { uid:uid(), label:`Groupe ${prev.length+1}`, formationVal:'', dateVal:'', genre:'', jobs:[], collapsed:false }]);
  };
  const updateGroup = useCallback((gUid, patch) => {
    setGroups(prev => prev.map(g => g.uid===gUid ? { ...g, ...patch } : g));
  }, []);
  const removeGroup = useCallback((gUid) => {
    setGroups(prev => prev.filter(g => g.uid!==gUid));
  }, []);

  // ── Job operations ──
  const addFiles = useCallback(async (gUid, fileList) => {
    const accepted = Array.from(fileList).filter(f => f.type==='application/pdf' || f.type.startsWith('image/'));
    if (accepted.length===0) { showToast('Formats acceptés : PDF, JPG, PNG', 'error'); return; }
    const groupGenre = groups.find(g => g.uid===gUid)?.genre || '';
    const newJobs = await Promise.all(accepted.map(file => new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res({
        uid:uid(), file, base64:reader.result.split(',')[1],
        mediaType:file.type, fileType:file.type.startsWith('image/')?'image':'pdf',
        name:file.name.replace(/\.[^.]+$/, ''), status:'pending',
        genre:groupGenre,
        generatedHTML:null, candidateName:null, cvData:null,
        error:null, progress:0, histId:null, validated:false,
      });
      reader.readAsDataURL(file);
    })));
    setGroups(prev => prev.map(g => g.uid===gUid ? { ...g, jobs:[...g.jobs, ...newJobs] } : g));
    showToast(`${newJobs.length} fichier${newJobs.length>1?'s':''} ajouté${newJobs.length>1?'s':''}`, 'success');
  }, [groups, showToast]);

  const removeJob = useCallback((gUid, jUid) => {
    setGroups(prev => prev.map(g => g.uid===gUid ? { ...g, jobs:g.jobs.filter(j => j.uid!==jUid) } : g));
  }, []);

  const updateJob = useCallback((gUid, jUid, patch) => {
    setGroups(prev => prev.map(g => g.uid===gUid ? { ...g, jobs:g.jobs.map(j => j.uid===jUid ? { ...j, ...patch } : j) } : g));
  }, []);

  // ── Re-render genre (sans API, sans save) ──
  const regenreJob = useCallback((gUid, jUid, newGenre, currentCvData) => {
    if (!currentCvData) return;
    const cvData = JSON.parse(JSON.stringify(currentCvData));
    if (cvData.poste) cvData.poste = adaptPoste(cvData.poste, newGenre) || cvData.poste;
    const generatedHTML = renderCVFromData(cvData, PALETTES[0]);
    updateJob(gUid, jUid, { generatedHTML, cvData, genre: newGenre });
    showToast(`Genre mis à jour — ${newGenre==='F'?'Féminin':'Masculin'}`, 'success');
  }, [updateJob, showToast]);

  // ── Ouvrir un CV dans l'éditeur (sauvegarde auto en history + session) ──
  const openInEditor = useCallback(async (gUid, jUid) => {
    const group = groups.find(g => g.uid===gUid);
    const job   = group?.jobs.find(j => j.uid===jUid);
    if (!job || !job.generatedHTML) return;

    let histId = job.histId;
    let updatedGroups = groups;

    // Première ouverture : enregistrer dans l'historique
    if (!histId) {
      const formation = FORMATIONS.find(f => f.v===group.formationVal);
      histId = await saveHistory(job.candidateName||job.name, job.generatedHTML, job.cvData, formation?.l||'', { bulkId, bulkLabel: group.label });
      saveEditorState({ generatedHTML:job.generatedHTML, cvData:job.cvData, palette:PALETTES[0], croppedPhoto:'', logoDataURL:'', name:job.candidateName||job.name });
      updatedGroups = groups.map(g => g.uid===gUid ? {
        ...g, jobs:g.jobs.map(j => j.uid===jUid ? { ...j, histId } : j)
      } : g);
      setGroups(updatedGroups);
    }

    saveBulkSession(updatedGroups);
    sessionStorage.setItem('talia_bulk_returning', '1');
    navigate('/editor/'+histId);
  }, [groups, navigate, bulkId]);

  // ── Generate one job (core) ──
  const generateOne = useCallback(async (group, job) => {
    const formation = FORMATIONS.find(f => f.v===group.formationVal);
    const jobGenre  = job.genre !== undefined ? job.genre : group.genre;
    const poste     = adaptPoste('', jobGenre);
    const contextInfo = `\n---\nFormation Talia : ${formation?.l||'Non précisée'} (${formation?.d||''})\nDate de rentrée : ${group.dateVal||'Non précisée'}\nPoste visé : ${poste||'Non précisé'}\nGenre : ${jobGenre==='F'?'Féminin':jobGenre==='M'?'Masculin':'Non précisé'}`;

    const extractPrompt = `Tu es un extracteur de données CV expert. Extrais TOUTES les informations et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.\n\nSTRUCTURE JSON EXACTE :\n{\n  "prenom":"string","nom":"string","telephone":"string ou vide","email":"string ou vide","adresse":"string ou vide","dateNaissance":"JJ/MM/AAAA ou vide","poste":"INTITULÉ EN MAJUSCULES","accroche":"4-6 lignes, 1ère personne, parcours réel, formation Talia, poste visé","experiences":[{"poste":"","entreprise":"","lieu":"","periode":"","missions":[]}],"formations":[{"titre":"","etablissement":"","periode":"","isTalia":false}],"competences":{"techniques":[],"comportementales":[],"outils":[]},"langues":[{"langue":"","niveau":""}],"centresInteret":[],"lettreMotivation":"Si AUCUNE expérience, 3 paragraphes séparés \\n\\n. Sinon vide."\n}\n\nRÈGLES : CONSERVER coordonnées EXACTES, TOUTES expériences/formations, 3-5 missions/expérience, Formation Talia EN PREMIER avec isTalia:true, poste adapté au genre. Répondre UNIQUEMENT avec le JSON.`;

    let userContent;
    if (job.fileType==='image') {
      userContent = [
        { type:'image', source:{ type:'base64', media_type:job.mediaType, data:job.base64 } },
        { type:'text', text:`Extrais toutes les données de ce CV en image.${contextInfo}` },
      ];
    } else {
      userContent = [
        { type:'document', source:{ type:'base64', media_type:'application/pdf', data:job.base64 } },
        { type:'text', text:`Extrais toutes les données de ce CV en PDF.${contextInfo}` },
      ];
    }

    // Mode démo
    if (!apiKey.trim()) {
      await new Promise(r => setTimeout(r, 500));
      updateJob(group.uid, job.uid, { progress:50 });
      await new Promise(r => setTimeout(r, 400));
      const cvData = buildMock({ formation, formationVal:group.formationVal, poste, genre:jobGenre, dateVal:group.dateVal }, job.name);
      const generatedHTML = renderCVFromData(cvData, PALETTES[0]);
      const candidateName = `${cvData.prenom} ${cvData.nom}`;
      return { generatedHTML, candidateName, cvData, genre: jobGenre };
    }

    // API réelle
    updateJob(group.uid, job.uid, { progress:20 });
    const data1 = await callAPI({ model:'claude-sonnet-4-20250514', max_tokens:4000, system:extractPrompt, messages:[{ role:'user', content:userContent }] }, apiKey);
    let jsonStr = data1.content.map(b => b.text||'').join('').trim().replace(/^```json?\s*/,'').replace(/```\s*$/,'').trim();
    let cvData;
    try { cvData = JSON.parse(jsonStr); }
    catch { const f=jsonStr.indexOf('{'),l=jsonStr.lastIndexOf('}'); if(f>=0&&l>f) cvData=JSON.parse(jsonStr.slice(f,l+1)); else throw new Error('JSON invalide'); }

    updateJob(group.uid, job.uid, { progress:75 });
    if (poste && !cvData.poste) cvData.poste = poste.toUpperCase();
    if (cvData.poste) cvData.poste = cvData.poste.toUpperCase();
    if (formation) {
      const hasTalia = cvData.formations?.some(f => f.isTalia);
      if (!hasTalia) { cvData.formations = cvData.formations||[]; cvData.formations.unshift({ titre:formation.l, etablissement:'Talia · France', periode:(group.dateVal||'Sept.')+' — '+formation.d, isTalia:true }); }
    }

    const generatedHTML = renderCVFromData(cvData, PALETTES[0]);
    const candidateName = [(cvData.prenom||''),(cvData.nom||'')].filter(Boolean).join(' ') || job.name;
    return { generatedHTML, candidateName, cvData, genre: jobGenre };
  }, [apiKey, updateJob]);

  // ── Générer un seul CV (retry en mode review — défini APRÈS generateOne) ──
  const generateSingle = useCallback(async (gUid, jUid) => {
    const group = groups.find(g => g.uid===gUid);
    const job   = group?.jobs.find(j => j.uid===jUid);
    if (!group || !job) return;
    updateJob(gUid, jUid, { status:'processing', progress:10, error:null });
    try {
      const result = await generateOne(group, job);
      updateJob(gUid, jUid, { status:'done', progress:100, ...result });
      showToast(`${result.candidateName} — CV généré ✓`, 'success');
    } catch (err) {
      updateJob(gUid, jUid, { status:'error', error:err.message, progress:0 });
      showToast(`Erreur — ${job.name} : ${err.message}`, 'error');
    }
  }, [groups, generateOne, updateJob, showToast]);

  // ── Run all ──
  const runAll = useCallback(async () => {
    const readyGroups = groups.filter(g => g.formationVal && g.jobs.some(j => j.status==='pending'||j.status==='error'));
    if (readyGroups.length===0) { showToast('Aucun groupe prêt à générer (formation requise)', 'error'); return; }

    setIsRunning(true);
    isRunningRef.current = true;
    let totalSuccess = 0, totalError = 0;

    for (const group of readyGroups) {
      if (!isRunningRef.current) break;
      const pending = group.jobs.filter(j => j.status==='pending'||j.status==='error');
      for (const job of pending) {
        if (!isRunningRef.current) break;
        updateJob(group.uid, job.uid, { status:'processing', progress:10 });
        try {
          const result = await generateOne(group, job);
          updateJob(group.uid, job.uid, { status:'done', progress:100, ...result });
          showToast(`${result.candidateName} — généré ✓`, 'success');
          totalSuccess++;
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          updateJob(group.uid, job.uid, { status:'error', error:err.message, progress:0 });
          showToast(`Erreur — ${job.name} : ${err.message}`, 'error');
          totalError++;
        }
      }
    }

    isRunningRef.current = false;
    setIsRunning(false);
    // Passer en mode review quoi qu'il arrive
    setSessionMode('review');
    if (totalSuccess > 0) showToast(`${totalSuccess} CV${totalSuccess>1?'s':''} prêts à réviser 🎉`, 'success', 5000);
  }, [groups, generateOne, updateJob, showToast]);

  const stopRun = () => { isRunningRef.current = false; setIsRunning(false); showToast('Arrêt après le CV en cours…', 'info'); };

  // ── Stats ──
  const allJobs      = groups.flatMap(g => g.jobs);
  const totalPending = allJobs.filter(j => j.status==='pending').length;
  const totalDone    = allJobs.filter(j => j.status==='done').length;
  const totalError   = allJobs.filter(j => j.status==='error').length;
  const totalProc    = allJobs.filter(j => j.status==='processing').length;
  const readyToGen   = groups.some(g => g.formationVal && g.jobs.some(j => j.status==='pending'||j.status==='error'));

  // ── Review mode — groupes avec des jobs done/error ──
  const reviewGroups = groups.filter(g => g.jobs.some(j => j.status==='done' || j.status==='error'));

  return (
    <div style={{ minHeight:'100vh', background:C.surface, fontFamily:'Manrope,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Manrope',sans-serif;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        select:focus{border-color:${C.bluePrimary}!important;outline:none;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-thumb{background:${C.rule};border-radius:3px;}
      `}</style>

      {/* ── TOPBAR ─────────────────────────────────────────────────────────── */}
      <div style={{ height:64, background:C.bg, borderBottom:'1px solid '+C.rule, display:'flex', alignItems:'center', padding:'0 28px', gap:16, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:34, height:34, background:C.ink, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity=".9"/></svg>
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:C.ink, letterSpacing:'-0.3px' }}>TaliaCV</span>
        </div>

        <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate('/')}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:13, color:C.mute, fontFamily:'Manrope,sans-serif', fontWeight:500, padding:'4px 6px', borderRadius:6, transition:'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color=C.ink} onMouseLeave={e => e.currentTarget.style.color=C.mute}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Mes CV
          </button>
          <span style={{ color:C.rule }}>|</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>Génération en masse</span>
          {sessionMode==='review' && (
            <>
              <span style={{ color:C.rule }}>|</span>
              <span style={{ fontSize:12, fontWeight:600, color:C.bluePrimary, background:C.blueSoft, padding:'3px 10px', borderRadius:99 }}>Révision</span>
            </>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {/* Stats globaux */}
          {allJobs.length > 0 && (
            <div style={{ display:'flex', gap:6 }}>
              {allJobs.filter(j=>j.histId).length > 0 && <span style={{ fontSize:11, fontWeight:700, color:C.green, background:C.greenSoft, border:'1px solid '+C.greenBorder, padding:'2px 10px', borderRadius:99 }}>✓ {allJobs.filter(j=>j.histId).length} ouvert{allJobs.filter(j=>j.histId).length>1?'s':''}</span>}
              {totalError>0  && <span style={{ fontSize:11, fontWeight:700, color:C.red, background:C.redSoft, border:'1px solid '+C.redBorder, padding:'2px 10px', borderRadius:99 }}>✕ {totalError}</span>}
              {totalProc>0   && <span style={{ fontSize:11, fontWeight:700, color:C.bluePrimary, background:C.blueSoft, padding:'2px 10px', borderRadius:99 }}>⟳ {totalProc}</span>}
            </div>
          )}
          {/* Statut clé API → ⚙️ Paramètres */}
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 12px', border:'1px solid '+C.rule, borderRadius:10, background:C.surface }}>
            <span style={{ fontSize:12, color: apiKey ? C.ink : C.mute }}>{apiKey ? 'Clé configurée' : 'Mode démo — ⚙️'}</span>
            {apiKey && <span style={{ width:7, height:7, borderRadius:'50%', background:C.green }} />}
          </div>
        </div>
      </div>

      {/* ══ BUILD MODE ══════════════════════════════════════════════════════ */}
      {sessionMode === 'build' && (
        <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 24px 140px' }}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:30, fontWeight:800, color:C.ink, letterSpacing:'-0.8px', marginBottom:6 }}>Génération en masse</h1>
            <p style={{ fontSize:13, color:C.mute }}>Organise tes CV par groupes — chaque groupe a sa propre formation, date et genre par défaut.</p>
          </div>

          {groups.map((group, idx) => (
            <GroupCard
              key={group.uid}
              group={group}
              colorSet={GROUP_COLORS[idx % GROUP_COLORS.length]}
              isRunning={isRunning}
              onUpdate={updateGroup}
              onRemove={removeGroup}
              onAddFiles={addFiles}
              onRemoveJob={removeJob}
              onUpdateJob={updateJob}
            />
          ))}

          <button onClick={addGroup} disabled={isRunning}
            style={{ width:'100%', padding:'13px 20px', background:'none', border:'1.5px dashed '+C.rule, borderRadius:14, fontSize:13, fontWeight:600, color:C.mute, cursor:isRunning?'not-allowed':'pointer', fontFamily:'Manrope,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' }}
            onMouseEnter={e => { if(!isRunning){ e.currentTarget.style.borderColor=C.ink; e.currentTarget.style.color=C.ink; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.rule; e.currentTarget.style.color=C.mute; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter un groupe
          </button>

          {/* Sticky bar — build mode */}
          {allJobs.length > 0 && (
            <div style={{ position:'fixed', bottom:0, left:0, right:0, background:C.bg, borderTop:'1px solid '+C.rule, padding:'14px 28px', display:'flex', gap:12, alignItems:'center', zIndex:200, boxShadow:'0 -4px 24px rgba(0,0,0,.07)' }}>
              <div style={{ flex:1, fontSize:12, color:C.mute }}>
                {totalPending+totalError > 0
                  ? <>{totalPending+totalError} CV en attente sur {allJobs.length} total</>
                  : <span style={{ color:C.green, fontWeight:600 }}>✓ Tous générés — passe en révision</span>
                }
              </div>

              {totalDone > 0 && !isRunning && (
                <button onClick={() => setSessionMode('review')}
                  style={{ padding:'12px 20px', background:C.surface, color:C.ink, border:'1px solid '+C.rule, borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
                  Voir les {totalDone} CV générés →
                </button>
              )}

              {!isRunning ? (
                <button onClick={runAll} disabled={!readyToGen}
                  style={{ padding:'12px 28px', background:readyToGen?C.ink:C.mute, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:readyToGen?'pointer':'not-allowed', fontFamily:'Manrope,sans-serif', display:'flex', alignItems:'center', gap:10, opacity:readyToGen?1:.5 }}
                  onMouseEnter={e => { if(readyToGen) e.currentTarget.style.background='#1a1a2e'; }}
                  onMouseLeave={e => { if(readyToGen) e.currentTarget.style.background=C.ink; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  Tout générer ({totalPending+totalError} CV)
                </button>
              ) : (
                <button onClick={stopRun}
                  style={{ padding:'12px 24px', background:'#ef4444', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                  Arrêter
                </button>
              )}

              {!apiKey && (
                <div style={{ fontSize:11, color:'#92400e', background:C.orangeSoft, border:'1px solid '+C.orangeBorder, padding:'6px 12px', borderRadius:8 }}>
                  Mode démo
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ REVIEW MODE ═════════════════════════════════════════════════════ */}
      {sessionMode === 'review' && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px 60px', animation:'fadeInUp .3s ease' }}>

          {/* Header review */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:28, flexWrap:'wrap' }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:800, color:C.ink, letterSpacing:'-0.7px', marginBottom:6 }}>
                🎉 {totalDone} CV {totalDone>1?'générés':'généré'}
              </h1>
              <p style={{ fontSize:13, color:C.mute, lineHeight:1.5 }}>
                Ouvre chaque CV dans l'éditeur pour le modifier et le finaliser.
                <br/>Tu peux revenir ici à tout moment pour passer au suivant.
              </p>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', flexShrink:0 }}>
              <button onClick={() => setSessionMode('build')}
                style={{ padding:'10px 16px', background:C.surface, color:C.ink2, border:'1px solid '+C.rule, borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Manrope,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ajouter d'autres CV
              </button>
            </div>
          </div>

          {/* Stat chips */}
          <div style={{ display:'flex', gap:10, marginBottom:28, flexWrap:'wrap' }}>
            {totalDone>0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:C.blueSoft, border:'1px solid '+C.bluePrimary+'33', borderRadius:99, fontSize:12, fontWeight:700, color:C.bluePrimary }}>
                {totalDone} CV prêt{totalDone>1?'s':''}
              </div>
            )}
            {allJobs.filter(j=>j.histId).length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:C.greenSoft, border:'1px solid '+C.greenBorder, borderRadius:99, fontSize:12, fontWeight:700, color:'#166534' }}>
                ✓ {allJobs.filter(j=>j.histId).length} ouvert{allJobs.filter(j=>j.histId).length>1?'s':''}
              </div>
            )}
            {totalError>0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:C.redSoft, border:'1px solid '+C.redBorder, borderRadius:99, fontSize:12, fontWeight:700, color:C.red }}>
                ✕ {totalError} erreur{totalError>1?'s':''}
              </div>
            )}
          </div>

          {/* Groupes */}
          {reviewGroups.map((group, idx) => {
            const colorSet  = GROUP_COLORS[idx % GROUP_COLORS.length];
            const formation = FORMATIONS.find(f => f.v===group.formationVal);
            const doneJobs  = group.jobs.filter(j => j.status==='done');
            const errorJobs = group.jobs.filter(j => j.status==='error');

            return (
              <div key={group.uid} style={{ marginBottom:32 }}>
                {/* Group label */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:10, borderBottom:'2px solid '+colorSet.border }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:colorSet.accent, flexShrink:0 }} />
                  <span style={{ fontSize:16, fontWeight:800, color:C.ink }}>{group.label}</span>
                  {formation && (
                    <span style={{ fontSize:11, fontWeight:600, color:colorSet.accent, background:colorSet.soft, border:'1px solid '+colorSet.border, borderRadius:99, padding:'2px 10px' }}>
                      {formation.l}
                    </span>
                  )}
                  <span style={{ fontSize:11, color:C.mute, marginLeft:'auto' }}>
                    {doneJobs.filter(j=>j.histId).length}/{doneJobs.length} ouverts
                    {errorJobs.length>0 && ` · ${errorJobs.length} erreur${errorJobs.length>1?'s':''}`}
                  </span>
                </div>

                {/* Grid de cartes */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
                  {[...doneJobs, ...errorJobs].map(job => (
                    <div key={job.uid} style={{ animation:'fadeInUp .2s ease' }}>
                      <ReviewCard
                        job={job}
                        colorSet={colorSet}
                        onOpen={() => openInEditor(group.uid, job.uid)}
                        onRegenre={(newGenre) => regenreJob(group.uid, job.uid, newGenre, job.cvData)}
                        onRetry={() => generateSingle(group.uid, job.uid)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Bannière finale — tous ouverts */}
          {totalDone > 0 && allJobs.filter(j=>j.histId).length === totalDone && (
            <div style={{ textAlign:'center', padding:'40px 32px', background:C.greenSoft, borderRadius:20, border:'1px solid '+C.greenBorder, animation:'fadeInUp .3s ease' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#166534', marginBottom:8, letterSpacing:'-0.5px' }}>
                Tous les CV ont été ouverts !
              </div>
              <div style={{ fontSize:13, color:'#4ade80', marginBottom:24 }}>
                Retrouve-les dans tes CV depuis l'accueil.
              </div>
              <button onClick={() => navigate('/')}
                style={{ padding:'12px 28px', background:'#166534', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
                Voir tous mes CV →
              </button>
            </div>
          )}
        </div>
      )}

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
