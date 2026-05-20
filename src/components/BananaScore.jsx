import React, { useMemo, useState } from 'react';
import { calcBananaScore } from '@/lib/bananaScore';
import { useTheme } from '@/hooks/useTheme';

/* ─── Palette de score (froid → chaud → supernova) ───────────────────────── */
const SCORE_COLORS = [
  { min: 0,  max: 20,  color: '#4a9eff', glow: 'rgba(74,158,255,0.55)',  label: 'Débutant',   code: 'cold'  },
  { min: 20, max: 40,  color: '#00c8f0', glow: 'rgba(0,200,240,0.55)',   label: 'En route',   code: 'cool'  },
  { min: 40, max: 60,  color: '#00e8c8', glow: 'rgba(0,232,200,0.55)',   label: 'Solide',     code: 'mid'   },
  { min: 60, max: 80,  color: '#FFCC00', glow: 'rgba(255,204,0,0.6)',    label: 'Excellent',  code: 'warm'  },
  { min: 80, max: 101, color: '#ffffff', glow: 'rgba(255,255,255,0.75)', label: '✦ Supernova', code: 'nova'  },
];

function getScoreColor(pct) {
  return SCORE_COLORS.find(c => pct >= c.min && pct < c.max) || SCORE_COLORS[SCORE_COLORS.length - 1];
}

/* ─── SVG Étoile géométrique ──────────────────────────────────────────────── */
function Star({ filled, color, glow, size = 28, animated = false }) {
  const id = `star-${Math.random().toString(36).slice(2, 7)}`;
  // Points d'une étoile à 5 branches
  const pts = Array.from({ length: 5 }, (_, i) => {
    const outer = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    const r = 11, ri = 4.5, cx = 14, cy = 14;
    return [
      cx + r  * Math.cos(outer), cy + r  * Math.sin(outer),
      cx + ri * Math.cos(inner), cy + ri * Math.sin(inner),
    ];
  }).flat();
  const d = `M ${pts[0]},${pts[1]} ` + Array.from({ length: 5 }, (_, i) => {
    const base = i * 4;
    return `L ${pts[base+2]},${pts[base+3]} L ${pts[(base+4) % 20]},${pts[(base+5) % 20]}`;
  }).join(' ') + ' Z';

  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      style={{
        filter: filled
          ? `drop-shadow(0 0 ${animated ? 8 : 5}px ${glow}) drop-shadow(0 0 ${animated ? 16 : 10}px ${glow}40)`
          : 'none',
        transition: 'filter .5s ease, transform .3s ease',
        transform: filled && animated ? 'scale(1.12)' : 'scale(1)',
        flexShrink: 0,
      }}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={filled ? color : 'transparent'} />
          <stop offset="100%" stopColor={filled ? (color === '#ffffff' ? '#FFCC00' : color) : 'transparent'} />
        </linearGradient>
      </defs>
      {/* Halo de fond pour étoiles remplies */}
      {filled && (
        <circle cx="14" cy="14" r="12"
          fill={glow.replace('0.55)', '0.08)').replace('0.75)', '0.10)')}
        />
      )}
      <path d={d}
        fill={filled ? `url(#${id})` : 'none'}
        stroke={filled ? color : '#374151'}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
        opacity={filled ? 1 : 0.35}
      />
    </svg>
  );
}

