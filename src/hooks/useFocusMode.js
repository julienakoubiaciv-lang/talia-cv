import { useState, useCallback } from 'react';

// Mapping onglet → zone (data-zone) dans le CV. Indépendant du template :
// chaque template marque ses blocs avec data-zone="identite|contenu|sidebar".
// La photo garde son sélecteur de classe (.block-photo) car elle est gérée à part.
const TAB_SELECTOR = {
  identite:    '[data-zone="identite"]',
  experiences: '[data-zone="contenu"]',
  formations:  '[data-zone="contenu"]',
  competences: '[data-zone="sidebar"]',
  langues:     '[data-zone="sidebar"]',
  interets:    '[data-zone="sidebar"]',
  media:       '.block-photo',
};

export function useFocusMode(iframeRef) {
  const [focusTab,    setFocusTab]    = useState(null);
  const [focusActive, setFocusActive] = useState(false);

  const activateFocus = useCallback((tab) => {
    setFocusTab(tab);
    setFocusActive(true);

    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const selector = TAB_SELECTOR[tab];
    if (!selector) return;

    // Injecter le style de focus
    let style = doc.getElementById('altio-focus-style');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'altio-focus-style';
      doc.head.appendChild(style);
    }
    style.textContent = `
      .altio-focus-dim {
        opacity: 0.18 !important;
        filter: blur(0.8px) !important;
        transition: opacity .3s, filter .3s !important;
        pointer-events: none !important;
      }
      .altio-focus-highlight {
        outline: 2.5px solid #FFCC00 !important;
        outline-offset: 3px !important;
        border-radius: 3px !important;
        box-shadow: 0 0 0 6px rgba(255,204,0,0.12) !important;
        transition: outline .25s, box-shadow .25s !important;
      }
    `;

    // Réinitialiser les classes
    doc.querySelectorAll('.altio-focus-dim, .altio-focus-highlight').forEach(el => {
      el.classList.remove('altio-focus-dim', 'altio-focus-highlight');
    });

    // Toutes les zones repérables — indépendant du template grâce à data-zone
    const blocks = doc.querySelectorAll('[data-zone]');
    blocks.forEach(el => el.classList.add('altio-focus-dim'));

    // Mettre en lumière la zone cible
    const targets = doc.querySelectorAll(selector);
    targets.forEach(el => {
      el.classList.remove('altio-focus-dim');
      el.classList.add('altio-focus-highlight');
    });
  }, [iframeRef]);

  const deactivateFocus = useCallback(() => {
    setFocusActive(false);
    setFocusTab(null);

    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    doc.querySelectorAll('.altio-focus-dim, .altio-focus-highlight').forEach(el => {
      el.classList.remove('altio-focus-dim', 'altio-focus-highlight');
    });

    const style = doc.getElementById('altio-focus-style');
    if (style) style.textContent = '';
  }, [iframeRef]);

  const handleTabChange = useCallback((tab, currentTab, setTab) => {
    if (focusActive && tab === currentTab) {
      // Clic sur l'onglet actif → désactiver le focus
      deactivateFocus();
    } else {
      setTab(tab);
      activateFocus(tab);
    }
  }, [focusActive, activateFocus, deactivateFocus]);

  return { focusActive, focusTab, activateFocus, deactivateFocus, handleTabChange };
}
