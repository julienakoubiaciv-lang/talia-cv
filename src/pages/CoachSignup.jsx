/**
 * CoachSignup — Créer son espace coach (`/coach`).
 *
 * Jusqu'ici, ouvrir un espace d'encadrement passait par une création manuelle
 * en base : un coach indépendant ne pouvait pas démarrer seul. Cette page crée
 * l'organisation (type « cowork ») et inscrit le coach comme direction, puis
 * l'emmène directement sur son tableau de bord pour inviter ses accompagnés.
 *
 * Un coach déjà rattaché à un espace est renvoyé vers /encadrement plutôt que
 * d'en créer un second.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, FONT, DISPLAY, alpha } from '@/lib/gameTheme';
import ModuleTopBar from '@/components/ModuleTopBar';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useEncadrant } from '@/hooks/useEncadrant';
import { createCoachOrg } from '@/lib/orgAccess';

/** Ce que le coach doit faire quand la création échoue. */
const ERRORS = {
  name_required:     'Donne un nom à ton espace.',
  name_too_long:     'Ce nom est trop long (80 caractères maximum).',
  not_authenticated: 'Connecte-toi pour créer ton espace.',
  limit_reached:     'Tu as déjà créé plusieurs espaces. Écris-nous pour en ouvrir un de plus.',
  offline:           'Connexion indisponible. Réessaie dans un instant.',
  server_error:      "L'espace n'a pas pu être créé. Réessaie dans un instant.",
};

const ETAPES = [
  { t: 'Tu crées ton espace', d: 'Il porte ton nom ou celui de ton activité.' },
  { t: 'Tu invites tes accompagnés', d: 'Un lien à partager : ils te rejoignent sans payer.' },
  { t: 'Tu suis leur progression', d: 'CV, entretiens, candidatures — et tu relances qui décroche.' },
];

export default function CoachSignup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEncadrant = useEncadrant();

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Déjà à la tête d'un espace : inutile d'en ouvrir un second.
  useEffect(() => {
    if (isEncadrant) navigate('/encadrement', { replace: true });
  }, [isEncadrant, navigate]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError('');
    const res = await createCoachOrg(name);
    setBusy(false);
    if (res?.ok) { navigate('/encadrement', { replace: true }); return; }
    setError(ERRORS[res?.reason] || ERRORS.server_error);
  };

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ModuleTopBar label="Espace coach" />

        <span style={S.eyebrow}>Coach indépendant</span>
        <h1 style={S.h1}>Ouvre ton espace d'accompagnement</h1>
        <p style={S.lede}>
          Suis tes accompagnés au même endroit : où ils en sont, ce qu'ils ont travaillé,
          qui a besoin d'un coup de pouce. Gratuit jusqu'à 5 personnes.
        </p>

        <form style={S.card} onSubmit={submit}>
          <label style={S.label} htmlFor="coach-org-name">Nom de ton espace</label>
          <input
            id="coach-org-name"
            style={{ ...S.input, ...(error ? S.inputErr : {}) }}
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
            placeholder="Sophie Martin · Coaching emploi"
            maxLength={80}
            autoFocus
            aria-invalid={!!error}
            aria-describedby={error ? 'coach-org-error' : undefined}
          />
          <p style={S.hint}>C'est ce que verront tes accompagnés quand tu les inviteras.</p>

          {error && <div id="coach-org-error" role="alert" style={S.error}>{error}</div>}

          <button type="submit" style={{ ...S.cta, ...(!name.trim() || busy ? S.ctaOff : {}) }} disabled={!name.trim() || busy}>
            {busy ? 'Création…' : 'Créer mon espace'}
          </button>

          {!user && (
            <p style={S.hint}>
              Tu seras invité à te connecter pour finaliser — ton espace est conservé.
            </p>
          )}
        </form>

        <div style={S.steps}>
          {ETAPES.map((e, i) => (
            <div key={e.t} style={S.step}>
              <span style={S.stepNum}>{i + 1}</span>
              <div>
                <div style={S.stepT}>{e.t}</div>
                <div style={S.stepD}>{e.d}</div>
              </div>
            </div>
          ))}
        </div>

        <p style={S.foot}>
          Vous êtes une école ou un CFA&nbsp;?{' '}
          <button style={S.link} onClick={() => navigate('/pricing')}>Voir l'offre École</button>
        </p>
      </div>
    </div>
  );
}

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 560, margin: '0 auto' },

  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontFamily: DISPLAY, fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 10px' },
  lede: { fontSize: 15.5, color: C.ink2, lineHeight: 1.6, margin: '0 0 22px' },

  card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: '22px', boxShadow: 'var(--altio-shadow-card)' },
  label: { display: 'block', fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, marginBottom: 8 },
  input: { width: '100%', boxSizing: 'border-box', background: C.bg, color: C.ink, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: '13px 14px', fontSize: 15, fontFamily: FONT, outline: 'none' },
  inputErr: { borderColor: C.red },
  hint: { fontSize: 12.5, color: C.mute, lineHeight: 1.5, margin: '8px 0 0' },
  error: { marginTop: 12, background: alpha(C.red, 10), border: `1px solid ${alpha(C.red, 30)}`, color: C.red, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, fontWeight: 600 },

  cta: { width: '100%', marginTop: 18, background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: 'var(--altio-shadow-cta)' },
  ctaOff: { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' },

  steps: { display: 'grid', gap: 10, marginTop: 22 },
  step: { display: 'flex', gap: 12, alignItems: 'flex-start', background: C.card2, border: `1px solid ${C.line2}`, borderRadius: 14, padding: '13px 15px' },
  stepNum: { flexShrink: 0, width: 24, height: 24, borderRadius: 9, background: C.blueSoft, color: C.blue, display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 800, fontFamily: DISPLAY },
  stepT: { fontSize: 14.5, fontWeight: 700, color: C.ink },
  stepD: { fontSize: 13, color: C.ink2, marginTop: 2, lineHeight: 1.5 },

  foot: { fontSize: 13, color: C.mute, marginTop: 24, textAlign: 'center' },
  link: { background: 'none', border: 'none', color: C.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, padding: 0, textDecoration: 'underline' },
};
