/**
 * Mascot — « Loupi », la mascotte loup du simulateur d'entretien.
 *
 * Style cartoon, expressions exagérées (esprit Duolingo) : squash & stretch,
 * grands yeux, réactions amples. 100% SVG + CSS, aucun asset externe.
 *
 * Props :
 *   mood   : 'idle' | 'happy' | 'cheer' | 'sad' | 'ko' | 'fire' | 'think'
 *   level  : 'cub' | 'young' | 'adult' | 'alpha'  (évolution selon les perfs)
 *   message: bulle de dialogue optionnelle
 *   size   : taille en px
 *
 * Remplaçable plus tard par un asset Rive (.riv) sans changer l'API ni le jeu.
 */
import React from 'react';

const FUR = {
  body: '#7C8AA5', dark: '#5A6B8C', muzzle: '#EDF1F8',
  nose: '#2A2F45', eye: '#1B2238', white: '#fff',
  tongue: '#FF8FB1', crown: '#FFC53D', fire: '#FF7A1A',
};

export default function Mascot({ mood = 'idle', level = 'young', message, size = 96 }) {
  const anim = {
    idle:  'wolfBob 2.6s ease-in-out infinite',
    happy: 'wolfJump .55s cubic-bezier(.3,1.4,.5,1)',
    cheer: 'wolfCheer .7s ease-in-out infinite',
    sad:   'wolfSad .5s ease',
    ko:    'wolfKo .9s ease-in-out infinite',
    fire:  'wolfFire .45s ease-in-out infinite',
    think: 'wolfBob 3.2s ease-in-out infinite',
  }[mood] || 'wolfBob 2.6s ease-in-out infinite';

  const earsDown = mood === 'sad' || mood === 'ko';
  const isAlpha = level === 'alpha';
  const isCub = level === 'cub';
  // Le louveteau est plus petit/rond, l'alpha porte une couronne.
  const charScale = isCub ? 0.92 : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {message && (
        <div style={bubble}>
          {message}
          <span style={bubbleTail} />
        </div>
      )}

      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Flammes en mode "série" */}
        {mood === 'fire' && (
          <>
            <span style={{ ...flame, left: -6, animationDelay: '0s' }}>🔥</span>
            <span style={{ ...flame, right: -6, animationDelay: '.2s' }}>🔥</span>
          </>
        )}

        <div style={{ width: '100%', height: '100%', animation: anim, transformOrigin: 'bottom center' }}>
          <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
            {/* ombre portée */}
            <ellipse cx="50" cy="94" rx="24" ry="4.5" fill="rgba(11,22,56,.12)" />

            <g transform={`translate(50 52) scale(${charScale}) translate(-50 -52)`}>
              {/* couronne alpha */}
              {isAlpha && (
                <path d="M36 14 L41 22 L50 13 L59 22 L64 14 L62 26 L38 26 Z" fill={FUR.crown} stroke="#E0A91F" strokeWidth="1" />
              )}

              {/* oreilles (groupe inclinable) */}
              <g style={{ transformOrigin: '50px 40px', transform: earsDown ? 'rotate(0deg)' : 'none' }}>
                <g transform={earsDown ? 'translate(0 4)' : 'none'}>
                  <polygon points="20,40 30,14 44,36" fill={FUR.body} transform={earsDown ? 'rotate(18 30 30)' : 'none'} />
                  <polygon points="26,34 31,20 38,33" fill={FUR.dark} transform={earsDown ? 'rotate(18 30 30)' : 'none'} />
                  <polygon points="80,40 70,14 56,36" fill={FUR.body} transform={earsDown ? 'rotate(-18 70 30)' : 'none'} />
                  <polygon points="74,34 69,20 62,33" fill={FUR.dark} transform={earsDown ? 'rotate(-18 70 30)' : 'none'} />
                </g>
              </g>

              {/* tête */}
              <ellipse cx="50" cy="54" rx="30" ry="27" fill={FUR.body} />
              {/* touffes de joues */}
              <polygon points="20,54 26,46 28,62" fill={FUR.dark} opacity="0.5" />
              <polygon points="80,54 74,46 72,62" fill={FUR.dark} opacity="0.5" />

              {/* museau clair */}
              <ellipse cx="50" cy="66" rx="19" ry="15" fill={FUR.muzzle} />

              {/* sourcils déterminés en mode fire */}
              {mood === 'fire' && (
                <>
                  <path d="M34 40 L46 45" stroke={FUR.eye} strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M66 40 L54 45" stroke={FUR.eye} strokeWidth="3.5" strokeLinecap="round" />
                </>
              )}

              {/* yeux selon l'humeur */}
              {renderEyes(mood)}

              {/* nez */}
              <ellipse cx="50" cy="60" rx="5" ry="4" fill={FUR.nose} />
              <path d="M50 64 L50 68" stroke={FUR.nose} strokeWidth="2" strokeLinecap="round" />

              {/* bouche / expression */}
              {renderMouth(mood)}

              {/* pattes */}
              <ellipse cx="36" cy="86" rx="7" ry="5" fill={FUR.body} />
              <ellipse cx="64" cy="86" rx="7" ry="5" fill={FUR.body} />
            </g>
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes wolfBob   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes wolfJump  {
          0%   { transform: translateY(0)    scaleX(1)    scaleY(1); }
          20%  { transform: translateY(0)    scaleX(1.12) scaleY(.88); }
          50%  { transform: translateY(-22px) scaleX(.9)  scaleY(1.12); }
          78%  { transform: translateY(0)    scaleX(1.1)  scaleY(.9); }
          100% { transform: translateY(0)    scaleX(1)    scaleY(1); }
        }
        @keyframes wolfCheer {
          0%,100% { transform: translateY(0)    rotate(-5deg); }
          25%     { transform: translateY(-16px) rotate(4deg) scaleY(1.08); }
          50%     { transform: translateY(0)    rotate(5deg) scaleX(1.06) scaleY(.94); }
          75%     { transform: translateY(-9px) rotate(-4deg); }
        }
        @keyframes wolfSad {
          0%,100% { transform: translateX(0) rotate(0); }
          25%     { transform: translateX(-5px) rotate(-2deg); }
          50%     { transform: translateY(3px) scaleY(.95); }
          75%     { transform: translateX(5px) rotate(2deg); }
        }
        @keyframes wolfKo   { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
        @keyframes wolfFire {
          0%,100% { transform: translateY(0)   scale(1); }
          25%     { transform: translateY(-3px) scale(1.04) rotate(-2deg); }
          75%     { transform: translateY(-2px) scale(1.05) rotate(2deg); }
        }
        @keyframes flameFlick { 0%,100% { transform: translateY(0) scale(1); opacity:.9; } 50% { transform: translateY(-5px) scale(1.15); opacity:1; } }
      `}</style>
    </div>
  );
}

// ── Yeux ─────────────────────────────────────────────────────────────────────
function renderEyes(mood) {
  if (mood === 'ko') {
    return (
      <>
        {cross(40, 49)} {cross(60, 49)}
      </>
    );
  }
  if (mood === 'sad') {
    return (
      <>
        <path d="M34 50 q6 -5 12 -1" stroke={FUR.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M54 49 q6 -4 12 1" stroke={FUR.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (mood === 'happy' || mood === 'cheer') {
    return (
      <>
        <path d="M34 50 q6 -7 12 0" stroke={FUR.eye} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M54 50 q6 -7 12 0" stroke={FUR.eye} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (mood === 'fire') {
    return (
      <>
        <ellipse cx="40" cy="49" rx="5" ry="5.5" fill={FUR.white} />
        <ellipse cx="60" cy="49" rx="5" ry="5.5" fill={FUR.white} />
        <circle cx="41" cy="50" r="3" fill={FUR.eye} />
        <circle cx="61" cy="50" r="3" fill={FUR.eye} />
      </>
    );
  }
  // idle / think : grands yeux ronds (think = pupilles en haut)
  const py = mood === 'think' ? 46 : 49;
  return (
    <>
      <ellipse cx="40" cy="49" rx="6" ry="6.5" fill={FUR.white} />
      <ellipse cx="60" cy="49" rx="6" ry="6.5" fill={FUR.white} />
      <circle cx="40.5" cy={py} r="3.4" fill={FUR.eye} />
      <circle cx="60.5" cy={py} r="3.4" fill={FUR.eye} />
      <circle cx="42" cy={py - 1.5} r="1.2" fill={FUR.white} />
      <circle cx="62" cy={py - 1.5} r="1.2" fill={FUR.white} />
    </>
  );
}

function cross(cx, cy) {
  return (
    <g stroke={FUR.eye} strokeWidth="3" strokeLinecap="round">
      <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} />
      <line x1={cx + 4} y1={cy - 4} x2={cx - 4} y2={cy + 4} />
    </g>
  );
}

// ── Bouche ───────────────────────────────────────────────────────────────────
function renderMouth(mood) {
  if (mood === 'happy' || mood === 'cheer') {
    return (
      <>
        <path d="M40 70 Q50 84 60 70 Z" fill={FUR.nose} />
        <ellipse cx="50" cy="78" rx="5" ry="4" fill={FUR.tongue} />
      </>
    );
  }
  if (mood === 'fire') {
    return (
      <>
        <path d="M40 71 Q50 79 60 71 Z" fill={FUR.nose} />
        <path d="M43 71 L46 75 L49 71 L52 75 L55 71 L58 73" stroke={FUR.white} strokeWidth="1.4" fill="none" />
      </>
    );
  }
  if (mood === 'sad') return <path d="M42 76 Q50 69 58 76" stroke={FUR.nose} strokeWidth="3" fill="none" strokeLinecap="round" />;
  if (mood === 'ko')  return <ellipse cx="50" cy="74" rx="5" ry="4" fill={FUR.nose} />;
  if (mood === 'think') return <path d="M44 73 L56 73" stroke={FUR.nose} strokeWidth="3" fill="none" strokeLinecap="round" />;
  // idle
  return <path d="M42 71 Q50 78 58 71" stroke={FUR.nose} strokeWidth="3" fill="none" strokeLinecap="round" />;
}

const bubble = {
  position: 'relative', background: '#fff', border: '1.5px solid #E6EAF1',
  borderRadius: 14, padding: '8px 14px', fontSize: 13.5, fontWeight: 700,
  color: '#0B1638', maxWidth: 240, textAlign: 'center', fontFamily: "'Manrope', sans-serif",
  boxShadow: '0 6px 18px rgba(11,22,56,.08)',
};
const bubbleTail = {
  position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
  width: 12, height: 12, background: '#fff', borderRight: '1.5px solid #E6EAF1', borderBottom: '1.5px solid #E6EAF1',
};
const flame = {
  position: 'absolute', bottom: 8, fontSize: 22, animation: 'flameFlick .5s ease-in-out infinite',
};
