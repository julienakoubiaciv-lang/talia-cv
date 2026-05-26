import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfiles, deleteProfile } from '@/lib/profileData';
import { usePlan } from '@/hooks/usePlan';
import { PlanBanner } from '@/components/PlanGate';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  blue:    '#1539B7',
  blueHov: '#1F4FE0',
  blueSoft:'#EEF2FF',
  ink:     '#0B1020',
  ink2:    '#3A4156',
  mute:    '#9AA0AE',
  rule:    '#ECEDF1',
  surface: '#F7F8FA',
  bg:      '#FFFFFF',
};
const FONT = "'Manrope', system-ui, sans-serif";

const TON_LABELS = {
  authentique:   { label: 'Authentique', color: '#0891B2', bg: '#ECFEFF' },
  professionnel: { label: 'Professionnel', color: '#7C3AED', bg: '#F5F3FF' },
  percutant:     { label: 'Percutant', color: '#EA580C', bg: '#FFF7ED' },
  creatif:       { label: 'Créatif', color: '#16A34A', bg: '#F0FDF4' },
};
const CONTEXTE_LABELS = {
  'premier-emploi': '🌱 Premier emploi',
  evolution:        '📈 Évolution',
  reconversion:     '🔄 Reconversion',
  pause:            '⏸️ Retour de pause',
};

/* ─── ProfileCard ─────────────────────────────────────────────────────── */
function ProfileCard({ profile, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ton = TON_LABELS[profile.ton?.style];
  const contexte = CONTEXTE_LABELS[profile.trajectoire?.contexte];

  return (
    <div style={{
      background: C.bg, borderRadius: 16, border: `1px solid ${C.rule}`,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'box-shadow .2s, border-color .2s',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(21,57,183,0.1)'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = C.rule; }}
    >
      {/* Tête de carte */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: C.blueSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}>
          {profile.emoji || '🚀'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.nom || 'Profil sans nom'}
          </h3>
          {contexte && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.mute }}>{contexte}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ton && (
          <span style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: ton.bg, color: ton.color,
          }}>✍️ {ton.label}</span>
        )}
        {profile.cible?.secteur && (
          <span style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: '#F0FDF4', color: '#16A34A',
          }}>🎯 {profile.cible.secteur.replace('-', ' ')}</span>
        )}
        {profile.personnalite?.mots?.slice(0, 3).map(m => (
          <span key={m} style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
            background: C.surface, color: C.ink2,
          }}>{m}</span>
        ))}
      </div>

      {/* Fierté si remplie */}
      {profile.trajectoire?.fierte && (
        <p style={{
          margin: 0, fontSize: 12, color: C.ink2, lineHeight: 1.5,
          borderLeft: `3px solid ${C.blueSoft}`, paddingLeft: 10,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          "{profile.trajectoire.fierte}"
        </p>
      )}

      {/* Actions */}
      {!confirmDelete ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onEdit} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: C.blueSoft, color: C.blue, border: 'none', cursor: 'pointer', fontFamily: FONT,
          }}>✏️ Modifier</button>
          <button onClick={() => setConfirmDelete(true)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12,
            background: '#FEF2F2', color: '#DC2626', border: 'none', cursor: 'pointer', fontFamily: FONT,
          }}>🗑</button>
        </div>
      ) : (
        <div style={{
          background: '#FEF2F2', borderRadius: 10, padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
            Supprimer ce profil ?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onDelete} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700,
              background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}>Supprimer</button>
            <button onClick={() => setConfirmDelete(false)} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12,
              background: C.bg, color: C.ink2, border: `1px solid ${C.rule}`, cursor: 'pointer', fontFamily: FONT,
            }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Carte "Nouveau profil" ─────────────────────────────────────────────── */
function NewProfileCard({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: `2px dashed ${C.rule}`, borderRadius: 16,
      padding: 20, cursor: 'pointer', fontFamily: FONT,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, minHeight: 180, transition: 'all .2s', color: C.mute,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; e.currentTarget.style.background = C.blueSoft; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.color = C.mute; e.currentTarget.style.background = 'none'; }}
    >
      <div style={{ fontSize: 32 }}>＋</div>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Nouveau profil</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Profiles — page principale
═══════════════════════════════════════════════════════════════════════════ */
export default function Profiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const { canProfile, plan, nextPlan } = usePlan();

  useEffect(() => {
    setProfiles(getProfiles());
  }, []);

  const handleDelete = (id) => {
    deleteProfile(id);
    setProfiles(getProfiles());
  };

  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: FONT }}>
      {/* Header */}
      <div style={{
        background: C.bg, borderBottom: `1px solid ${C.rule}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: C.ink2, fontWeight: 500, fontFamily: FONT,
        }}>← Retour</button>
        <div style={{ width: 1, height: 20, background: C.rule }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, flex: 1 }}>
          Mes profils personnalité
        </span>
        <button
          onClick={() => canProfile(profiles.length) ? navigate('/profils/nouveau') : null}
          title={!canProfile(profiles.length) ? `Limite de ${plan.maxProfiles} profil(s) atteinte` : ''}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: canProfile(profiles.length) ? C.blue : '#9AA0AE',
            color: '#fff', border: 'none',
            cursor: canProfile(profiles.length) ? 'pointer' : 'not-allowed',
            fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6,
          }}>
          ＋ Nouveau profil
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Bannière limite profils */}
        {!canProfile(profiles.length) && (
          <div style={{ marginBottom: 16 }}>
            <PlanBanner
              variant="limit"
              message={`Limite atteinte — le plan ${plan.label} permet ${plan.maxProfiles} profil${plan.maxProfiles > 1 ? 's' : ''}. Passez au plan ${nextPlan || 'supérieur'} pour en créer davantage.`}
              next={nextPlan || 'Personnel'}
            />
          </div>
        )}
        {/* Bannière explicative */}
        <div style={{
          background: C.blueSoft, borderRadius: 14, padding: '18px 22px',
          marginBottom: 28, display: 'flex', gap: 14, alignItems: 'flex-start',
          border: `1px solid #C7D2FE`,
        }}>
          <span style={{ fontSize: 28 }}>🧠</span>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.blue }}>
              À quoi servent les profils ?
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.ink2, lineHeight: 1.6 }}>
              Chaque profil capture ta personnalité, ton contexte et le ton que tu veux pour un type de poste.
              Sélectionne un profil dans l'éditeur et l'IA personnalise ses reformulations en conséquence —
              plus de CV génériques.
            </p>
          </div>
        </div>

        {/* Grille */}
        {profiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧠</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: '0 0 8px' }}>
              Aucun profil encore
            </h2>
            <p style={{ fontSize: 14, color: C.mute, margin: '0 0 24px' }}>
              Crée ton premier profil pour que l'IA parle avec ta voix, pas avec une voix générique.
            </p>
            <button onClick={() => navigate('/profils/nouveau')} style={{
              padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}>
              Créer mon premier profil →
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {profiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                onEdit={() => navigate(`/profils/${p.id}/editer`)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
            <NewProfileCard onClick={() => navigate('/profils/nouveau')} />
          </div>
        )}
      </div>
    </div>
  );
}
