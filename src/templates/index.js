/**
 * Point d'entrée des templates CV.
 * Chaque template exporte :
 *   - un composant React par défaut (JSX pur, sans <style>)
 *   - une fonction CSS (getXxxCSS) injectée dans <head> par cvData.js
 *
 * Règle absolue : le CSS ne passe JAMAIS par JSX/renderToStaticMarkup
 * pour éviter l'échappement HTML des data-URI SVG par React SSR.
 */
export { default as TemplateClassic, getClassicCSS } from './TemplateClassic.jsx';
export { default as TemplateMinimal, getMinimalCSS  } from './TemplateMinimal.jsx';
export { default as TemplateCompact, getCompactCSS  } from './TemplateCompact.jsx';
export { default as TemplateImpact,  getImpactCSS   } from './TemplateImpact.jsx';
