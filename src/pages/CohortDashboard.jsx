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
import { needsFollowup } from '@/lib/demoCohort';
import { rosterToCSV, downloadCSV } from '@/lib/cohortServer';
import { OUTCOMES, outcomeMeta, DEFAULT_OUTCOME, isSettled } from '@/lib/cohortOutcome';
import {
  APP_STATUS, appStatusMeta, isPlacement,
  listApplications, addApplication, updateApplication, deleteApplication, fetchApplicationStats,
} from '@/lib/applications';
import { pillarsFromProgress, moduleBreakdown, badgesFromProgress, hasProgress } from '@/lib/studentProgress';
import { fetchCvStats, fetchOrgBranding, saveOrgBranding } from '@/lib/cohortServer';

/** Ce que le conseiller doit faire quand la relance ne part pas. */
const NUDGE_ERRORS = {
  email_not_configured: "L'envoi d'emails n'est pas encore configuré pour ton école.",
  student_has_no_email: "Cet élève n'a pas d'adresse email renseignée.",
  forbidden: "Tu n'encadres pas cet élève.",
  not_authenticated: 'Reconnecte-toi pour envoyer une relance.',
};

const scoreColor = (s) => (s >= 70 ? C.green : s >= 40 ? C.amber : C.red);
const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function CohortDashboard() {
  const navigate = useNavigate();
  const {
    loading, viewer, students, conseillers, cohorts, orgName, orgId, reassign, isDemo, persona,
    switchPersona, makeInvite, nudge, updateOutcome, addCohort,
  } = useCohort();
  const isAdmin = viewer?.role === 'admin';
  const nameOf = (id) => conseillers.find((c) => c.id === id)?.name || '—';
  const cohortNameOf = (id) => cohorts.find((c) => c.id === id)?.name || '';

  const [fiche, setFiche] = useState(null);   // élève ouvert
  const [invite, setInvite] = useState(false); // modal invitation
  const [branding, setBranding] = useState(false); // modal marque
  const [toast, setToast] = useState('');
  const [promo, setPromo] = useState('all');  // filtre promo : 'all' | id | 'none'
  const [appStats, setAppStats] = useState({});  // candidatures par élève
  const [appTick, setAppTick] = useState(0);

  // Compteurs de candidatures : chargés à part, la vue cohorte ne les porte pas.
  useEffect(() => {
    let alive = true;
    const ids = students.map((s) => s.id);
    if (!ids.length) { setAppStats({}); return; }
    fetchApplicationStats(ids).then((r) => { if (alive) setAppStats(r); });
    return () => { alive = false; };
  }, [students, appTick]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3400); };

  const relancer = async (s) => {
    flash(`Envoi de la relance à ${s.name}…`);
    const res = await nudge(s);
    flash(res?.ok ? `Relance envoyée à ${s.name} 📨` : NUDGE_ERRORS[res?.reason] || "L'envoi a échoué. Réessaie dans un instant.");
  };

  // Les élèves affichés : ceux de la promo sélectionnée.
  const visible = useMemo(() => {
    if (promo === 'all') return students;
    if (promo === 'none') return students.filter((s) => !s.cohortId);
    return students.filter((s) => s.cohortId === promo);
  }, [students, promo]);

  const setOutcome = async (s, outcome) => {
    await updateOutcome(s.id, outcome);
    flash(`${s.name} — ${outcomeMeta(outcome).label}`);
  };

  const exportCSV = () => {
    const csv = rosterToCSV(visible, nameOf, cohortNameOf);
    const suffix = promo === 'all' ? '' : `-${(cohortNameOf(promo) || 'sans-promo').replace(/\s+/g, '-').toLowerCase()}`;
    downloadCSV(`cohorte${suffix}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    flash('Export CSV téléchargé ⬇');
  };

  const stats = useMemo(() => {
    if (!visible.length) return { n: 0, avg: 0, placed: 0, risk: 0 };
    const hasEmp = visible.every((s) => typeof s.employability === 'number');
    const avg = hasEmp
      ? Math.round(visible.reduce((a, s) => a + s.employability, 0) / visible.length)
      : Math.round(visible.reduce((a, s) => a + (s.xp || 0), 0) / visible.length);
    const placed = visible.filter((s) => isSettled(s.outcome) && s.outcome !== 'dropped_out').length;
    const risk = visible.filter(needsFollowup).length;
    // Ce que le coach montre à son client : combien ont vraiment signé.
    const rate = visible.length ? Math.round((placed / visible.length) * 100) : 0;
    return { n: visible.length, avg, placed, risk, rate, hasEmp };
  }, [visible]);

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ModuleTopBar label="Encadrement" />

        <div style={S.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={S.eyebrow}>{orgName || 'Espace encadrant'}</span>
            <h1 style={S.h1}>{isAdmin ? 'Tous les élèves' : 'Mes élèves'}</h1>
          </div>
          {isAdmin && <button style={S.ghostBtn} onClick={() => setBranding(true)}>🎨 Ma marque</button>}
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

        {/* Filtre par promo */}
        {(cohorts.length > 0 || students.some((s) => !s.cohortId)) && (
          <div style={S.promoRow}>
            <button onClick={() => setPromo('all')}
              style={{ ...S.promoBtn, ...(promo === 'all' ? S.promoOn : {}) }}>
              Toutes les promos
            </button>
            {cohorts.map((c) => (
              <button key={c.id} onClick={() => setPromo(c.id)}
                style={{ ...S.promoBtn, ...(promo === c.id ? S.promoOn : {}) }}>
                {c.name}
                <span style={S.promoCount}>{students.filter((s) => s.cohortId === c.id).length}</span>
              </button>
            ))}
            {students.some((s) => !s.cohortId) && (
              <button onClick={() => setPromo('none')}
                style={{ ...S.promoBtn, ...(promo === 'none' ? S.promoOn : {}) }}>
                Sans promo
                <span style={S.promoCount}>{students.filter((s) => !s.cohortId).length}</span>
              </button>
            )}
          </div>
        )}

        {/* Résumé */}
        <div style={S.statRow}>
          <Stat value={stats.n} label="élèves" />
          <Stat value={stats.hasEmp ? `${stats.avg}%` : stats.avg} label={stats.hasEmp ? 'employabilité moy.' : 'XP moy.'} color={stats.hasEmp ? scoreColor(stats.avg) : C.blue} />
          <Stat value={`${stats.rate}%`} label={`placés · ${stats.placed}/${stats.n}`} color={stats.placed ? C.green : C.mute} />
          <Stat value={stats.risk} label="à relancer" color={stats.risk ? C.red : C.mute} />
        </div>

        {/* Liste */}
        {loading ? (
          <div style={S.empty}>Chargement…</div>
        ) : visible.length === 0 ? (
          <div style={S.empty}>
            {students.length === 0 ? 'Aucun élève pour cette vue.' : 'Aucun élève dans cette promo.'}
          </div>
        ) : (
          <div style={S.list}>
            {visible.map((s) => {
              const risk = needsFollowup(s);
              return (
                <div key={s.id} style={{ ...S.row, ...(risk ? S.rowRisk : {}) }}>
                  <button style={S.avatar} onClick={() => setFiche(s)} title="Voir la fiche">{initials(s.name)}</button>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setFiche(s)}>
                    <div style={S.name}>
                      {s.name}
                      <OutcomeBadge outcome={s.outcome} />
                      {risk && <span style={S.riskFlag}>⚠️ à relancer</span>}
                    </div>
                    <div style={S.meta}>
                      {s.email}
                      {promo === 'all' && s.cohortId && ` · ${cohortNameOf(s.cohortId)}`}
                      {appStats[s.id]?.total > 0 && (
                        <span style={S.appCount}>
                          {' · '}{appStats[s.id].total} candidature{appStats[s.id].total > 1 ? 's' : ''}
                          {appStats[s.id].signed > 0 && <span style={{ color: C.green, fontWeight: 800 }}> · {appStats[s.id].signed} signé{appStats[s.id].signed > 1 ? 's' : ''}</span>}
                        </span>
                      )}
                    </div>
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

      {fiche && (
        <FicheModal
          student={fiche}
          conseiller={nameOf(fiche.manager)}
          cohortName={cohortNameOf(fiche.cohortId)}
          orgId={orgId}
          onApplicationsChange={() => setAppTick((t) => t + 1)}
          onClose={() => setFiche(null)}
          onRelance={() => { relancer(fiche); }}
          onOutcome={async (o) => { await setOutcome(fiche, o); setFiche({ ...fiche, outcome: o }); }}
        />
      )}
      {branding && (
        <BrandingModal orgId={orgId} orgName={orgName} onClose={() => setBranding(false)} onSaved={() => flash('Marque enregistrée 🎨')} />
      )}
      {invite && (
        <InviteModal
          viewer={viewer} conseillers={conseillers} cohorts={cohorts} isAdmin={isAdmin}
          makeInvite={makeInvite} addCohort={addCohort} onClose={() => setInvite(false)}
        />
      )}
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

/** Pastille de statut de parcours (en formation → diplômé). */
function OutcomeBadge({ outcome }) {
  const m = outcomeMeta(outcome || DEFAULT_OUTCOME);
  return (
    <span style={{ ...S.outcomeBadge, color: m.color, background: alpha(m.color, 12), border: `1px solid ${alpha(m.color, 30)}` }}>
      {m.short}
    </span>
  );
}

// ── Fiche élève (bilan détaillé) ──────────────────────────────────────────────
function FicheModal({ student, conseiller, cohortName, orgId, onClose, onRelance, onOutcome, onApplicationsChange }) {
  const [cvStats, setCvStats] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchCvStats([student.id]).then((r) => { if (alive) setCvStats(r[student.id] || null); });
    return () => { alive = false; };
  }, [student.id]);

  // Bilan calculé sur la progression réelle de l'accompagné, via le même
  // algorithme que celui qu'il voit lui-même sur /diagnostic.
  const diag = useMemo(() => pillarsFromProgress(student.progress, cvStats), [student.progress, cvStats]);
  const pillars = diag.pillars;
  const modules = useMemo(() => moduleBreakdown(student.progress), [student.progress]);
  const badges = useMemo(() => badgesFromProgress(student.progress), [student.progress]);
  const active = hasProgress(student.progress);
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHead}>
          <div style={S.avatarLg}>{initials(student.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.modalTitle}>{student.name}</div>
            <div style={S.modalSub}>
              {student.email} · {conseiller}{cohortName ? ` · ${cohortName}` : ''}
            </div>
          </div>
          <button style={S.close} onClick={onClose}>×</button>
        </div>

        <div style={S.sectionLabel}>Où en est cet élève ?</div>
        <div style={S.outcomePicker}>
          {OUTCOMES.map((o) => {
            const on = (student.outcome || DEFAULT_OUTCOME) === o.id;
            return (
              <button key={o.id} onClick={() => onOutcome(o.id)}
                style={{
                  ...S.outcomeOpt,
                  ...(on ? { background: alpha(o.color, 14), border: `1.5px solid ${o.color}`, color: o.color } : {}),
                }}>
                {o.label}
              </button>
            );
          })}
        </div>

        <div style={S.ficheStats}>
          <span style={S.fStat}>⚡ {student.xp} XP</span>
          <span style={S.fStat}>🔥 {student.streak} j</span>
          <span style={S.fStat}>🕒 {student.lastActive}</span>
          {typeof student.employability === 'number' && (
            <span style={{ ...S.fStat, color: scoreColor(student.employability), fontWeight: 800 }}>{student.employability}% employabilité</span>
          )}
        </div>

        {!active ? (
          <div style={S.appEmpty}>
            Cet accompagné ne s'est pas encore connecté — aucune progression à afficher.
          </div>
        ) : (
          <>
            <div style={S.sectionLabel}>Bilan par pilier · {diag.global}%</div>
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

            <div style={S.sectionLabel}>Devoirs &amp; exercices</div>
            <div style={S.modGrid}>
              {modules.map((m) => (
                <div key={m.id} style={S.modCard}>
                  <span style={S.modEmoji}>{m.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={S.modLabel}>{m.label}</div>
                    <div style={S.modValue}>
                      {m.total !== undefined
                        ? `${m.done} / ${m.total} ${m.unit}`
                        : m.count !== undefined
                          ? `${m.count}`
                          : m.plays > 0 ? `${m.note}/20 · ${m.plays} essai${m.plays > 1 ? 's' : ''}` : 'Pas encore fait'}
                    </div>
                  </div>
                </div>
              ))}
              <div style={S.modCard}>
                <span style={S.modEmoji}>📄</span>
                <div style={{ minWidth: 0 }}>
                  <div style={S.modLabel}>CV produits</div>
                  <div style={S.modValue}>{cvStats ? cvStats.cv_count : '—'}</div>
                </div>
              </div>
            </div>

            {badges.length > 0 && (
              <>
                <div style={S.sectionLabel}>Badges · {badges.length}</div>
                <div style={S.badgeRow}>
                  {badges.map((b) => <span key={b} style={S.badge}>🏅 {b.replace(/_/g, ' ')}</span>)}
                </div>
              </>
            )}
          </>
        )}

        <ApplicationsSection student={student} orgId={orgId} onChange={onApplicationsChange} />

        <button style={S.modalCta} onClick={() => { onRelance(); onClose(); }}>📨 Relancer cet élève</button>
      </div>
    </div>
  );
}

/**
 * Candidatures de l'accompagné — entreprise, poste, où ça en est.
 * C'est ce qui permet au coach de démontrer un placement, là où XP et série
 * ne disent rien de la recherche réelle.
 */
function ApplicationsSection({ student, orgId, onChange }) {
  const [apps, setApps] = useState(null); // null = chargement
  const [adding, setAdding] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    listApplications(student.id).then((r) => { if (alive) setApps(r); });
    return () => { alive = false; };
  }, [student.id]);

  const refresh = async () => {
    const r = await listApplications(student.id);
    setApps(r);
    onChange?.();
  };

  const add = async () => {
    if (!company.trim() || busy) return;
    setBusy(true);
    await addApplication({ studentId: student.id, orgId, company, roleTitle: role });
    setBusy(false);
    setCompany(''); setRole(''); setAdding(false);
    refresh();
  };

  const setStatus = async (id, status) => { await updateApplication(id, { status }); refresh(); };
  const remove = async (id) => { await deleteApplication(id); refresh(); };

  const signed = (apps || []).filter((a) => isPlacement(a.status)).length;

  return (
    <>
      <div style={S.appHead}>
        <span style={{ ...S.sectionLabel, margin: 0 }}>
          Candidatures{apps?.length ? ` · ${apps.length}` : ''}
          {signed > 0 && <span style={S.appSigned}>{signed} signé{signed > 1 ? 's' : ''}</span>}
        </span>
        <button style={S.appAdd} onClick={() => setAdding((v) => !v)}>
          {adding ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {adding && (
        <div style={S.appForm}>
          <input style={S.appInput} value={company} autoFocus placeholder="Entreprise"
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
          <input style={S.appInput} value={role} placeholder="Poste (optionnel)"
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
          <button style={{ ...S.appSave, opacity: company.trim() && !busy ? 1 : 0.5 }}
            onClick={add} disabled={!company.trim() || busy}>
            {busy ? '…' : 'Ajouter'}
          </button>
        </div>
      )}

      {apps === null ? (
        <div style={S.appEmpty}>Chargement…</div>
      ) : apps.length === 0 ? (
        <div style={S.appEmpty}>Aucune candidature enregistrée.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {apps.map((a) => {
            const m = appStatusMeta(a.status);
            return (
              <div key={a.id} style={S.appRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.appCompany}>{a.company}</div>
                  {a.role_title && <div style={S.appRole}>{a.role_title}</div>}
                </div>
                <select
                  value={a.status}
                  onChange={(e) => setStatus(a.id, e.target.value)}
                  aria-label={`Statut de la candidature ${a.company}`}
                  style={{ ...S.appStatus, color: m.color, borderColor: alpha(m.color, 40) }}>
                  {APP_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button style={S.appDel} onClick={() => remove(a.id)} title="Supprimer" aria-label={`Supprimer la candidature ${a.company}`}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * Marque de l'organisation — logo, couleur, adresse de réponse.
 * Un coach indépendant facture sous son nom : ses relances doivent partir
 * sous sa marque, pas sous celle d'Altio.
 */
function BrandingModal({ orgId, orgName, onClose, onSaved }) {
  const [logoUrl, setLogoUrl] = useState('');
  const [color, setColor] = useState('#0033A0');
  const [replyTo, setReplyTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchOrgBranding(orgId).then((b) => {
      if (!alive || !b) return;
      setLogoUrl(b.logo_url || '');
      setColor(b.brand_color || '#0033A0');
      setReplyTo(b.reply_to || '');
    });
    return () => { alive = false; };
  }, [orgId]);

  const save = async () => {
    setBusy(true); setError('');
    const ok = await saveOrgBranding({ orgId, logoUrl, brandColor: color, replyTo });
    setBusy(false);
    if (ok) { onSaved(); onClose(); }
    else setError("La marque n'a pas pu être enregistrée. Vérifie l'adresse email et la couleur.");
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHead}>
          <div style={{ flex: 1 }}>
            <div style={S.modalTitle}>Ma marque</div>
            <div style={S.modalSub}>Ce que voient tes accompagnés dans tes emails de relance.</div>
          </div>
          <button style={S.close} onClick={onClose}>×</button>
        </div>

        <div style={S.sectionLabel}>Logo (URL)</div>
        <input style={S.select} value={logoUrl} placeholder="https://…/mon-logo.png"
          onChange={(e) => setLogoUrl(e.target.value)} />
        <p style={S.hint}>Laisse vide pour afficher le nom « {orgName || 'ton espace'} » en toutes lettres.</p>

        <div style={S.sectionLabel}>Couleur</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            aria-label="Couleur de marque"
            style={{ width: 46, height: 38, border: `1px solid ${C.line}`, borderRadius: 10, background: C.card, cursor: 'pointer', padding: 3 }} />
          <input style={{ ...S.select, flex: 1 }} value={color} onChange={(e) => setColor(e.target.value)} maxLength={7} />
        </div>

        <div style={S.sectionLabel}>Répondre à</div>
        <input style={S.select} value={replyTo} placeholder="sophie@mon-cabinet.fr" type="email"
          onChange={(e) => setReplyTo(e.target.value)} />
        <p style={S.hint}>L'adresse à laquelle tes accompagnés répondent. Par défaut, la tienne.</p>

        {error && <div role="alert" style={{ ...S.error, marginTop: 12 }}>{error}</div>}

        <button style={{ ...S.modalCta, opacity: busy ? 0.6 : 1 }} onClick={save} disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

// ── Inviter des élèves (lien) ─────────────────────────────────────────────────
function InviteModal({ viewer, conseillers, cohorts, isAdmin, makeInvite, addCohort, onClose }) {
  const [mgr, setMgr] = useState(isAdmin ? (conseillers[0]?.id || '') : (viewer?.id || ''));
  const [cohortId, setCohortId] = useState('');
  const [newPromo, setNewPromo] = useState('');
  const [creating, setCreating] = useState(false);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setToken('');
    const m = conseillers.find((c) => c.id === mgr);
    makeInvite(mgr, m?.name, cohortId || null).then((t) => { if (alive) setToken(t || ''); });
    return () => { alive = false; };
  }, [mgr, cohortId, makeInvite, conseillers]);

  const create = async () => {
    const name = newPromo.trim();
    if (!name) return;
    setCreating(true);
    const c = await addCohort(name);
    setCreating(false);
    if (c) { setCohortId(c.id); setNewPromo(''); }
  };

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

        <div style={S.sectionLabel}>Promo</div>
        <select style={S.select} value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
          <option value="">Sans promo</option>
          {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={S.newPromoRow}>
          <input
            style={S.linkInput} value={newPromo} placeholder="Créer une promo — ex. BTS NDRC · 2026"
            onChange={(e) => setNewPromo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
          />
          <button style={{ ...S.copyBtn, opacity: newPromo.trim() ? 1 : 0.5 }} onClick={create} disabled={!newPromo.trim() || creating}>
            {creating ? '…' : 'Créer'}
          </button>
        </div>

        <div style={S.sectionLabel}>Lien d'invitation</div>
        <div style={S.linkRow}>
          <input style={S.linkInput} value={link} readOnly onFocus={(e) => e.target.select()} />
          <button style={S.copyBtn} onClick={copy}>{copied ? '✓ Copié' : 'Copier'}</button>
        </div>
        <p style={S.hint}>
          L'élève qui ouvre ce lien rejoint le groupe du conseiller{cohortId ? ' et la promo choisie' : ''}, sans payer.
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

  promoRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  promoBtn: { display: 'inline-flex', alignItems: 'center', gap: 7, background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 99, padding: '7px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  promoOn: { background: C.blue, color: '#fff', border: `1px solid ${C.blue}` },
  promoCount: { fontSize: 11, fontWeight: 800, opacity: 0.7 },

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
  outcomeBadge: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.2, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' },
  outcomePicker: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  outcomeOpt: { background: C.bg, color: C.ink2, border: `1.5px solid ${C.line}`, borderRadius: 99, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  newPromoRow: { display: 'flex', gap: 8, marginTop: 8 },

  // Candidatures
  appCount: { color: C.ink2, fontWeight: 600 },
  appHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '18px 0 10px' },
  appSigned: { marginLeft: 8, fontSize: 10.5, fontWeight: 800, color: C.green, background: alpha(C.green, 12), padding: '2px 8px', borderRadius: 99, textTransform: 'none', letterSpacing: 0 },
  appAdd: { flexShrink: 0, background: C.bg, color: C.blue, border: `1px solid ${C.line}`, borderRadius: 10, padding: '6px 11px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  appForm: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 10 },
  appInput: { minWidth: 0, background: C.bg, color: C.ink, border: `1.5px solid ${C.line}`, borderRadius: 10, padding: '9px 11px', fontSize: 13, fontFamily: FONT, outline: 'none' },
  appSave: { flexShrink: 0, background: C.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  appRow: { display: 'flex', alignItems: 'center', gap: 9, background: C.bg, border: `1px solid ${C.line2}`, borderRadius: 12, padding: '9px 11px' },
  appCompany: { fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  appRole: { fontSize: 12, color: C.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  appStatus: { flexShrink: 0, background: C.card, border: '1.5px solid', borderRadius: 99, padding: '5px 9px', fontSize: 11.5, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', appearance: 'auto' },
  appDel: { flexShrink: 0, background: 'none', border: 'none', color: C.mute, fontSize: 19, lineHeight: 1, cursor: 'pointer', padding: '0 2px' },
  modGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 },
  modCard: { display: 'flex', alignItems: 'center', gap: 9, background: C.bg, border: `1px solid ${C.line2}`, borderRadius: 12, padding: '10px 12px' },
  modEmoji: { fontSize: 16, flexShrink: 0 },
  modLabel: { fontSize: 12, color: C.mute, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  modValue: { fontSize: 13.5, fontWeight: 800, color: C.ink, marginTop: 1 },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  badge: { fontSize: 12, fontWeight: 700, color: C.ink2, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 99, padding: '5px 11px', textTransform: 'capitalize' },
  appEmpty: { background: C.bg, border: `1px dashed ${C.line}`, borderRadius: 12, padding: '14px', textAlign: 'center', color: C.mute, fontSize: 13 },
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
  error: { background: alpha(C.red, 10), border: `1px solid ${alpha(C.red, 30)}`, color: C.red, borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600 },

  toast: { position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', background: C.ink, color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,.3)', zIndex: 60 },
};
