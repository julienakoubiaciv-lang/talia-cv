import React, { useState, useMemo } from 'react';
import { analyzeMatch } from '@/lib/smartMatcher';
import { useTheme } from '@/hooks/useTheme';

export function SmartMatcher({ cvData }) {
  const { t } = useTheme();
  const [offerText, setOfferText] = useState('');
  const [expanded,  setExpanded]  = useState(true);

  const result = useMemo(
    () => analyzeMatch(offerText, cvData),
    [offerText, cvData]
  );

  const scoreColor = result.score >= 70 ? t.success
    : result.score >= 40 ? t.warning
    : result.score > 0   ? t.error
    : t.textMuted;

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
            onChange={e => setOfferText(e.target.value)}
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
              marginBottom: 10,
              transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = t.navy}
            onBlur={e  => e.target.style.borderColor = t.border}
          />

          {/* Résultats */}
          {result.total > 0 && (
            <>
              {/* Score barre */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, color: t.textSecondary }}>
                  {result.present.length}/{result.total} mots-clés
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
                    {result.present.map(kw => (
                      <span key={kw} style={{
                        padding: '2px 7px', borderRadius: 10, fontSize: 10.5,
                        background: t.matchPresent, color: t.success, fontWeight: 500,
                      }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Manquants */}
              {result.missing.length > 0 && (
                <div>
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
