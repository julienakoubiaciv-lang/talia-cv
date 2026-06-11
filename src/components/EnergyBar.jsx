/**
 * EnergyBar — Jauge d'énergie IA ⚡ (réutilisable).
 *
 * Affiche l'énergie restante du jour. Deux variantes :
 *   - 'pill'  : pastille compacte (en-tête de page)
 *   - 'card'  : carte avec libellé + recharge (pages IA / accueil)
 * Le staff / business (illimité) voit « ⚡ Illimité ».
 */
import React from 'react';
import { C, FONT } from '@/lib/gameTheme';
import { useEnergy } from '@/hooks/useEnergy';

export default function EnergyBar({ variant = 'pill' }) {
  const { remaining, cap, unlimited, empty, resetLabel } = useEnergy();

  if (variant === 'pill') {
    return (
      <span title={unlimited ? 'Énergie IA illimitée' : `Énergie IA — recharge ${resetLabel}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800,
          color: empty ? C.red : C.amber, background: empty ? C.redSoft : C.amberSoft,
          padding: '5px 11px', borderRadius: 99, fontFamily: FONT, whiteSpace: 'nowrap',
        }}>
        ⚡ {unlimited ? 'Illimité' : `${remaining}/${cap}`}
      </span>
    );
  }

  // variant === 'card'
  const pct = unlimited ? 100 : Math.round((remaining / cap) * 100);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, background: C.card,
      border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 16px', fontFamily: FONT,
    }}>
      <span style={{ fontSize: 22 }}>⚡</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>
          {unlimited ? 'Énergie IA illimitée' : `${remaining} génération${remaining > 1 ? 's' : ''} IA restante${remaining > 1 ? 's' : ''}`}
        </div>
        {!unlimited && (
          <>
            <div style={{ height: 6, background: C.track, borderRadius: 99, overflow: 'hidden', margin: '6px 0 4px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: empty ? C.red : C.amber, borderRadius: 99, transition: 'width .4s ease' }} />
            </div>
            <div style={{ fontSize: 11.5, color: C.mute }}>
              {empty ? `Recharge ${resetLabel}` : `${cap} par jour · recharge ${resetLabel}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