/* ─── Particules d'énergie ────────────────────────────────────────────────── */
function EnergyParticles({ color, count = 6, active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'relative', height: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <style>{`
        @keyframes float-particle {
          0%   { transform: translateY(0) scale(1);   opacity: 0.8; }
          50%  { transform: translateY(-14px) scale(0.6); opacity: 0.5; }
          100% { transform: translateY(-28px) scale(0); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: -4,
          left: `${10 + i * 18}%`,
          width: i % 2 === 0 ? 3 : 2,
          height: i % 2 === 0 ? 3 : 2,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 4px ${color}`,
          animation: `float-particle ${1.2 + i * 0.3}s ease-out infinite`,
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Composant principal ─────────────────────────────────────────────────── */
export function BananaScore({ cvData, croppedPhoto }) {
  const { t, mode } = useTheme();
  const { pct, tips } = useMemo(
    () => calcBananaScore(cvData, { photo: croppedPhoto }),
    [cvData, croppedPhoto]
  );

  const scoreInfo  = getScoreColor(pct);
  const starsCount = Math.ceil((pct / 100) * 5);       // étoiles allumées
  const isSupernova = pct >= 80;
  const isDark = mode === 'dark';

  /* état coché des priorités */
  const [checked, setChecked] = useState({});
  const toggleChecked = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div style={{
      background: isDark
        ? `linear-gradient(145deg, #161b22 0%, #1a2030 100%)`
        : `linear-gradient(145deg, #ffffff 0%, #f4f7fb 100%)`,
      borderRadius: 14,
      padding: '14px 14px 12px',
      border: `1px solid ${pct > 0 ? scoreInfo.glow.replace('0.55)', '0.35)').replace('0.75)', '0.35)') : t.border}`,
      marginBottom: 12,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color .5s ease',
    }}>

      {/* Injection des keyframes globaux */}
      <style>{`
        @keyframes score-glow-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes score-bar-fill {
          from { width: 0%; }
        }
        @keyframes supernova-bg {
          0%, 100% { opacity: 0.04; }
          50%       { opacity: 0.09; }
        }
      `}</style>

      {/* Halo de fond — Supernova uniquement */}
      {isSupernova && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 14,
          background: `radial-gradient(ellipse at 50% 0%, ${scoreInfo.glow} 0%, transparent 70%)`,
          animation: 'supernova-bg 2.5s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Titre + score numérique ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: scoreInfo.color,
            boxShadow: `0 0 6px ${scoreInfo.glow}`,
            animation: pct > 0 ? 'score-glow-pulse 2s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 11, fontWeight: 800, color: t.textPrimary,
            textTransform: 'uppercase', letterSpacing: '.08em',
          }}>
            CV Score
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{
            fontSize: 22, fontWeight: 900, lineHeight: 1,
            color: scoreInfo.color,
            textShadow: pct > 0 ? `0 0 12px ${scoreInfo.glow}` : 'none',
            transition: 'color .5s, text-shadow .5s',
          }}>
            {pct}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted }}>%</span>
        </div>
      </div>

      {/* ── Barre de progression ── */}
      <div style={{
        height: 4,
        background: isDark ? '#1e2530' : '#e9edf2',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 2,
          background: `linear-gradient(90deg,
            #4a9eff 0%,
            #00c8f0 25%,
            #00e8c8 45%,
            #FFCC00 70%,
            #ffffff 100%
          )`,
          backgroundSize: '200% 100%',
          backgroundPosition: `${100 - pct}% 0`,
          boxShadow: pct > 0 ? `0 0 8px ${scoreInfo.glow}` : 'none',
          transition: 'width .8s cubic-bezier(.4,0,.2,1), box-shadow .5s',
          animation: 'score-bar-fill .8s ease-out',
        }} />
      </div>

      {/* ── Étoiles ── */}
      <div style={{ position: 'relative', marginBottom: 4 }}>
        {/* Particules au-dessus des étoiles actives */}
        <EnergyParticles color={scoreInfo.color} count={starsCount * 2} active={pct >= 40} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i < starsCount;
            return (
              <Star
                key={i}
                size={30}
                filled={filled}
                color={scoreInfo.color}
                glow={scoreInfo.glow}
                animated={filled && isSupernova}
              />
            );
          })}
        </div>
      </div>

      {/* ── Label niveau ── */}
      <div style={{
        textAlign: 'center',
        fontSize: 10, fontWeight: 700,
        color: pct > 0 ? scoreInfo.color : t.textMuted,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        textShadow: pct > 60 ? `0 0 8px ${scoreInfo.glow}` : 'none',
        marginBottom: tips.length > 0 ? 12 : 0,
        transition: 'color .5s, text-shadow .5s',
      }}>
        {scoreInfo.label}
      </div>

      {/* ── Conseils prioritaires ── */}
      {tips.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: t.textMuted,
            textTransform: 'uppercase', letterSpacing: '.08em',
            marginBottom: 5,
          }}>
            Priorités
          </div>
          {tips.map((tip, i) => {
            const done = !!checked[i];
            return (
              <div
                key={i}
                onClick={() => toggleChecked(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 9, marginBottom: 5,
                  cursor: 'pointer',
                  background: done ? '#1F8A5B' : '#1539B7',
                  border: 'none',
                  transition: 'background .2s',
                  userSelect: 'none',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.45)'}`,
                  background: done ? 'rgba(255,255,255,0.25)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                {/* Text */}
                <span style={{
                  fontSize: 11.5, color: '#fff', lineHeight: 1.4, flex: 1,
                  textDecoration: done ? 'line-through' : 'none',
                  opacity: done ? 0.75 : 1,
                }}>
                  {tip.tip}
                </span>
                {/* Points badge */}
                <span style={{
                  fontSize: 9, fontWeight: 800, color: done ? '#fff' : '#0B1020',
                  background: done ? 'rgba(255,255,255,0.2)' : '#F5B400',
                  borderRadius: 4, padding: '1px 5px', flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>+{tip.pts}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Supernova banner ── */}
      {pct >= 100 && (
        <div style={{
          textAlign: 'center', padding: '8px 10px', marginTop: 8,
          background: 'linear-gradient(90deg, rgba(74,158,255,0.1), rgba(255,204,0,0.1), rgba(255,255,255,0.1))',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          fontSize: 11, fontWeight: 700,
          color: '#ffffff',
          textShadow: '0 0 12px rgba(255,255,255,0.6)',
          letterSpacing: '.04em',
        }}>
          ✦ Supernova — CV parfait, prêt à l'envoi
        </div>
      )}
    </div>
  );
}
