/**
 * editorHelpers.js
 * Utilitaires de l'éditeur CV : chargement DOM, état/ref synchronisé,
 * mutation d'objet imbriqué, appel API Anthropic.
 */
import { useState, useRef, useCallback } from 'react';

// ── Chargement dynamique de ressources ────────────────────────────────────────

/** Charge un script externe (Promise, idempotent). */
export function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

/** Injecte une feuille de style (idempotent). */
export function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
}

// ── État + ref synchronisé ────────────────────────────────────────────────────

/**
 * useStateRef(initial)
 * Retourne [value, setValue, ref] où ref.current est TOUJOURS synchrone
 * avec value — utile pour les closures et debounces sans déclencher de re-render.
 */
export function useStateRef(initial) {
  const [value, setValue] = useState(initial);
  const ref = useRef(value);
  const set = useCallback((next) => {
    ref.current = typeof next === 'function' ? next(ref.current) : next;
    setValue(ref.current);
  }, []);
  return [value, set, ref];
}

// ── Mutation d'objet par chemin ───────────────────────────────────────────────

/**
 * setByPath(obj, "a.b.0.c", value)
 * Écrit `value` dans `obj` au chemin donné (segments numériques = index tableau).
 * Mutation en place — appelant doit passer une copie.
 */
export function setByPath(obj, path, value) {
  const keys = String(path).split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

// ── Appel API Anthropic ───────────────────────────────────────────────────────

/**
 * Toujours passer par le proxy /api/anthropic :
 *   - dev  : Vite proxifie → api.anthropic.com/v1/messages
 *   - prod : Vercel serverless function (clé dans process.env)
 * La clé n'est JAMAIS exposée dans le bundle client en prod.
 */
const ANTHROPIC_URL = '/api/anthropic';

export async function callAnthropicAPI(body, apiKey) {
  const headers = {
    'Content-Type':      'application/json',
    'anthropic-version': '2023-06-01',
  };
  // Clé perso optionnelle — prioritaire sur la clé serveur
  if (apiKey) headers['x-api-key'] = apiKey;

  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(t); }
  const j = await r.json();
  return j.content?.[0]?.text || '';
}
