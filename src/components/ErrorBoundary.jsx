/**
 * ErrorBoundary — capture les erreurs React non gérées et affiche
 * un écran de secours propre avec bouton "Réessayer".
 *
 * Doit être un class component (limitation React — pas de hook équivalent).
 * Usage : envelopper <Routes> dans <ErrorBoundary> dans App.jsx.
 */
import React from 'react';

const C = {
  bg: '#F7F8FA', ink: '#0B1020', mute: '#9AA0AE',
  rule: '#ECEDF1', red: '#EF4444', redSoft: '#FEF2F2',
  bluePrimary: '#1539B7', blueSoft: '#EEF2FF',
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Log console pour le débogage
    console.error('[ErrorBoundary] Erreur capturée :', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;
    const message   = error?.message || String(error) || 'Erreur inconnue';

    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Manrope', sans-serif", padding: 24,
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        `}</style>

        <div style={{
          background: '#fff', border: `1px solid ${C.rule}`, borderRadius: 20,
          padding: '40px 48px', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,.07)',
          animation: 'fadeInUp .3s ease',
        }}>
          {/* Icône */}
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: C.redSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: C.red,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          {/* Titre */}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.ink, margin: '0 0 10px', letterSpacing: '-0.4px' }}>
            Quelque chose s'est mal passé
          </h1>
          <p style={{ fontSize: 14, color: C.mute, lineHeight: 1.65, margin: '0 0 24px' }}>
            Un problème inattendu a provoqué le plantage de cette page.
            Vos données sauvegardées sont intactes.
          </p>

          {/* Message d'erreur (collapsible) */}
          <details style={{ marginBottom: 28, textAlign: 'left' }}>
            <summary style={{ fontSize: 12, color: C.mute, cursor: 'pointer', fontWeight: 600, letterSpacing: '.03em', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              Détails techniques
            </summary>
            <pre style={{
              marginTop: 10, padding: '12px 14px', background: C.redSoft,
              border: `1px solid #FCA5A5`, borderRadius: 10,
              fontSize: 11, color: '#B91C1C', overflow: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6,
              maxHeight: 140, fontFamily: 'monospace',
            }}>
              {message}
            </pre>
          </details>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={this.handleReset}
              style={{
                flex: 1, padding: '12px', border: 'none', borderRadius: 12,
                background: C.bluePrimary, color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif", transition: 'all .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0f2a9e'}
              onMouseLeave={e => e.currentTarget.style.background = C.bluePrimary}
            >
              ↺ Réessayer
            </button>
            <button
              onClick={() => { this.handleReset(); window.location.href = '/'; }}
              style={{
                flex: 1, padding: '12px', border: `1px solid ${C.rule}`, borderRadius: 12,
                background: '#fff', color: C.ink,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif", transition: 'all .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }
}
