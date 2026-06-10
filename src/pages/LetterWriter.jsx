/**
 * LetterWriter — « Lettre de motivation IA » (PRO).
 *
 * Génère une lettre / email / message LinkedIn personnalisé(e) à partir du CV
 * et de l'offre visée. Résultat éditable, copiable et téléchargeable.
 * Réutilise claude-proxy (action 'coach') ; gating PRO via usePlan.
 */
import React, { useState, useMemo } from 'react';
import { C, FONT, alpha } from '@/lib/gameTheme';
import ModuleTopBar from '@/components/ModuleTopBar';
import { useNavigate } from 'react-router-dom';
import {
  generateCoverLetter, markLetterGenerated, LETTER_FORMATS, LETTER_TONES, MESSAGE_TYPES,
} from '@/lib/coverLetter';
import { listPostesBySector } from '@/lib/jobIntel';
import { QuotaError } from '@/lib/claudeClient';
import { getHist } from '@/lib/cvData';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useEnergy } from '@/hooks/useEnergy';
import { EnergyError } from '@/lib/aiEnergy';
import EnergyBar from '@/components/EnergyBar';
import { track } from '@/lib/monitoring';


export default function LetterWriter() {
  const navigate = useNavigate();
  const { proLocked: isFree } = useEntitlements();
  const energy = useEnergy();
  const latest = useMemo(() => { try { return getHist()[0] || null; } catch { return null; } }, []);
  const cvData = latest?.data || null;
  const postesBySector = useMemo(() => { try { return listPostesBySector(); } catch { return {}; } }, []);

  const [messageType, setMessageType] = useState('motivation'); // motivation | relance | remerciement
  const [extra, setExtra]   = useState('');
  const [targetMode, setTargetMode] = useState('annonce'); // 'annonce' | 'poste'
  const [offer, setOffer]   = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [format, setFormat] = useState('lettre');
  const [tone, setTone]     = useState('equilibre');
  const mt = MESSAGE_TYPES[messageType];
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [subject, setSubject] = useState('');
  const [text, setText]     = useState('');
  const [copied, setCopied] = useState(false);

  const hasResult = !!text;
  const targetReady = targetMode === 'annonce' ? true : !!targetRole;
  const canGenerate = !!cvData && targetReady && !loading;

  async function run() {
    if (!canGenerate) return;
    setLoading(true); setError(null); setCopied(false);
    try {
      energy.ensure();
      const common = { cvData, company, format, tone, messageType, extra };
      const payload = targetMode === 'annonce'
        ? { ...common, offerText: offer, roleTitle }
        : { ...common, targetRole };
      const letter = await generateCoverLetter(payload);
      energy.spend();
      setSubject(letter.subject || '');
      setText(letter.text);
      markLetterGenerated();
      track('cover_letter_generated', { messageType, format, tone, targetMode, hasOffer: !!offer.trim(), targetRole });
    } catch (err) {
      if (err instanceof EnergyError) {
        setError({ type: 'energy', message: err.message });
      } else if (err instanceof QuotaError) {
        setError({ type: 'quota', message: 'Quota de générations atteint. Reviens plus tard ou passe à un plan supérieur.' });
      } else {
        setError({ type: 'error', message: err?.message || 'La génération a échoué. Réessaie.' });
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    const full = (subject ? `Objet : ${subject}\n\n` : '') + text;
    try { await navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard indispo */ }
  }

  function download() {
    const full = (subject ? `Objet : ${subject}\n\n` : '') + text;
    const blob = new Blob([full], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lettre-motivation-${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ModuleTopBar label="Candidature" />

        <div style={S.header}>
          <span style={S.eyebrow}>Kit de candidature · PRO ✨</span>
          <h1 style={S.h1}>Tes messages de candidature</h1>
          <p style={S.lead}>
            Lettre de motivation, mail de relance ou de remerciement — généré à partir
            de ton CV et de l'offre. À toi de relire et d'ajuster.
          </p>
        </div>

        {isFree ? (
          <div style={S.upsell}>
            <div style={S.upsellBadge}>PRO</div>
            <div style={S.upsellTitle}>🔓 Réservé aux plans Personnel & Business</div>
            <div style={S.upsellText}>
              La rédaction assistée s'appuie sur ton CV. Passe à une offre supérieure
              pour générer tes candidatures en quelques secondes.
            </div>
            <button style={S.cta} onClick={() => navigate('/pricing')}>Voir les offres</button>
          </div>
        ) : (
          <>
            {/* CV source */}
            <div style={S.block}>
              <div style={S.blockLabel}>CV UTILISÉ</div>
              {cvData ? (
                <div style={S.cvRow}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.cvName}>{latest.name || 'Mon CV'}</div>
                    <div style={S.cvMeta}>Dernier CV généré{latest.date ? ` · ${latest.date}` : ''}</div>
                  </div>
                </div>
              ) : (
                <div style={S.empty}>Aucun CV trouvé. Génère d'abord un CV pour personnaliser ta lettre.</div>
              )}
            </div>

            <div style={{ marginTop: 12 }}><EnergyBar variant="card" /></div>

            {/* Type de message */}
            <div style={S.sectionLabel}>Type de message</div>
            <div style={S.choiceRow}>
              {Object.entries(MESSAGE_TYPES).map(([id, m]) => (
                <button key={id} onClick={() => setMessageType(id)}
                  style={{ ...S.choice, ...(messageType === id ? S.choiceActive : {}) }}>
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <span style={S.choiceLabel}>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Format — seulement pour la motivation (relance/remerciement = email) */}
            {!mt.forceEmail && (
              <>
                <div style={S.sectionLabel}>Format</div>
                <div style={S.choiceRow}>
                  {Object.entries(LETTER_FORMATS).map(([id, f]) => (
                    <button key={id} onClick={() => setFormat(id)}
                      style={{ ...S.choice, ...(format === id ? S.choiceActive : {}) }}>
                      <span style={{ fontSize: 18 }}>{f.emoji}</span>
                      <span style={S.choiceLabel}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Ton */}
            <div style={S.sectionLabel}>Ton</div>
            <div style={S.choiceRow}>
              {Object.entries(LETTER_TONES).map(([id, t]) => (
                <button key={id} onClick={() => setTone(id)}
                  style={{ ...S.choice, ...(tone === id ? S.choiceActive : {}) }}>
                  <span style={S.choiceLabel}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Ciblage de la lettre */}
            <div style={S.sectionLabel}>Cibler la lettre</div>
            <div style={S.choiceRow}>
              <button onClick={() => setTargetMode('annonce')}
                style={{ ...S.choice, ...(targetMode === 'annonce' ? S.choiceActive : {}) }}>
                <span style={{ fontSize: 18 }}>📌</span>
                <span style={S.choiceLabel}>Annonce précise</span>
              </button>
              <button onClick={() => setTargetMode('poste')}
                style={{ ...S.choice, ...(targetMode === 'poste' ? S.choiceActive : {}) }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <span style={S.choiceLabel}>Type de poste</span>
              </button>
            </div>

            <input
              style={{ ...S.subjectInput, marginTop: 12 }} value={company} disabled={loading}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Entreprise visée (optionnel)"
            />

            {targetMode === 'annonce' ? (
              <>
                <input
                  style={{ ...S.subjectInput, marginTop: 10 }} value={roleTitle} disabled={loading}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Intitulé du poste (optionnel)"
                />
                <textarea
                  style={{ ...S.textarea, marginTop: 10 }} rows={5} value={offer} disabled={loading}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="Colle l'annonce (missions, compétences attendues)…"
                />
              </>
            ) : (
              <>
                <select
                  style={{ ...S.subjectInput, marginTop: 10, appearance: 'auto' }} value={targetRole} disabled={loading}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="">— Choisis un type de poste —</option>
                  {Object.entries(postesBySector).map(([sector, postes]) => (
                    <optgroup key={sector} label={sector}>
                      {postes.map((p) => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  ))}
                </select>
                <p style={S.hint}>La lettre ciblera les attentes typiques de ce métier, à partir de ton CV.</p>
              </>
            )}

            {mt.extraLabel && (
              <>
                <div style={S.sectionLabel}>{mt.extraLabel}</div>
                <textarea
                  style={S.textarea} rows={2} value={extra} disabled={loading}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Quelques mots de contexte pour personnaliser le message…"
                />
              </>
            )}

            {error && (() => {
              const info = error.type === 'quota' || error.type === 'energy';
              const bg = error.type === 'energy' ? C.amberSoft : info ? C.blueSoft : C.redSoft;
              const fg = error.type === 'energy' ? C.amber : info ? C.blue : C.red;
              const icon = error.type === 'energy' ? '⚡ ' : error.type === 'quota' ? '⏳ ' : '⚠️ ';
              return (
                <div style={{ ...S.err, background: bg, color: fg }}>
                  <span>{icon}{error.message}</span>
                  {info && <button style={S.errBtn} onClick={() => navigate('/pricing')}>Voir les offres</button>}
                </div>
              );
            })()}

            <button
              style={{ ...S.cta, opacity: canGenerate ? 1 : 0.6, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
              onClick={run} disabled={!canGenerate}>
              {loading ? '✨ Rédaction en cours…' : hasResult ? '✨ Régénérer' : `✨ Générer mon message · ${mt.label}`}
            </button>

            {/* Résultat */}
            {hasResult && (
              <div style={S.resultBlock}>
                {(mt.forceEmail || format === 'email') && (
                  <>
                    <div style={S.sectionLabel}>Objet</div>
                    <input style={S.subjectInput} value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </>
                )}
                <div style={S.sectionLabel}>Ton message (éditable)</div>
                <textarea style={S.resultArea} rows={14} value={text} onChange={(e) => setText(e.target.value)} />
                <div style={S.resultBtns}>
                  <button style={S.actionBtn} onClick={copy}>{copied ? '✓ Copié !' : '📋 Copier'}</button>
                  <button style={S.actionGhost} onClick={download}>⬇ Télécharger (.txt)</button>
                </div>
                <p style={S.hint}>Relis et personnalise toujours avant d'envoyer : l'IA propose, tu valides.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  shell: { minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, padding: '24px 16px 60px' },
  wrap: { maxWidth: 600, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },

  header: { marginBottom: 18 },
  eyebrow: { display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: C.blue, marginBottom: 10 },
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 12px' },
  lead: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0, maxWidth: 480 },

  sectionLabel: { fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: C.mute, margin: '18px 0 10px' },

  block: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' },
  blockLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, color: C.mute, marginBottom: 8 },
  cvRow: { display: 'flex', alignItems: 'center', gap: 10 },
  cvName: { fontSize: 14.5, fontWeight: 700, color: C.ink },
  cvMeta: { fontSize: 12, color: C.mute, marginTop: 1 },
  empty: { fontSize: 13, color: C.ink2, lineHeight: 1.5 },

  choiceRow: { display: 'flex', gap: 8 },
  choice: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '11px 8px', cursor: 'pointer', fontFamily: FONT, color: C.ink },
  choiceActive: { borderColor: C.blue, background: C.blueSoft, boxShadow: '0 0 0 3px rgba(21,57,183,.08)' },
  choiceLabel: { fontSize: 13, fontWeight: 700 },

  textarea: { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: FONT, color: C.ink, lineHeight: 1.5, resize: 'vertical', marginBottom: 14, outline: 'none' },

  err: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', fontSize: 13, fontWeight: 600, borderRadius: 12, padding: '11px 14px', marginBottom: 12, lineHeight: 1.45 },
  errBtn: { flexShrink: 0, background: C.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },

  cta: { width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.22)' },

  resultBlock: { marginTop: 8 },
  subjectInput: { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, fontWeight: 600, fontFamily: FONT, color: C.ink, outline: 'none' },
  resultArea: { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${alpha(C.green, 34)}`, background: C.card2, borderRadius: 12, padding: '14px', fontSize: 14, fontFamily: FONT, color: C.ink, lineHeight: 1.6, resize: 'vertical', outline: 'none' },
  resultBtns: { display: 'flex', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, background: C.green, color: '#fff', border: 'none', borderRadius: 11, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  actionGhost: { flex: 1, background: C.card, color: C.ink2, border: `1px solid ${C.line}`, borderRadius: 11, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT },
  hint: { fontSize: 12, color: C.mute, textAlign: 'center', marginTop: 10 },

  upsell: { position: 'relative', background: C.ink, color: '#fff', borderRadius: 16, padding: '22px 20px', textAlign: 'left' },
  upsellBadge: { position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, background: C.blueSoft, color: C.blue, padding: '3px 9px', borderRadius: 6 },
  upsellTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  upsellText: { fontSize: 13, color: '#B9C2DA', lineHeight: 1.55, marginBottom: 16 },
};
