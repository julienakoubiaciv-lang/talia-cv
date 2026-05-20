import { useState, useCallback } from 'react';

// Mapping onglet → sélecteur CSS dans le CV (iframe)
const SECTION_SELECTORS = {
  identite:    '.block-presentation',
  experiences: '.block-main',
  formations:  '.block-main',
  competences: '.block-sidebar',
  langues:     '.block-sidebar',
  interets:    '.block-sidebar',
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

    const selector = SECTION_SELECTORS[tab];
    if (!selector) return;

    // Injecter le style de focus
    let style = doc.getElementById('talia-focus-style');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'talia-focus-style';
      doc.head.appendChild(style);
    }
    style.textContent = `
      .talia-focus-dim {
        opacity: 0.18 !important;
        filter: blur(0.8px) !important;
        transition: opacity .3s, filter .3s !important;
        pointer-events: none !important;
      }
      .talia-focus-highlight {
        outline: 2.5px solid #FFCC00 !important;
        outline-offset: 3px !important;
        border-radius: 3px !important;
        box-shadow: 0 0 0 6px rgba(255,204,0,0.12) !important;
        transition: outline .25s, box-shadow .25s !important;
      }
    `;

    // Réinitialiser les classes
    doc.querySelectorAll('.talia-focus-dim, .talia-focus-highlight').forEach(el => {
      el.classList.remove('talia-focus-dim', 'talia-focus-highlight');
    });

    // Tous les blocs principaux
    const blocks = doc.querySelectorAll(
      '.block-presentation, .block-main, .block-photo, .block-sidebar'
    );
    blocks.forEach(el => el.classList.add('talia-focus-dim'));

    // Mettre en lumière la zone cible
    const targets = doc.querySelectorAll(selector);
    targets.forEach(el => {
      el.classList.remove('talia-focus-dim');
      el.classList.add('talia-focus-highlight');
    });
  }, [iframeRef]);

  const deactivateFocus = useCallback(() => {
    setFocusActive(false);
    setFocusTab(null);

    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    doc.querySelectorAll('.talia-focus-dim, .talia-focus-highlight').forEach(el => {
      el.classList.remove('talia-focus-dim', 'talia-focus-highlight');
    });

    const style = doc.getElementById('talia-focus-style');
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
