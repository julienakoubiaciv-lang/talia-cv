/**
 * EspaceEtudiant — sections « plateforme élève » de la Home du générateur.
 *
 * Affichées quand l'utilisateur connecté est un élève (useUserContext →
 * kind === 'student') : le générateur DEVIENT la plateforme étudiante
 * (décision produit 2026-07-02, remplace l'iframe inversée web-v2).
 *
 *   <SuiviSection />      — parcours d'admission (timeline) + candidatures
 *   <DocumentsSection />  — dépôt / liste / suppression de pièces
 *   <RdvSection />        — rendez-vous à venir
 *
 * Données : API legacy /api/candidat/* (JWT étudiant OCTO) via candidatApi.
 * Le hook useCandidatInfo est partagé pour ne fetch qu'une fois par montage.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCandidatInfo, uploadCandidatDoc, deleteCandidatDoc,
  UPLOADABLE_DOC_TYPES, docTypeLabel, ADMISSION_STEPS,
  formatDateFR, formatDateTimeFR, humanSize,
} from '@/lib/candidatApi';

const C = {
  blue:    'var(--altio-blue)',
  blueSoft:'var(--altio-blue-soft)',
  ink:     'var(--altio-ink)',
  ink2:    'var(--altio-ink2)',
  mute:    'var(--altio-mute)',
  rule:    'var(--altio-line)',
  card:    'var(--altio-card)',
  card2:   'var(--altio-card2)',
  ok:      'var(--altio-green)',
  okBg:    'var(--altio-green-soft)',
};
const FONT = "'Manrope', system-ui, sans-serif";

/* ── Fetch partagé ────────────────────────────────────────────────────────── */
function useCandidatInfo() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCandidatInfo()
      .then((data) => { if (!cancelled) { setInfo(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [nonce]);

  return { info, error, loading, reload };
}

/* ── Briques UI ───────────────────────────────────────────────────────────── */
function Card({ title, icon, aside, children }) {
  return (
    <section style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 18, padding: 22, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16.5, fontWeight: 800, color: C.ink, margin: 0 }}>
          <span>{icon}</span>{title}
        </h2>
        {aside && <span style={{ fontSize: 12, color: C.mute }}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function StatusMsg({ loading, error }) {
  if (loading) {
    return <p style={{ textAlign: 'center', color: C.mute, fontSize: 14, padding: '28px 0', fontFamily: FONT }}>Chargement de ton espace…</p>;
  }
  if (error) {
    const noFiche = error.status === 404;
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: FONT }}>
        <div style={{ fontSize: 30 }}>{noFiche ? '🎓' : '⚠️'}</div>
        <p style={{ color: C.ink2, fontSize: 14, fontWeight: 600, margin: '8px 0 4px' }}>
          {noFiche ? 'Aucune fiche candidat reliée à ce compte.' : 'Espace momentanément indisponible.'}
        </p>
        <p style={{ color: C.mute, fontSize: 12.5, margin: 0 }}>
          {noFiche ? "Utilise ton lien d'invitation, ou contacte ton coach / ton école." : error.message}
        </p>
      </div>
    );
  }
  return null;
}

const STEP_STYLE = {
  done:        { bg: C.ok,   fg: '#fff',  ring: C.ok },
  fail:        { bg: '#e03131', fg: '#fff', ring: '#e03131' },
  pending:     { bg: C.blue, fg: '#fff',  ring: C.blue },
  not_started: { bg: C.card2, fg: C.mute, ring: C.rule },
};

