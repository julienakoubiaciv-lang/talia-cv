/**
 * ModuleTopBar — Barre du haut homogène des pages modules.
 *
 * Remplace le bloc « ← Accueil  …  ALTIO · X » dupliqué dans chaque page.
 * Léger et cohérent partout. `right` permet d'ajouter un contenu optionnel
 * (ex. jauge d'énergie) à droite, avant le tag de marque.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { C, FONT } from '@/lib/gameTheme';

export default function ModuleTopBar({ label, onBack, backLabel = 'Accueil', right = null }) {
  const navigate = useNavigate();
  return (
    <div style={S.top}>
      <button style={S.backBtn} onClick={onBack || (() => navigate('/'))}>← {backLabel}</button>
      <div style={S.right}>
        {right}
        <span style={S.brandTag}>ALTIO · {label}</span>
      </div>
    </div>
  );
}

const S = {
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10 },
  backBtn: { background: 'none', border: 'none', color: C.ink2, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  brandTag: { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: C.mute },
};
