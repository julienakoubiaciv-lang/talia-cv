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

// ── Appel API Anthropic via Edge Function claude-proxy ───────────────────────
//
// Migration V0 : plus aucune clé Anthropic côté client.
// callAnthropicAPI() est désormais un thin wrapper autour de callClaude()
// pour minimiser les changements dans Editor.jsx.
//
// Signature :
//   await callAnthropicAPI(
//     { model, max_tokens, system?, messages, metadata? },
//     action   // 'generate_cv' | 'smart_match' | 'coach' | ...
//   )
// Retourne directement le texte (pas l'objet complet).

import { callClaude } from '@/lib/claudeClient';

/**
 * @param {object} body              - { model, max_tokens, system?, messages, metadata? }
 * @param {string} [action='generate_cv'] - action loguée + quota check
 * @returns {Promise<string>} texte de la première content block
 * @throws {QuotaError|ClaudeProxyError}
 */
export async function callAnthropicAPI(body, action = 'generate_cv') {
  const response = await callClaude({
    action,
    model:      body.model,
    max_tokens: body.max_tokens,
    system:     body.system,
    messages:   body.messages,
    metadata:   body.metadata,
  });
  return response.content?.[0]?.text || '';
}
