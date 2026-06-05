/**
 * SamFeedback — bandeau de feedback du coach « Sam », partagé par les modules
 * ludiques (simulateur d'entretien, décrypteur de métiers, codes de l'entreprise).
 *
 * Auparavant dupliqué dans chaque page ; centralisé ici.
 *
 * Props :
 *   - tone     : 'good' | 'bad' | 'mid'  → couleur (vert / rouge / ambre)
 *   - verdict  : texte de la pastille (ex. « Bonne réponse », « +50 XP »)
 *   - name     : nom affiché (défaut « Sam, ton coach »)
 *   - tip      : conseil optionnel (préfixé 💡)
 *   - children : corps du feedback (explication, + éventuel contenu additionnel)
 */
import React from 'react';
import { C } from '@/lib/gameTheme';

const TONES = {
  good: { color: C.green, soft: C.greenSoft },
  bad:  { color: C.red,   soft: C.redSoft },
  mid:  { color: C.amber, soft: C.amberSoft },
};

export default function SamFeedback({ tone = 'good', verdict, name = 'Sam, ton coach', tip, children }) {
  const t = TONES[tone] || TONES.good;
  return (
    <div style={{ ...S.box, borderColor: t.color, background: t.soft }}>
      <div style={S.head}>
        <span style={S.avatar}>🐺</span>
        <span style={S.name}>{name}</span>
        {verdict != null && <span style={{ ...S.verdict, background: t.color }}>{verdict}</span>}
      </div>
      {children != null && <div style={S.text}>{children}</div>}
      {tip && <div style={S.tip}>💡 {tip}</div>}
    </div>
  );
}

const S = {
  box: { marginTop: 16, border: '1.5px solid', borderRadius: 12, padding: '13px 15px', textAlign: 'left' },
  head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 },
  avatar: { fontSize: 18, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 99, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  name: { fontSize: 13, fontWeight: 800, color: C.ink, flex: 1 },
  verdict: { fontSize: 10.5, fontWeight: 800, color: '#fff', padding: '3px 9px', borderRadius: 99 },
  text: { fontSize: 13.5, color: C.ink2, lineHeight: 1.5 },
  tip: { fontSize: 12.5, color: C.ink, marginTop: 8, fontWeight: 600 },
};
