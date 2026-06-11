/**
 * GameOnboarding — Accueil premier lancement de l'app gamifiée.
 *
 * Modale multi-slides montrée UNE fois (localStorage 'altio_onboarded'),
 * pour poser la promesse : s'entraîner, gagner de l'XP, suivre son employabilité.
 */
import React, { useState } from 'react';
import { C, FONT, alpha } from '@/lib/gameTheme';

const SLIDES = [
  { emoji: '🐺', title: 'Bienvenue sur Altio CV', text: 'Ton coach pour décrocher ton poste : CV, entraînements et suivi, au même endroit.' },
  { emoji: '🎮', title: 'Entraîne-toi comme dans un jeu', text: 'Entretien, métiers, savoir-être, test de recrutement, oral… des mises en situation concrètes, pas de théorie.' },
  { emoji: '⚡', title: 'Gagne de l\'XP, garde ta série', text: 'Chaque session te fait monter de niveau. Ton énergie ⚡ se recharge chaque jour — reviens un peu chaque jour.' },
  { emoji: '🧭', title: 'Suis ton employabilité', text: 'Un bilan te montre où tu en es et la prochaine étape la plus utile pour décrocher ton poste.' },
];

export default function GameOnboarding({ onDone }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <div style={St.overlay}>
      <div style={St.modal}>
        <button style={St.skip} onClick={onDone}>Passer</button>

        <div style={St.emojiWrap}><span style={St.emoji}>{s.emoji}</span></div>
        <h2 style={St.title}>{s.title}</h2>
        <p style={St.text}>{s.text}</p>

        <div style={St.dots}>
          {SLIDES.map((_, k) => (
            <span key={k} style={{ ...St.dot, ...(k === i ? St.dotOn : {}) }} />
          ))}
        </div>

        <button style={St.cta} onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? "C'est parti 🚀" : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}

const St = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(11,22,56,.55)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 100, fontFamily: FONT },
  modal: { position: 'relative', width: '100%', maxWidth: 400, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: '32px 26px 24px', textAlign: 'center', boxShadow: '0 24px 70px -20px rgba(0,0,0,.5)', animation: 'fadeIn .3s ease both' },
  skip: { position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: C.mute, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT },
  emojiWrap: { width: 76, height: 76, margin: '0 auto 16px', borderRadius: '50%', background: alpha(C.blue, 12), display: 'grid', placeItems: 'center' },
  emoji: { fontSize: 38 },
  title: { fontSize: 21, fontWeight: 800, color: C.ink, letterSpacing: -0.5, margin: '0 0 10px', lineHeight: 1.2 },
  text: { fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: '0 auto 22px', maxWidth: 320 },
  dots: { display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 20 },
  dot: { width: 7, height: 7, borderRadius: 99, background: C.line, transition: 'all .2s' },
  dotOn: { width: 22, background: C.blue },
  cta: { width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 13, padding: '13px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(21,57,183,.25)' },
};
