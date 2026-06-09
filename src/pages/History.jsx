/**
 * Page Historique — liste tous les CV générés.
 * Lecture depuis Supabase (avec fallback localStorage).
 * Écriture via historySync.js (write-through cache).
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVersions, deleteVersions } from '@/lib/cvData';
import {
  getHistory, getHistorySync, updateHistory, deleteHistory,
} from '@/lib/historySync';
import { supabaseReady } from '@/lib/supabase';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function relTime(dateStr) {
  // dateStr est au format "JJ/MM/AAAA HH:MM"
  if (!dateStr) return '—';
  return dateStr;
}

function TemplateTag({ id }) {
  const map = {
    classic: 'Classique',
    minimal: 'Minimaliste',
    compact: 'Colonne',
    impact:  'Impact',
  };
  const label = map[id] || (id ? id.charAt(0).toUpperCase() + id.slice(1) : '—');
  const colors = {
    classic:  { bg: '#EEF2FF', color: '#1539B7' },
    minimal:  { bg: '#F0FDF4', color: '#15803D' },
    compact:  { bg: '#FFF7ED', color: '#C2410C' },
    impact:   { bg: '#FDF4FF', color: '#9333EA' },
  };
  const c = colors[id] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '.04em',
      background: c.bg, color: c.color,
    }}>
      {label}
    </span>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function History() {
  const navigate = useNavigate();
  // Initialisation synchrone depuis localStorage, puis synchro Supabase
  const [hist, setHistState]  = useState(() => getHistorySync());
  const [search, setSearch]   = useState('');
  const [delConfirm, setDelConfirm] = useState(null); // id à confirmer
  const [syncing, setSyncing] = useState(false);

  // Chargement Supabase au montage
  useEffect(() => {
    if (!supabaseReady) return;
    setSyncing(true);
    getHistory().then(data => {
      setHistState(data);
      setSyncing(false);
    }).catch(() => setSyncing(false));
  }, []);

  const refresh = useCallback(() => {
    setHistState(getHistorySync());
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    const current = getHistorySync().find(h => String(h.id) === String(id));
    if (!current) return;
    await updateHistory(id, { favorite: !current.favorite });
    refresh();
  }, [refresh]);

  const deleteEntry = useCallback(async (id) => {
    await deleteHistory(id);
    deleteVersions(id);
    setDelConfirm(null);
    refresh();
  }, [refresh]);

  const filtered = hist.filter(h => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      h.name?.toLowerCase().includes(q) ||
      h.formation?.toLowerCase().includes(q) ||
      h.data?.poste?.toLowerCase().includes(q)
    );
  });

  // Favoris en tête, puis tri par date (plus récent en premier)
  const sorted = [...filtered].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return b.id - a.id;
  });

  const C = {
    bg: '#F7F8FA', surface: '#fff', ink: '#0B1020', ink2: '#3A4156',
    mute: '#9AA0AE', rule: '#ECEDF1', bluePrimary: '#1539B7',
    blueSoft: '#EEF2FF', star: '#F5B400', red: '#EF4444',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hist-row:hover { background: ${C.blueSoft} !important; }
        .hist-row:hover .row-actions { opacity: 1 !important; }
        .row-actions { opacity: 0; transition: opacity .15s; }
        .action-btn { background: none; border: none; cursor: pointer; padding: 6px 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; font-family: 'Manrope', sans-serif; transition: all .15s; }
        .action-btn:hover { background: #fff; }
        .search-input { width: 100%; padding: 10px 14px 10px 38px; border: 1.5px solid ${C.rule}; border-radius: 12px; font-size: 13px; font-family: 'Manrope', sans-serif; outline: none; background: #fff; color: ${C.ink}; transition: border-color .15s; }
        .search-input:focus { border-color: ${C.bluePrimary}; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: '#fff', height: 56, display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 12, borderBottom: `1px solid ${C.rule}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>ALTIO<span style={{ color: C.bluePrimary }}>CV</span></span>
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.mute, fontFamily: "'Manrope', sans-serif", transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.ink; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.mute; }}
          title="Page précédente"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Retour
        </button>
        <div style={{ width: 1, height: 22, background: C.rule }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Historique</span>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: C.ink, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau CV
        </button>
      </header>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Titre + stats */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.ink, margin: 0, letterSpacing: '-0.5px' }}>
            Mes CV
          </h1>
          <p style={{ fontSize: 13, color: C.mute, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>
              {hist.length} CV sauvegardé{hist.length > 1 ? 's' : ''}
              {hist.filter(h => h.favorite).length > 0 && ` · ${hist.filter(h => h.favorite).length} favori${hist.filter(h => h.favorite).length > 1 ? 's' : ''}`}
            </span>
            {syncing && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.bluePrimary }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin .8s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".2"/><path d="M21 12A9 9 0 0012 3"/>
                </svg>
                Synchronisation…
              </span>
            )}
            {!syncing && supabaseReady && (
              <span style={{ fontSize: 11, color: '#16A34A' }}>☁ Synchronisé</span>
            )}
          </p>
        </div>

        {/* Barre de recherche */}
        {hist.length > 3 && (
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              placeholder="Rechercher par nom, formation, poste…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* État vide */}
        {hist.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16, animation: 'fadeInUp .3s ease' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: C.blueSoft, color: C.bluePrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Aucun CV encore</div>
              <div style={{ fontSize: 13, color: C.mute, maxWidth: 280, lineHeight: 1.6 }}>Génère ton premier CV depuis la page d'accueil pour le retrouver ici.</div>
            </div>
            <button
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: C.ink, color: '#fff', border: 'none', borderRadius: 99, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Créer mon premier CV
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.mute, fontSize: 14 }}>
            Aucun résultat pour « {search} »
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${C.rule}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>

            {/* En-têtes colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr auto', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${C.rule}`, background: '#FAFAFA' }}>
              {['Candidat', 'Formation', 'Date', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</span>
              ))}
            </div>

            {/* Lignes */}
            {sorted.map((cv, i) => {
              const versions = getVersions(cv.id);
              const isLast   = i === sorted.length - 1;
              return (
                <div
                  key={cv.id}
                  className="hist-row"
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr auto',
                    alignItems: 'center', padding: '14px 20px',
                    borderBottom: isLast ? 'none' : `1px solid ${C.rule}`,
                    background: cv.favorite ? '#FFFBEB' : '#fff',
                    transition: 'background .15s',
                    animation: `fadeInUp .25s ease ${i * 0.03}s both`,
                  }}
                >
                  {/* Candidat */}
                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Étoile favoris */}
                    <button
                      onClick={() => toggleFavorite(cv.id)}
                      title={cv.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: cv.favorite ? C.star : C.rule, flexShrink: 0, display: 'flex', lineHeight: 1, transition: 'color .15s' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={cv.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cv.name || 'Sans nom'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                        {cv.data?.poste && (
                          <span style={{ fontSize: 11, color: C.mute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{cv.data.poste}</span>
                        )}
                        <TemplateTag id={cv.data?.templateId || cv.templateId} />
                        {versions.length > 0 && (
                          <span style={{ fontSize: 10, color: C.bluePrimary, fontWeight: 600 }}>{versions.length} version{versions.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Formation + profil */}
                  <div style={{ fontSize: 12, color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cv.formation || cv.bulkLabel || '—'}
                    </span>
                    {cv.profileName && (
                      <span style={{
                        flexShrink: 0, fontSize: 10, fontWeight: 600,
                        background: '#EEF2FF', color: '#1539B7',
                        borderRadius: 99, padding: '1px 7px',
                      }}>🧠 {cv.profileName}</span>
                    )}
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: C.mute }}>{relTime(cv.date)}</div>

                  {/* Actions */}
                  <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      className="action-btn"
                      onClick={() => navigate(`/editor/${cv.id}`)}
                      style={{ color: C.bluePrimary }}
                      title="Ouvrir dans l'éditeur"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Éditer
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => setDelConfirm(String(cv.id))}
                      style={{ color: C.red }}
                      title="Supprimer ce CV"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dialogue confirmation suppression ───────────────────────────────── */}
      {delConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setDelConfirm(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', animation: 'fadeInUp .2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Supprimer ce CV ?</div>
            <div style={{ fontSize: 13, color: C.mute, lineHeight: 1.6, marginBottom: 24 }}>
              Cette action est irréversible. Le CV et toutes ses versions seront effacés.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDelConfirm(null)}
                style={{ flex: 1, padding: '10px', border: `1px solid ${C.rule}`, borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.ink2, fontFamily: "'Manrope', sans-serif" }}
              >
                Annuler
              </button>
              <button
                onClick={() => deleteEntry(delConfirm)}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: C.red, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Manrope', sans-serif" }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
