/**
 * seo — Met à jour le titre + la meta description selon la page (SPA).
 *
 * Google exécute le JS : actualiser document.title / la description par route
 * améliore le rendu indexé. Les pages outils peuvent passer `noindex` pour
 * éviter l'indexation.
 */
import { useEffect } from 'react';

const BRAND = 'Altio CV';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

/** Applique titre + description (+ robots si noindex). */
export function setPageMeta({ title, description, noindex = false } = {}) {
  if (title) document.title = title.includes(BRAND) ? title : `${title} — ${BRAND}`;
  if (description) {
    setMeta('description', description);
    setMeta('og:title', document.title, 'property');
    setMeta('og:description', description, 'property');
  }
  setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
}

/** Hook pratique : applique la meta au montage de la page. */
export function useSeo(meta) {
  useEffect(() => { setPageMeta(meta); }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
