/**
 * CohortDashboard — Espace encadrant (`/encadrement`).
 *
 * Deux vues, mêmes données, scoppées comme la RLS :
 *   • Conseiller → la liste de SES élèves + leur progression.
 *   • Direction  → tous les élèves + réattribution à un autre conseiller.
 *
 * Actions encadrant : inviter des élèves (lien), relancer un décrocheur,
 * ouvrir la fiche élève (bilan détaillé). En démo : cohorte simulée + personas.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { C, FONT, alpha } from '@/lib/gameTheme';
import ModuleTopBar from '@/components/ModuleTopBar';
import { useNavigate } from 'react-router-dom';
import { useCohort } from '@/hooks/useCohort';
import { studentPillars, needsFollowup } from '@/lib/demoCohort';
import { rosterToCSV, downloadCSV } from '@/lib/cohortServer';

const scoreColor = (s) => (s >= 70 ? C.green : s >= 40 ? C.amber : C.red);
const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function CohortDashboard() {
  const navigate = useNavigate();
  const { loading, viewer, students, conseillers, orgName, reassign, isDemo, persona, switchPersona, makeInvite, nudge } = useCohort();
  const isAdmin = viewer?.role === 'admin';
  const nameOf = (id) => conseillers.find((c) => c.id === id)?.name || '—';

  const [fiche, setFiche] = useState(null);   // élève ouvert
  const [invite, setInvite] = useState(false); // modal invitation
  const [toast, setToast] = useState('');

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };
  const relancer = (s) => { nudge(s); flash(`Relance envoyée à ${s.name} 📨`); };
  const exportCSV = () => {
    const csv = rosterToCSV(students, nameOf);
    downloadCSV(`cohorte-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    flash('Export CSV téléchargé ⬇');
  };

  const stats = useMemo(() => {
    if (!students.length) return { n: 0, avg: 0, active: 0, risk: 0 };
    const hasEmp = students.every((s) => typeof s.employability === 'number');
    const avg = hasEmp
      ? Math.round(students.reduce((a, s) => a + s.employability, 0) / students.length)
      : Math.round(students.reduce((a, s) => a + (s.xp || 0), 0) / students.length);
    const active = students.filter((s) => /aujourd|hier/i.test(s.lastActive || '')).length;
    const risk = students.filter(needsFollowup).length;
    return { n: students.length, avg, active, risk, hasEmp };
  }, [students]);

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ModuleTopBar label="Encadrement" />

        <div style={S.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={S.eyebrow}>{orgName || 'Espace encadrant'}</span>
            <h1 style={S.h1}>{isAdmin ? 'Tous les élèves' : 'Mes élèves'}</h1>
          </div>
          <button style={S.ghostBtn} onClick={exportCSV} disabled={!students.length}>⬇ Export</button>
          <button style={S.inviteBtn} onClick={() => setInvite(true)}>➕ Inviter</button>
        </div>

        {/* Switch de persona (démo) */}
        {isDemo && (
          <div style={S.personaRow}>
            <span style={S.personaLabel}>Voir en tant que :</span>
            {[{ id: 'direction', label: 'Direction' }, ...conseillers.map((c) => ({ id: c.id, label: c.name }))].map((p) => (
              <button key={p.id} onClick={() => switchPersona(p.id)}
                style={{ ...S.personaBtn, ...(persona === p.id ? S.personaOn : {}) }}>{p.label}</button>
            ))}
          </div>
        )}

        {/* Résumé */}
        <div style={S.statRow}>
          <Stat value={stats.n} label="élèves" />
          <Stat value={stats.hasEmp ? `${stats.avg}%` : stats.avg} label={stats.hasEmp ? 'employabilité moy.' : 'XP moy.'} color={stats.hasEmp ? scoreColor(stats.avg) : C.blue} />
          <Stat value={stats.active} label="actifs récemment" color={C.green} />
          <Stat value={stats.risk} label="à relancer" color={stats.risk ? C.red : C.mute} />
        </div>

        {/* Liste */}
        {loading ? (
          <div style={S.empty}>Chargement…</div>
        ) : students.length === 0 ? (
          <div style={S.empty}>Aucun élève pour cette vue.</div>
        ) : (
          <div style={S.list}>
            {students.map((s) => {
              const risk = needsFollowup(s);
              return (
                <div key={s.id} style={{ ...S.row, ...(risk ? S.rowRisk : {}) }}>
                  <button style={S.avatar} onClick={() => setFiche(s)} title="Voir la fiche">{initials(s.name)}</button>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setFiche(s)}>
                    <div style={S.name}>{s.name}{risk && <span style={S.riskFlag}>⚠️ à relancer</span>}</div>
                    <div style={S.meta}>{s.email}</div>
                    {typeof s.employability === 'number' && (
                      <div style={S.barWrap}>
                        <div style={S.bar}><div style={{ ...S.barFill, width: `${s.employability}%`, background: scoreColor(s.employability) }} /></div>
                        <span style={{ ...S.barPct, color: scoreColor(s.employability) }}>{s.employability}%</span>
                      </div>
                    )}
                  </div>
                  <div style={S.side}>
                    <span style={S.xp}>⚡ {s.xp}</span>
                    <span style={S.streak}>🔥 {s.streak}</span>
                    <span style={S.last}>{s.lastActive}</span>
                  </div>
                  {risk && <button style={S.relanceBtn} onClick={() => relancer(s)}>Relancer</button>}
                  {isAdmin ? (
                    <select style={S.reassign} value={s.manager || ''} onChange={(e) => reassign(s.id, e.target.value)} title="Réattribuer">
                      {conseillers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : <span style={S.conseiller}>{nameOf(s.manager)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {fiche && <FicheModal student={fiche} conseiller={nameOf(fiche.manager)} onClose={() => setFiche(null)} onRelance={() => { relancer(fiche); }} />}
      {invite && <InviteModal viewer={viewer} conseillers={conseillers} isAdmin={isAdmin} makeInvite={makeInvite} onClose={() => setInvite(false)} />}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

function Stat({ value, label, color = C.ink }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

// ── Fiche élève (bilan détaillé) ──────────────────────────────────────────────
function FicheModal({ student, conseiller, onClose, onRelance }) {
  const pillars = useMemo(() => studentPillars(student), [student]);
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHead}>
          <div style={S.avatarLg}>{initials(student.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.modalTitle}>{student.name}</div>
            <div style={S.modalSub}>{student.email} · {conseiller}</div>
          </div>
          <button style={S.close} onClick={onClose}>×</button>
        </div>

        <div style={S.ficheStats}>
          <span style={S.fStat}>⚡ {student.xp} XP</span>
          <span style={S.fStat}>🔥 {student.streak} j</span>
          <span style={S.fStat}>🕒 {student.lastActive}</span>
          {typeof student.employability === 'number' && (
            <span style={{ ...S.fStat, color: scoreColor(student.employability), fontWeight: 800 }}>{student.employability}% employabilité</span>
          )}
        </div>

        <div style={S.sectionLabel}>Bilan par pilier</div>
        <div style={{ display: 'grid', gap: 9 }}>
          {pillars.map((p) => (
            <div key={p.id} style={S.pillarRow}>
              <span style={{ fontSize: 15, width: 22 }}>{p.emoji}</span>
              <span style={S.pillarLabel}>{p.label}</span>
              <div style={S.pillarBar}><div style={{ ...S.pillarFill, width: `${p.score}%`, background: scoreColor(p.score) }} /></div>
              <span style={{ ...S.pillarPct, color: scoreColor(p.score) }}>{p.score}%</span>
            </div>
          ))}
        </div>

        <button style={S.modalCta} onClick={() => { onRelance(); onClose(); }}>📨 Relancer cet élève</button>
      </div>
    </div>
  );
}

// ── Inviter des élèves (lien) ─────────────────────────────────────────────────
function InviteModal({ viewer, conseillers, isAdmin, makeInvite, onClose }) {
  const [mgr, setMgr] = useState(isAdmin ? (conseillers[0]?.id || '') : (viewer?.id || ''));
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const m = conseillers.find((c) => c.id === mgr);
    makeInvite(mgr, m?.name).then((t) => { if (alive) setToken(t || ''); });
    return () => { alive = false; };
  }, [mgr, makeInvite, conseillers]);

  const link = token ? `${window.location.origin}/?org_invite=${token}` : 'Génération du lien…';
  const copy = () => { if (!token) return; try { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* */ } };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHead}>
          <div style={{ flex: 1 }}>
            <div style={S.modalTitle}>Inviter des élèves</div>
            <div style={S.modalSub}>Partage ce lien : l'élève rejoint {isAdmin ? 'le conseiller choisi' : 'ton groupe'}, sans payer.</div>
          </div>
          <button style={S.close} onClick={onClose}>×</button>
        </div>

        {isAdmin && (
          <>
            <div style={S.sectionLabel}>Conseiller assigné</div>
            <select style={S.select} value={mgr} onChange={(e) => setMgr(e.target.value)}>
              {conseillers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </>
        )}

        <div style={S.sectionLabel}>Lien d'invitation</div>
        <div style={S.linkRow}>
          <input style={S.linkInput} value={link} readOnly onFocus={(e) => e.target.select()} />
          <button style={S.copyBtn} onClick={copy}>{copied ? '✓ Copié' : 'Copier'}</button>
        </div>
        <p style={S.hint}>
          L'élève qui ouvre ce lien rejoint le groupe du conseiller, sans payer.
          (Sièges, expiration et email peuvent être gérés côté école.)
        </p>
      </div>
    </div>
  );
}

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 760, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },

  header: { display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: 0 },
  inviteBtn: { flexShrink: 0, background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  ghostBtn: { flexShrink: 0, background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: '11px 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  personaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: alpha(C.amber, 10), border: `1px solid ${alpha(C.amber, 30)}`, borderRadius: 12, padding: '10px 12px', marginBottom: 16 },
  personaLabel: { fontSize: 12, fontWeight: 700, color: C.ink2 },
  personaBtn: { background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 99, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  personaOn: { background: C.blue, color: '#fff', borderColor: C.blue },

  statRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 },
  stat: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 10px', textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.mute, fontWeight: 600, marginTop: 2 },

  list: { display: 'grid', gap: 10 },
  row: { display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px' },
  rowRisk: { borderColor: alpha(C.red, 34), background: alpha(C.red, 6) },
  avatar: { width: 40, height: 40, flexShrink: 0, borderRadius: '50%', background: C.blueSoft, color: C.blue, border: 'none', display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: FONT },
  name: { fontSize: 14.5, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  riskFlag: { fontSize: 11, fontWeight: 800, color: C.red, background: alpha(C.red, 12), padding: '2px 7px', borderRadius: 99 },
  meta: { fontSize: 12, color: C.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  barWrap: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, maxWidth: 240 },
  bar: { flex: 1, height: 6, background: C.track, borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  barPct: { fontSize: 11.5, fontWeight: 800 },

  side: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0, marginLeft: 'auto' },
  xp: { fontSize: 12.5, fontWeight: 800, color: C.blue },
  streak: { fontSize: 12, fontWeight: 700, color: C.amber },
  last: { fontSize: 11, color: C.mute },

  relanceBtn: { flexShrink: 0, background: alpha(C.red, 12), color: C.red, border: `1px solid ${alpha(C.red, 30)}`, borderRadius: 10, padding: '7px 11px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  reassign: { flexShrink: 0, background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: '7px 8px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', appearance: 'auto' },
  conseiller: { flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.ink2, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 99, padding: '5px 10px' },

  empty: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px', textAlign: 'center', color: C.ink2, fontSize: 14 },

  // Modals
  overlay: { position: 'fixed', inset: 0, background: 'rgba(11,22,56,.45)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 50 },
  modal: { width: '100%', maxWidth: 480, background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '20px 22px', boxShadow: '0 24px 60px -16px rgba(0,0,0,.4)' },
  modalHead: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarLg: { width: 48, height: 48, flexShrink: 0, borderRadius: '50%', background: C.blueSoft, color: C.blue, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800 },
  modalTitle: { fontSize: 18, fontWeight: 800, color: C.ink },
  modalSub: { fontSize: 12.5, color: C.mute, marginTop: 2 },
  close: { background: 'none', border: 'none', color: C.mute, fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 0 },
  ficheStats: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  fStat: { fontSize: 12.5, fontWeight: 700, color: C.ink2, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 99, padding: '5px 11px' },
  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '16px 0 10px' },
  pillarRow: { display: 'flex', alignItems: 'center', gap: 10 },
  pillarLabel: { fontSize: 13, fontWeight: 600, color: C.ink, width: 96, flexShrink: 0 },
  pillarBar: { flex: 1, height: 7, background: C.track, borderRadius: 99, overflow: 'hidden' },
  pillarFill: { height: '100%', borderRadius: 99 },
  pillarPct: { fontSize: 12, fontWeight: 800, width: 36, textAlign: 'right' },
  modalCta: { width: '100%', marginTop: 18, background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  select: { width: '100%', boxSizing: 'border-box', background: C.card, color: C.ink, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '11px 12px', fontSize: 14, fontFamily: FONT, appearance: 'auto' },
  linkRow: { display: 'flex', gap: 8 },
  linkInput: { flex: 1, minWidth: 0, background: C.bg, color: C.ink2, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '11px 12px', fontSize: 12.5, fontFamily: FONT },
  copyBtn: { flexShrink: 0, background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  hint: { fontSize: 12, color: C.mute, lineHeight: 1.5, marginTop: 10 },

  toast: { position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', background: C.ink, color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,.3)', zIndex: 60 },
};
