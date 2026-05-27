import React, { useState, useEffect, useCallback } from 'react';
import { Settings, X, Lock, Eye, EyeOff, Check, KeyRound } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings.jsx';

const NAVY = '#1B4F8A';
const ORANGE = '#F4A421';
const RULE = '#e2e8f0';
const INK = '#1a1a2e';
const MUTE = '#64748b';

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid ' + RULE,
  borderRadius: 10, fontSize: 14, color: INK, background: '#fff',
  fontFamily: 'inherit', outline: 'none',
};
const btnPrimary = {
  padding: '10px 18px', background: NAVY, color: '#fff', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};
const btnGhost = {
  padding: '10px 18px', background: 'none', color: MUTE, border: '1px solid ' + RULE,
  borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const labelStyle = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
  color: MUTE, marginBottom: 6, display: 'block',
};

const PIN_RE = /^\d{4,6}$/;

export default function SettingsPanel() {
  const { apiKey, hasPin, verifyPin, savePin, saveApiKey } = useSettings();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('status'); // status | createPin | enterPin | editing
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const reset = useCallback(() => {
    setPin(''); setPinConfirm(''); setKeyInput(''); setReveal(false); setError(''); setOkMsg('');
  }, []);

  const openModal = useCallback(() => {
    reset();
    setMode(hasPin ? 'status' : 'createPin');
    setOpen(true);
  }, [hasPin, reset]);

  const close = useCallback(() => { setOpen(false); reset(); }, [reset]);

  // Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, close]);

  const handleCreatePin = async () => {
    setError('');
    if (!PIN_RE.test(pin)) { setError('Le PIN doit faire 4 à 6 chiffres.'); return; }
    if (pin !== pinConfirm) { setError('Les deux PIN ne correspondent pas.'); return; }
    await savePin(pin);
    setKeyInput(apiKey);
    setPin(''); setPinConfirm('');
    setMode('editing');
    setOkMsg('Code PIN créé. Tu peux maintenant configurer la clé.');
  };

  const handleEnterPin = async () => {
    setError('');
    const ok = await verifyPin(pin);
    if (!ok) { setError('Code PIN incorrect.'); setPin(''); return; }
    setKeyInput(apiKey);
    setPin('');
    setMode('editing');
  };

  const handleSaveKey = () => {
    saveApiKey(keyInput);
    setMode('status');
    setOkMsg('Clé API enregistrée.');
    setReveal(false);
  };

  // ── Bouton engrenage flottant discret ──
  const gear = (
    <button
      onClick={openModal}
      title="Paramètres"
      style={{
        position: 'fixed', bottom: 18, right: 18, zIndex: 1200,
        width: 38, height: 38, borderRadius: '50%',
        background: '#fff', border: '1px solid ' + RULE,
        boxShadow: '0 2px 10px rgba(0,0,0,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: MUTE, opacity: 0.55, transition: 'opacity .15s, transform .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'rotate(45deg)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = 0.55; e.currentTarget.style.transform = 'none'; }}
    >
      <Settings size={18} />
    </button>
  );

  if (!open) return gear;

  const hasKey = !!apiKey;

  return (
    <>
      {gear}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.42)', zIndex: 1300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440,
            boxShadow: '0 24px 70px rgba(0,0,0,.25)', overflow: 'hidden',
            fontFamily: 'Manrope, system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid ' + RULE }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Settings size={18} color={NAVY} />
              <span style={{ fontSize: 16, fontWeight: 800, color: INK }}>Paramètres</span>
            </div>
            <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTE, padding: 4, display: 'flex' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>Clé API Anthropic</div>

            {/* Indicateur clé serveur */}
            {import.meta.env.VITE_API_HOSTED === 'true' ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'9px 12px', marginBottom:14 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
                <span style={{ fontSize:12, color:'#15803d', lineHeight:1.4 }}>
                  <strong>Clé serveur active</strong> — la génération fonctionne sans clé perso.
                  Ta clé ci-dessous est optionnelle (priorité sur la clé serveur si renseignée).
                </span>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'9px 12px', marginBottom:14 }}>
                <span style={{ fontSize:13 }}>⚠️</span>
                <span style={{ fontSize:12, color:'#92400e', lineHeight:1.4 }}>
                  Aucune clé serveur détectée. Renseigne ta clé perso pour activer la génération IA.
                </span>
              </div>
            )}

            <p style={{ fontSize: 12, color: MUTE, lineHeight: 1.5, marginBottom: 16 }}>
              Clé personnelle protégée par code PIN — prioritaire sur la clé serveur.
            </p>

            {/* ── CRÉATION DU PIN (1ère fois) ── */}
            {mode === 'createPin' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                  <KeyRound size={16} color={ORANGE} />
                  <span style={{ fontSize: 12, color: '#92400e' }}>Première configuration : crée un code PIN (4 à 6 chiffres).</span>
                </div>
                <label style={labelStyle}>Nouveau PIN</label>
                <input type="password" inputMode="numeric" value={pin} maxLength={6}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••" style={{ ...inputStyle, marginBottom: 12, letterSpacing: 4 }} autoFocus />
                <label style={labelStyle}>Confirmer le PIN</label>
                <input type="password" inputMode="numeric" value={pinConfirm} maxLength={6}
                  onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••" style={{ ...inputStyle, letterSpacing: 4 }} />
                {error && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 10 }}>{error}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                  <button style={btnGhost} onClick={close}>Annuler</button>
                  <button style={btnPrimary} onClick={handleCreatePin}>Créer le PIN</button>
                </div>
              </>
            )}

            {/* ── STATUT (PIN existe, clé verrouillée) ── */}
            {mode === 'status' && (
              <>
                <label style={labelStyle}>Clé actuelle</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: '1px solid ' + RULE, borderRadius: 10, marginBottom: 16 }}>
                  <Lock size={15} color={MUTE} />
                  <span style={{ flex: 1, fontSize: 14, color: hasKey ? INK : MUTE, fontFamily: 'monospace', letterSpacing: 2 }}>
                    {hasKey ? '••••••••••••' : 'Aucune clé configurée'}
                  </span>
                  {hasKey && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} title="Clé présente" />}
                </div>
                {okMsg && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 12, marginBottom: 12 }}><Check size={14} />{okMsg}</div>}
                <button style={{ ...btnPrimary, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => { setError(''); setMode('enterPin'); }}>
                  <Lock size={15} /> Modifier la clé (PIN requis)
                </button>
              </>
            )}

            {/* ── SAISIE DU PIN ── */}
            {mode === 'enterPin' && (
              <>
                <label style={labelStyle}>Entre ton code PIN</label>
                <input type="password" inputMode="numeric" value={pin} maxLength={6}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') handleEnterPin(); }}
                  placeholder="••••" style={{ ...inputStyle, letterSpacing: 4 }} autoFocus />
                {error && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 10 }}>{error}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                  <button style={btnGhost} onClick={() => { setMode('status'); setError(''); setPin(''); }}>Retour</button>
                  <button style={btnPrimary} onClick={handleEnterPin}>Déverrouiller</button>
                </div>
              </>
            )}

            {/* ── ÉDITION DE LA CLÉ (déverrouillé) ── */}
            {mode === 'editing' && (
              <>
                <label style={labelStyle}>Clé API Anthropic</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <input type={reveal ? 'text' : 'password'} value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="sk-ant-…" style={{ ...inputStyle, paddingRight: 38 }} autoFocus />
                  <button onClick={() => setReveal(v => !v)} title={reveal ? 'Masquer' : 'Afficher'}
                    style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: MUTE, display: 'flex' }}>
                    {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: MUTE, lineHeight: 1.5, marginBottom: 16 }}>
                  Laisse vide pour supprimer la clé (mode démo / données fictives).
                  Obtenir une clé : <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: NAVY, fontWeight: 600 }}>console.anthropic.com</a>
                </p>
                {okMsg && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 12, marginBottom: 12 }}><Check size={14} />{okMsg}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button style={btnGhost} onClick={() => { setMode(hasPin ? 'status' : 'status'); reset(); }}>Annuler</button>
                  <button style={btnPrimary} onClick={handleSaveKey}>Enregistrer la clé</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
