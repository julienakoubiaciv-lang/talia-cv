/**
 * AccessDenied — écran montré à un visiteur CONNECTÉ mais non rattaché.
 *
 * Deux situations distinctes, deux messages :
 *   - le compte existe mais n'appartient à aucune organisation → porte fermée ;
 *   - la vérification elle-même a échoué (réseau, base) → on le dit, et on
 *     propose de réessayer plutôt que d'accuser l'utilisateur à tort.
 *
 * La déconnexion est toujours offerte : sans elle, un compte non rattaché
 * resterait coincé sur cet écran sans pouvoir en essayer un autre.
 */
import React from 'react';

const C = {
  blue: 'var(--altio-blue)',
  ink: 'var(--altio-ink)',
  ink2: 'var(--altio-ink2)',
  mute: 'var(--altio-mute)',
  rule: 'var(--altio-line)',
  card: 'var(--altio-card)',
  card2: 'var(--altio-card2)',
};
const FONT = "'Manrope', system-ui, sans-serif";

export default function AccessDenied({ email, error, onRetry, onSignOut }) {
  const isFailure = Boolean(error);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: C.card2,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: C.card,
          border: `1px solid ${C.rule}`,
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, lineHeight: 1 }}>{isFailure ? '⚠️' : '🔒'}</div>

        <h1 style={{ margin: '16px 0 8px', fontSize: 20, fontWeight: 800, color: C.ink }}>
          {isFailure ? 'Vérification impossible' : 'Accès réservé'}
        </h1>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.ink2 }}>
          {isFailure ? (
            <>
              Nous n’avons pas pu vérifier votre rattachement. Ce n’est pas un refus :
              réessayez dans un instant.
            </>
          ) : (
            <>
              Le générateur Altio est réservé aux écoles partenaires, aux coachs
              et à leurs étudiants. Votre compte n’est rattaché à aucune organisation.
            </>
          )}
        </p>

        {email && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: C.mute }}>
            Connecté en tant que <strong style={{ color: C.ink2 }}>{email}</strong>
          </p>
        )}

        {!isFailure && (
          <p style={{ margin: '16px 0 0', fontSize: 12, lineHeight: 1.6, color: C.mute }}>
            Si vous pensez que c’est une erreur, demandez à votre école ou à votre
            coach de rattacher cette adresse à votre organisation.
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
          {isFailure && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: '#fff',
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: `1px solid ${C.rule}`,
              background: 'transparent',
              color: C.ink2,
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
