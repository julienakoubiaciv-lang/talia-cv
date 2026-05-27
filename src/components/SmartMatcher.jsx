import React, { useState, useMemo, useCallback } from 'react';
import { analyzeMatch, analyzeMatchSemantic } from '@/lib/smartMatcher';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';

export function SmartMatcher({ cvData }) {
  const { t } = useTheme();
  const { apiKey } = useSettings();

  const [offerText,   setOfferText]   = useState('');
  const [expanded,    setExpanded]    = useState(true);
  const [aiResult,    setAiResult]    = useState(null);   // résultat sémantique Claude
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState('');

  // Analyse locale — synchrone, mise à jour au fil de la frappe
  const local = useMemo(
    () => analyzeMatch(offerText, cvData),
    [offerText, cvData],
  );

  // Réinitialise le résultat IA quand l'offre change
  const handleOfferChange = useCallback((e) => {
    setOfferText(e.target.value);
    setAiResult(null);
    setAiError('');
  }, []);

  // Appel Claude pour analyse sémantique
  const handleAiAnalysis = useCallback(async () => {
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const result = await analyzeMatchSemantic(offerText, cvData, apiKey);
      setAiResult(result);
    } catch (err) {
      const msg = err.message || '';
      if (msg === 'no_key') {
        setAiError("Renseigne une clé API dans les paramètres pour activer l’analyse IA.");
      } else if (msg.startsWith('api_error')) {
        setAiError('Erreur API — vérifie ta clé Anthropic.');
      } else {
        setAiError('Analyse impossible. Réessaie dans un instant.');
      }
    } finally {
      setAiLoading(false);
    }
  }, [offerText, cvData, apiKey]);

  // Le résultat affiché : IA si disponible, sinon local
  const result = aiResult || local;
  const isAiMode = Boolean(aiResult);

  const scoreColor = result.score >= 70 ? t.success
    : result.score >= 40 ? t.warning
    : result.score > 0   ? t.error
    : t.textMuted;

  // Clé API disponible (perso ou serveur)
  const hasServerKey = typeof import.meta !== 'undefined'
    && import.meta.env?.VITE_API_HOSTED === 'true';
  const canUseAI = (apiKey?.trim().length > 0) || hasServerKey;

  return (
    <div style={{
      background: t.surface,
      borderRadius: 12,
      overflow: 'hidden',
      border: `1px solid ${t.border}`,
      marginBottom: 12,
    }}>
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '11px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${t.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 15 }}>🎯</span>
          <span style={{ fontWeight: 700, fontSize: 12, color: t.textPrimary }}>
            Smart Matcher
          </span>
          {result.score > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 10, background: scoreColor + '22', color: scoreColor,
            }}>
              {result.score}%
            </span>
          )}
          {isAiMode && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px',
              borderRadius: 10, background: '#8b5cf622', color: '#8b5cf6',
              letterSpacing: '.04em',
            }}>✦ IA</span>
          )}
        </div>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={t.textMuted} strokeWidth="2.5"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ padding: '12px 14px' }}>

          {/* Textarea offre */}
          <textarea
            value={offerText}
            onChange={handleOfferChange}
            placeholder="Collez le texte d'une offre d'emploi…"
            rows={4}
            style={{
              width: '100%', padding: '8px 10px',
              border: `1.5px solid ${t.border}`,
              borderRadius: 8,
              background: t.surfaceAlt,
              color: t.textPrimary,
              fontSize: 11.5,
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              marginBottom: 8,
              transition: 'border-color .15s',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = t.navy}
            onBlur={e  => e.target.style.borderColor = t.border}
          />

          {/* Bouton Analyse IA — visible si assez de texte */}
          {offerText.trim().length >= 30 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {canUseAI ? (
                <button
                  onClick={handleAiAnalysis}
                  disabled={aiLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px', borderRadius: 8, fontSize: 11,
                    fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer',
                    border: '1px solid #8b5cf644',
                    background: aiLoading ? '#f3f4f6' : '#f5f3ff',
                    color: aiLoading ? t.textMuted : '#7c3aed',
                    transition: 'all .15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!aiLoading) e.currentTarget.style.background = '#ede9fe'; }}
                  onMouseLeave={e => { if (!aiLoading) e.currentTarget.style.background = '#f5f3ff'; }}
                >
                  {aiLoading
                    ? <><Spinner /> Analyse en cours…</>
                    : <><span style={{ fontSize: 12 }}>✦</span> Analyse sémantique IA</>
                  }
                </button>
              ) : (
                <span style={{ fontSize: 10, color: t.textMuted, fontStyle: 'italic' }}>
                  Analyse IA disponible avec une clé API dans les paramètres
                </span>
              )}
              {aiResult && !aiLoading && (
                <button
                  onClick={() => { setAiResult(null); setAiError(''); }}
                  style={{
                    fontSize: 10, color: t.textMuted, background: 'none',
                    border: 'none', cursor: 'pointer', padding: '2px 6px',
                    borderRadius: 6, fontFamily: 'inherit',
                  }}
                >
                  ↺ Local
                </button>
              )}
            </div>
          )}

          {/* Erreur IA */}
          {aiError && (
            <div style={{
              fontSize: 11, color: t.error, background: t.matchMissing,
              borderRadius: 7, padding: '6px 10px', marginBottom: 8,
            }}>
              {aiError}
            </div>
          )}

          {/* Résultats */}
          {result.total > 0 && (
            <>
              {/* Score barre */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, color: t.textSecondary }}>
                  {result.present.length}/{result.total} mots-clés
                  {isAiMode && aiResult?.semantic && Object.keys(aiResult.semantic).length > 0 && (
                    <span style={{ color: '#8b5cf6', marginLeft: 4 }}>
                      (dont {Object.keys(aiResult.semantic).length} sémantiques)
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor }}>
                  {result.score}%
                </span>
              </div>
              <div style={{
                height: 5, background: t.border, borderRadius: 3,
                overflow: 'hidden', marginBottom: 12,
              }}>
                <div style={{
                  height: '100%', width: `${result.score}%`,
                  background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
                  borderRadius: 3,
                  transition: 'width .6s ease',
                }} />
              </div>

              {/* Présents */}
              {result.present.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{
                    fontSize: 9.5, fontWeight: 700, color: t.success,
                    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5,
                  }}>
                    ✓ Présents ({result.present.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {result.present.map(kw => {
                      const isSemantic = isAiMode && aiResult?.semantic?.[kw];
                      return (
                        <span
                          key={kw}
                          title={isSemantic ? `Correspondance sémantique : ${aiResult.semantic[kw]}` : undefined}
                          style={{
                            padding: '2px 7px', borderRadius: 10, fontSize: 10.5,
                            fontWeight: 500, cursor: isSemantic ? 'help' : 'default',
                            background: isSemantic ? '#ede9fe' : t.matchPresent,
                            color:      isSemantic ? '#7c3aed' : t.success,
                            border:     isSemantic ? '1px solid #c4b5fd44' : 'none',
                          }}
                        >
                          {isSemantic && <span style={{ marginRight: 3, fontSize: 9 }}>✦</span>}
                          {kw}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manquants */}
              {result.missing.length > 0 && (
                <div style={{ marginBottom: isAiMode && aiResult?.explanation ? 10 : 0 }}>
                  <div style={{
                    fontSize: 9.5, fontWeight: 700, color: t.error,
                    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5,
                  }}>
                    ✗ À ajouter ({result.missing.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {result.missing.map(kw => (
                      <span
                        key={kw}
                        title="Cliquer pour copier"
                        onClick={() => navigator.clipboard?.writeText(kw)}
                        style={{
                          padding: '2px 7px', borderRadius: 10, fontSize: 10.5,
                          background: t.matchMissing, color: t.error, fontWeight: 500,
                          cursor: 'pointer', transition: 'opacity .15s',
                        }}
                      >{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conseil IA */}
              {isAiMode && aiResult?.explanation && (
                <div style={{
                  marginTop: 10, padding: '8px 10px',
                  background: '#f5f3ff', borderRadius: 8,
                  border: '1px solid #c4b5fd44',
                  fontSize: 11, color: '#6d28d9', lineHeight: 1.5,
                }}>
                  <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: '.04em', marginRight: 6 }}>
                    ✦ CONSEIL IA
                  </span>
                  {aiResult.explanation}
                </div>
              )}
            </>
          )}

          {offerText.length > 0 && offerText.length < 50 && result.total === 0 && (
            <div style={{ fontSize: 10.5, color: t.textMuted, fontStyle: 'italic' }}>
              Collez un peu plus de texte pour activer l'analyse…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spinner inline ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10,
      border: '1.5px solid #c4b5fd', borderTopColor: '#7c3aed',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}
