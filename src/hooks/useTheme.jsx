import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME } from '@/lib/theme';

const ThemeCtx = createContext({ t: THEME.light, mode: 'light', toggle: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() =>
    localStorage.getItem('altio_theme') || 'light'
  );

  const t = THEME[mode] || THEME.light;

  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('altio_theme', next);
  };

  // Injecter les CSS variables + attribut data-theme sur <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    Object.entries(t).forEach(([k, v]) => {
      root.style.setProperty(`--t-${k}`, v);
    });
    // Fond général de la page
    document.body.style.background = t.bg;
    document.body.style.color = t.textPrimary;
  }, [mode, t]);

  return (
    <ThemeCtx.Provider value={{ t, mode, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}
