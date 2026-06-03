/**
 * Auth — Page connexion / inscription
 *
 * Tabs : Connexion | Inscription
 * Design cohérent avec le reste de l'app (inline styles, palette Talia).
 * Redirige vers / après connexion réussie.
 */
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabaseReady } from '@/lib/supabase';

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
  red:     '#DC2626',
  redSoft: '#FEF2F2',
  green:   '#16A34A',
  greenSoft: '#F0FDF4',
};
const FONT = "'Manrope', system-ui, sans-serif";

function Input({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '10px 13px', borderRadius: 9, fontSize: 13, fontFamily: FONT,
          border: `1.5px solid ${focused ? C.blue : C.rule}`,
          outline: 'none', color: C.ink, background: C.bg,
          transition: 'border-color .15s',
        }}
      />
    </div>
  );
}

function SubmitBtn({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', padding: '11px 0', borderRadius: 9, fontSize: 13,
        fontWeight: 700, fontFamily: FONT, cursor: loading ? 'not-allowed' : 'pointer',
        background: loading ? C.mute : C.blue, color: '#fff', border: 'none',
        transition: 'background .15s', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8,
      }}
    >
      {loading && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ animation: 'spin .7s linear infinite' }}>
          <path d="M21 12A9 9 0 1112 3" strokeLinecap="round"/>
        </svg>
      )}
      {children}
    </button>
  );
}

export default function Auth() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const { signIn, signUp } = useAuth();

  const defaultTab = params.get('tab') === 'inscription' ? 'inscription' : 'connexion';
  const [tab,      setTab]      = useState(defaultTab);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim() || !password.trim()) {
      setError('Merci de remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'connexion') {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password);
        setSuccess('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.');
        setTab('connexion');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials'))
        setError('Email ou mot de passe incorrect.');
      else if (msg.includes('Email not confirmed'))
        setError('Confirme ton email avant de te connecter.');
      else if (msg.includes('User already registered'))
        setError('Un compte existe déjà avec cet email.');
      else
        setError(msg || 'Une erreur est survenue. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  if (!supabaseReady) {
    return (
      <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.rule}`, padding: '32px 36px', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 8px' }}>Supabase non configuré</h2>
          <p style={{ fontSize: 13, color: C.mute, margin: '0 0 20px' }}>
            Remplis les variables <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> dans <code>.env.local</code>.
          </p>
          <button onClick={() => navigate('/')} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: '24px 16px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo / titre */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: C.blue,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 12, boxShadow: '0 4px 16px rgba(21,57,183,0.25)',
          }}>📄</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>Altio CV</div>
          <div style={{ fontSize: 13, color: C.mute, marginTop: 2 }}>
            {tab === 'connexion' ? 'Connecte-toi à ton compte' : 'Crée ton compte gratuitement'}
          </div>
        </div>

        {/* Card */}
        <div style={{ background: C.bg, borderRadius: 18, border: `1px solid ${C.rule}`, padding: '28px 28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: C.surface, borderRadius: 10, padding: 3 }}>
            {[{ id: 'connexion', label: 'Connexion' }, { id: 'inscription', label: 'Inscription' }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: tab === t.id ? C.bg : 'transparent',
                  color: tab === t.id ? C.blue : C.mute,
                  border: tab === t.id ? `1px solid ${C.rule}` : '1px solid transparent',
                  cursor: 'pointer', fontFamily: FONT, transition: 'all .15s',
                  boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {error && (
            <div style={{ background: C.redSoft, border: `1px solid #FCA5A5`, borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: C.red, fontWeight: 500 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: C.greenSoft, border: `1px solid #6EE7B7`, borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: C.green, fontWeight: 500 }}>
              {success}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="toi@exemple.com"
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={tab === 'inscription' ? 'Min. 6 caractères' : '••••••••'}
              autoComplete={tab === 'connexion' ? 'current-password' : 'new-password'}
            />
            <div style={{ marginTop: 4 }}>
              <SubmitBtn loading={loading}>
                {tab === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
              </SubmitBtn>
            </div>
          </form>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontSize: 11, color: C.mute, fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
          </div>

          {/* Continuer sans compte */}
          <button onClick={() => navigate('/')}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: C.surface, color: C.ink2, border: `1px solid ${C.rule}`,
              cursor: 'pointer', fontFamily: FONT, transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.rule}
          >
            Continuer sans compte
          </button>
        </div>

        {/* Note anonyme */}
        <p style={{ textAlign: 'center', fontSize: 11, color: C.mute, marginTop: 16, lineHeight: 1.6 }}>
          Sans compte, tes CVs sont sauvegardés localement sur cet appareil.<br />
          Un compte te permet de les retrouver partout.
        </p>
      </div>
    </div>
  );
}