/* ── Section « Mon suivi » : timeline admission + candidatures ───────────── */
export function SuiviSection() {
  const { info, error, loading } = useCandidatInfo();
  if (loading || error) return <Card title="Mon suivi" icon="🎓"><StatusMsg loading={loading} error={error} /></Card>;

  const { admission = {}, candidatures = [], contrat } = info || {};
  const steps = admission.steps || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contrat && (
        <div style={{ background: C.okBg, border: `1px solid ${C.ok}`, borderRadius: 18, padding: '16px 20px', fontFamily: FONT }}>
          <p style={{ margin: 0, fontWeight: 800, color: C.ink, fontSize: 15 }}>📄 {contrat.ent_nom || 'Contrat actif'} — signé</p>
          {(contrat.date_debut || contrat.date_fin) && (
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: C.ink2 }}>
              {contrat.date_debut && `Début : ${formatDateFR(contrat.date_debut)}`}
              {contrat.date_fin && ` · Fin : ${formatDateFR(contrat.date_fin)}`}
            </p>
          )}
        </div>
      )}

      <Card title="Mon parcours d'admission" icon="🎯">
        <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 12, listStyle: 'none', margin: 0, padding: 0 }}>
          {ADMISSION_STEPS.map(({ key, label }) => {
            const st = steps[key] || { status: 'not_started', date: null };
            const s = STEP_STYLE[st.status] || STEP_STYLE.not_started;
            const mark = st.status === 'done' ? '✓' : st.status === 'fail' ? '✗' : st.status === 'pending' ? '•' : '';
            const caption = st.date ? formatDateFR(st.date)
              : st.status === 'done' ? 'Validé'
              : st.status === 'fail' ? 'Non retenu'
              : st.status === 'pending' ? 'En cours' : 'À venir';
            return (
              <li key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.bg, color: s.fg, border: `2px solid ${s.ring}`, fontWeight: 800, fontSize: 15 }}>{mark}</span>
                <span style={{ marginTop: 7, fontSize: 12, fontWeight: 700, color: C.ink }}>{label}</span>
                <span style={{ fontSize: 11, color: C.mute }}>{caption}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card title="Mes candidatures" icon="📨" aside={`${candidatures.length} entreprise${candidatures.length > 1 ? 's' : ''}`}>
        {candidatures.length ? (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
            {candidatures.map((ca) => (
              <li key={ca.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: C.card2, border: `1px solid ${C.rule}`, borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: C.ink }}>{ca.entreprise?.nom || 'Entreprise'}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ca.poste || ca.entreprise?.secteur || ca.entreprise?.ville || ''}
                    {ca.motif_refus ? ` — ${ca.motif_refus}` : ''}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink2, background: C.blueSoft, borderRadius: 99, padding: '3px 10px' }}>
                    {ca.statut || 'Envoyée'}
                  </span>
                  {ca.date_envoi && <p style={{ margin: '4px 0 0', fontSize: 11, color: C.mute }}>📅 {formatDateFR(ca.date_envoi)}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center', color: C.mute, fontSize: 13.5, padding: '18px 0', margin: 0 }}>📭 Aucune candidature pour l'instant.</p>
        )}
      </Card>
    </div>
  );
}

