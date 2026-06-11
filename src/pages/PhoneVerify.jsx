/**
 * PhoneVerify — Barrière de vérification téléphone (OTP SMS)
 *
 * Affichée après connexion tant que le compte n'a pas de téléphone confirmé.
 * Étape 1 : saisie du numéro → envoi du code (updateUser({ phone })).
 * Étape 2 : saisie du code reçu → vérification (verifyOtp type 'phone_change').
 */
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const C = {
  blue:    '#1539B7',
  ink:     '#0B1020',
  ink2:    '#3A4156',
  mute:    '#9AA0AE',
  rule:    '#ECEDF1',
  surface: '#F7F8FA',
  bg:      '#FFFFFF',
  red:     '#DC2626',
  redSoft: '#FEF2F2',
};
const FONT = "'Manrope', system-ui, sans-serif";

function Input({ label, type = 'text', value, onChange, placeholder, autoComplete, inputMode }) {
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
        inputMode={inputMode}
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

export default function PhoneVerify() {
  const { sendPhoneOtp, verifyPhoneOtp, signOut } = useAuth();

  const [step,    setStep]    = useState('phone'); // 'phone' | 'code'
  const [phone,   setPhone]   = useState('');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Normalise vers le format E.164 attendu par Supabase (+33...).
  const normalizePhone = (raw) => {
    let p = raw.replace(/[\s.()-]/g, '');
    if (p.startsWith('00')) p = '+' + p.slice(2);
    return p;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    const p = normalizePhone(phone);
    if (!/^\+[1-9]\d{6,14}$/.test(p)) {
      setError('Entre un numéro au format international, ex : +33 6 12 34 56 78.');
      return;
    }
    setLoading(true);
    try {
      await sendPhoneOtp(p);
      setPhone(p);
      setStep('code');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists'))
        setError('Ce numéro est déjà lié à un autre compte.');
      else
        setError(msg || 'Impossible d’envoyer le code. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError('Le code doit contenir uniquement des chiffres.');
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, code.trim());
      // La barrière se lève automatiquement (phone_confirmed_at posé).
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('expired'))
        setError('Le code a expiré. Renvoie un nouveau code.');
      else if (msg.includes('invalid') || msg.includes('Token'))
        setError('Code incorrect. Vérifie et réessaie.');
      else
        setError(msg || 'Vérification échouée. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: '24px 16px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: C.blue,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 12, boxShadow: '0 4px 16px rgba(21,57,183,0.25)',
          }}>📱</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>Vérifie ton numéro</div>
          <div style={{ fontSize: 13, color: C.mute, marginTop: 2 }}>
            {step === 'phone'
              ? 'Une dernière étape pour sécuriser ton compte.'
              : `Code envoyé au ${phone}`}
          </div>
        </div>

        <div style={{ background: C.bg, borderRadius: 18, border: `1px solid ${C.rule}`, padding: '28px 28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {error && (
            <div style={{ background: C.redSoft, border: `1px solid #FCA5A5`, borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: C.red, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Numéro de téléphone"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="+33 6 12 34 56 78"
                autoComplete="tel"
                inputMode="tel"
              />
              <div style={{ marginTop: 4 }}>
                <SubmitBtn loading={loading}>Envoyer le code</SubmitBtn>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Code de vérification"
                type="text"
                value={code}
                onChange={setCode}
                placeholder="123456"
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              <div style={{ marginTop: 4 }}>
                <SubmitBtn loading={loading}>Vérifier</SubmitBtn>
              </div>
              <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                ← Changer de numéro
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontSize: 11, color: C.mute, fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
          </div>

          <button onClick={() => signOut()}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: C.surface, color: C.ink2, border: `1px solid ${C.rule}`,
              cursor: 'pointer', fontFamily: FONT,
            }}>
            Se déconnecter
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.mute, marginTop: 16, lineHeight: 1.6 }}>
          Nous utilisons ton numéro uniquement pour vérifier ton identité<br />
          et limiter les abus. Il ne sera jamais partagé.
        </p>
      </div>
    </div>
  );
}
