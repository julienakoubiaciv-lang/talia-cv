import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Gestion centralisée et sécurisée de la clé API + code PIN.
 * - La clé API est stockée dans localStorage (talia_api_key).
 * - Le PIN n'est jamais stocké en clair : seul son hash SHA-256 est conservé (talia_pin_hash).
 * - Toute modification de la clé exige la vérification du PIN (voir SettingsPanel).
 *
 * NB sécurité : avec des appels API directs depuis le navigateur, la clé reste
 * techniquement lisible via les outils dev. Ce mécanisme protège contre la
 * consultation/modification accidentelle dans l'UI partagée, pas contre une
 * extraction volontaire. Une vraie isolation nécessiterait un proxy backend.
 */

const SettingsContext = createContext(null);

const API_KEY_LS = 'talia_api_key';
const PIN_HASH_LS = 'talia_pin_hash';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function SettingsProvider({ children }) {
  const [apiKey, setApiKeyState] = useState('');
  const [pinHash, setPinHashState] = useState('');
  const [ready, setReady] = useState(false);

  // Init + migration depuis l'ancienne version (sessionStorage)
  useEffect(() => {
    let key = localStorage.getItem(API_KEY_LS) || '';
    if (!key) {
      const legacy = sessionStorage.getItem(API_KEY_LS);
      if (legacy) {
        key = legacy;
        localStorage.setItem(API_KEY_LS, legacy);
        sessionStorage.removeItem(API_KEY_LS);
      }
    }
    setApiKeyState(key);
    setPinHashState(localStorage.getItem(PIN_HASH_LS) || '');
    setReady(true);
  }, []);

  const hasPin = !!pinHash;

  const verifyPin = useCallback(async (pin) => {
    if (!pinHash) return false;
    return (await sha256(pin)) === pinHash;
  }, [pinHash]);

  const savePin = useCallback(async (pin) => {
    const h = await sha256(pin);
    localStorage.setItem(PIN_HASH_LS, h);
    setPinHashState(h);
  }, []);

  const saveApiKey = useCallback((key) => {
    const v = (key || '').trim();
    if (v) localStorage.setItem(API_KEY_LS, v);
    else localStorage.removeItem(API_KEY_LS);
    setApiKeyState(v);
  }, []);

  return (
    <SettingsContext.Provider value={{ apiKey, hasPin, ready, verifyPin, savePin, saveApiKey }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings doit être utilisé dans <SettingsProvider>');
  return ctx;
}