/* ── Section « Mes documents » : dépôt + liste ───────────────────────────── */
export function DocumentsSection() {
  const { info, error, loading, reload } = useCandidatInfo();
  const [docType, setDocType] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { ok, msg }
  const fileRef = useRef(null);

  const onUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!docType || !file) return;
    setBusy(true); setNotice(null);
    try {
      await uploadCandidatDoc(docType, file);
      setNotice({ ok: true, msg: `Document déposé : ${docTypeLabel(docType)}` });
      setDocType(''); if (fileRef.current) fileRef.current.value = '';
      reload();
    } catch (err) {
      setNotice({ ok: false, msg: err.message });
    } finally { setBusy(false); }
  };

  const onDelete = async (type) => {
    setBusy(true); setNotice(null);
    try {
      await deleteCandidatDoc(type);
      setNotice({ ok: true, msg: `Document supprimé : ${docTypeLabel(type)}` });
      reload();
    } catch (err) {
      setNotice({ ok: false, msg: err.message });
    } finally { setBusy(false); }
  };

  if (loading || error) return <Card title="Mes documents" icon="📁"><StatusMsg loading={loading} error={error} /></Card>;
  const documents = info?.documents || [];

  const field = { borderRadius: 10, border: `1px solid ${C.rule}`, background: C.card, color: C.ink,
    padding: '9px 12px', fontSize: 13.5, fontFamily: FONT, outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {notice && (
        <p style={{ margin: 0, borderRadius: 12, padding: '11px 16px', fontSize: 13, fontFamily: FONT,
          background: notice.ok ? C.okBg : '#fdecec', color: notice.ok ? C.ink : '#c92a2a',
          border: `1px solid ${notice.ok ? C.ok : '#f5b5b5'}` }}>
          {notice.ok ? '✅' : '⚠️'} {notice.msg}
        </p>
      )}

      <Card title="Déposer un document" icon="⬆️">
        <form onSubmit={onUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <label style={{ flex: '1 1 180px', fontSize: 12.5, fontWeight: 700, color: C.ink2, fontFamily: FONT }}>
            Type
            <select value={docType} onChange={(e) => setDocType(e.target.value)} required
              style={{ ...field, display: 'block', width: '100%', marginTop: 5 }}>
              <option value="" disabled>Choisir…</option>
              {UPLOADABLE_DOC_TYPES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </label>
          <label style={{ flex: '2 1 220px', fontSize: 12.5, fontWeight: 700, color: C.ink2, fontFamily: FONT }}>
            Fichier
            <input ref={fileRef} type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              style={{ ...field, display: 'block', width: '100%', marginTop: 5, padding: '7px 10px' }} />
          </label>
          <button type="submit" disabled={busy}
            style={{ borderRadius: 10, border: 'none', background: C.blue, color: '#fff', fontWeight: 800,
              fontSize: 13.5, padding: '10px 18px', cursor: busy ? 'wait' : 'pointer', fontFamily: FONT, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Envoi…' : 'Déposer'}
          </button>
        </form>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: C.mute, fontFamily: FONT }}>
          PDF, image ou Word · 8 Mo max · un fichier par type (le nouveau remplace l'ancien).
        </p>
      </Card>

      <Card title="Mes documents" icon="📁" aside={`${documents.length} transmis`}>
        {documents.length ? (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
            {documents.map((d) => (
              <li key={d.id || d.doc_type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: C.okBg, border: `1px solid ${C.ok}`, borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: C.ink, fontFamily: FONT }}>{docTypeLabel(d.doc_type)}</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: C.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT }}>
                    {d.name} · {humanSize(d.size_bytes)} · {formatDateFR(d.uploaded_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noopener noreferrer"
                      style={{ borderRadius: 9, border: `1px solid ${C.rule}`, background: C.card, color: C.ink2,
                        fontSize: 12, fontWeight: 700, padding: '6px 11px', textDecoration: 'none', fontFamily: FONT }}>
                      👁 Voir
                    </a>
                  )}
                  <button onClick={() => onDelete(d.doc_type)} disabled={busy}
                    style={{ borderRadius: 9, border: '1px solid #f1c0c0', background: C.card, color: '#c92a2a',
                      fontSize: 12, fontWeight: 700, padding: '6px 11px', cursor: 'pointer', fontFamily: FONT }}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center', color: C.mute, fontSize: 13.5, padding: '18px 0', margin: 0, fontFamily: FONT }}>
            📭 Aucun document transmis pour l'instant.
          </p>
        )}
      </Card>
    </div>
  );
}

/* ── Conteneur « Mon espace » : onglets Suivi / Documents / Rendez-vous ──── */
const ESPACE_TABS = [
  { key: 'suivi', icon: '🎯', label: 'Mon suivi' },
  { key: 'docs',  icon: '📁', label: 'Mes documents' },
  { key: 'rdv',   icon: '📅', label: 'Rendez-vous' },
];

export default function EspaceEtudiant({ isMobile }) {
  const [tab, setTab] = useState('suivi');
  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: C.ink, letterSpacing: '-1px', lineHeight: 1.05, margin: '0 0 6px', fontFamily: FONT }}>
        Mon espace
      </h1>
      <p style={{ fontSize: 14.5, color: C.mute, margin: '0 0 18px', fontFamily: FONT }}>
        Ton suivi, tes documents et tes rendez-vous — reliés à ton coach ou ton école.
      </p>
      <nav style={{ display: 'flex', gap: 6, background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: 5, marginBottom: 18, overflowX: 'auto' }}>
        {ESPACE_TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, whiteSpace: 'nowrap', border: 'none', borderRadius: 10, padding: '9px 14px',
                background: on ? C.ink : 'transparent', color: on ? '#fff' : C.ink2,
                fontSize: 13.5, fontWeight: on ? 800 : 600, cursor: 'pointer', fontFamily: FONT, transition: 'background .15s' }}>
              <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </nav>
      {tab === 'suivi' && <SuiviSection />}
      {tab === 'docs' && <DocumentsSection />}
      {tab === 'rdv' && <RdvSection />}
    </div>
  );
}

/* ── Section « Rendez-vous » ─────────────────────────────────────────────── */
export function RdvSection() {
  const { info, error, loading } = useCandidatInfo();
  if (loading || error) return <Card title="Rendez-vous" icon="📅"><StatusMsg loading={loading} error={error} /></Card>;

  const events = info?.events_upcoming || [];
  return (
    <Card title="Mes rendez-vous" icon="📅" aside={`${events.length} à venir`}>
      {events.length ? (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
          {events.map((e) => (
            <li key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: C.card2, border: `1px solid ${C.rule}`, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: C.ink, fontFamily: FONT }}>{e.title || e.type || 'Rendez-vous'}</p>
                {e.location && <p style={{ margin: 0, fontSize: 12, color: C.mute, fontFamily: FONT }}>{e.location}</p>}
              </div>
              <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: C.ink2, fontFamily: FONT }}>
                {formatDateTimeFR(e.starts_at)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ textAlign: 'center', color: C.mute, fontSize: 13.5, padding: '18px 0', margin: 0, fontFamily: FONT }}>
          Tes rendez-vous (entretiens, conseiller…) apparaîtront ici.
        </p>
      )}
    </Card>
  );
}
