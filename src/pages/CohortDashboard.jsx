/**
 * CohortDashboard — Espace encadrant (`/encadrement`).
 *
 * Deux vues, mêmes données, scoppées côté serveur (RLS) :
 *   • Conseiller → la liste de SES élèves + leur progression.
 *   • Direction  → tous les élèves + réattribution à un autre conseiller.
 *
 * En démo : cohorte simulée avec switch de persona pour explorer les deux vues.
 */
import React, { useMemo } from 'react';
import { C, FONT, alpha } from '@/lib/gameTheme';
import { useNavigate } from 'react-router-dom';
import { useCohort } from '@/hooks/useCohort';

const scoreColor = (s) => (s >= 70 ? C.green : s >= 40 ? C.amber : C.red);
const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function CohortDashboard() {
  const navigate = useNavigate();
  const { loading, viewer, students, conseillers, orgName, reassign, isDemo, persona, switchPersona } = useCohort();
  const isAdmin = viewer?.role === 'admin';
  const nameOf = (id) => conseillers.find((c) => c.id === id)?.name || '—';

  const stats = useMemo(() => {
    if (!students.length) return { n: 0, avg: 0, active: 0, label: 'employabilité' };
    const hasEmp = students.every((s) => typeof s.employability === 'number');
    const avg = hasEmp
      ? Math.round(students.reduce((a, s) => a + s.employability, 0) / students.length)
      : Math.round(students.reduce((a, s) => a + (s.xp || 0), 0) / students.length);
    const active = students.filter((s) => /aujourd|hier/i.test(s.lastActive || '')).length;
    return { n: students.length, avg, active, hasEmp };
  }, [students]);

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.top}>
          <button style={S.backBtn} onClick={() => navigate('/')}>← Accueil</button>
          <span style={S.brandTag}>ALTIO · Encadrement</span>
        </div>

        <div style={S.header}>
          <span style={S.eyebrow}>{orgName || 'Espace encadrant'}</span>
          <h1 style={S.h1}>{isAdmin ? 'Tous les élèves' : 'Mes élèves'}</h1>
          <p style={S.lead}>
            {isAdmin
              ? 'Vue direction : la progression de toute la cohorte. Tu peux réattribuer un élève à un autre conseiller.'
              : 'Suis la progression de tes élèves et repère ceux qui décrochent.'}
          </p>
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
        </div>

        {/* Liste */}
        {loading ? (
          <div style={S.empty}>Chargement…</div>
        ) : students.length === 0 ? (
          <div style={S.empty}>Aucun élève pour cette vue.</div>
        ) : (
          <div style={S.list}>
            {students.map((s) => (
              <div key={s.id} style={S.row}>
                <div style={S.avatar}>{initials(s.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.name}>{s.name}</div>
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
                  <span style={S.streak} title="série">🔥 {s.streak}</span>
                  <span style={S.last}>{s.lastActive}</span>
                </div>
                {isAdmin && (
                  <select style={S.reassign} value={s.manager || ''} onChange={(e) => reassign(s.id, e.target.value)} title="Réattribuer">
                    {conseillers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {!isAdmin && <span style={S.conseiller}>{nameOf(s.manager)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
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

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 760, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },

  header: { marginBottom: 16 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 10px' },
  lead: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 520 },

  personaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: alpha(C.amber, 10), border: `1px solid ${alpha(C.amber, 30)}`, borderRadius: 12, padding: '10px 12px', marginBottom: 16 },
  personaLabel: { fontSize: 12, fontWeight: 700, color: C.ink2 },
  personaBtn: { background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 99, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  personaOn: { background: C.blue, color: '#fff', borderColor: C.blue },

  statRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 },
  stat: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', textAlign: 'center' },
  statValue: { fontSize: 26, fontWeight: 800, letterSpacing: -0.5 },
  statLabel: { fontSize: 11.5, color: C.mute, fontWeight: 600, marginTop: 2 },

  list: { display: 'grid', gap: 10 },
  row: { display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px' },
  avatar: { width: 40, height: 40, flexShrink: 0, borderRadius: '50%', background: C.blueSoft, color: C.blue, display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 800 },
  name: { fontSize: 14.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  meta: { fontSize: 12, color: C.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  barWrap: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, maxWidth: 240 },
  bar: { flex: 1, height: 6, background: C.track, borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  barPct: { fontSize: 11.5, fontWeight: 800 },

  side: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0, marginLeft: 'auto' },
  xp: { fontSize: 12.5, fontWeight: 800, color: C.blue },
  streak: { fontSize: 12, fontWeight: 700, color: C.amber },
  last: { fontSize: 11, color: C.mute },

  reassign: { flexShrink: 0, background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: '7px 8px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', appearance: 'auto' },
  conseiller: { flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.ink2, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 99, padding: '5px 10px' },

  empty: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '24px', textAlign: 'center', color: C.ink2, fontSize: 14 },
};
