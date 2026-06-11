import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme.jsx';

export default function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const isDark = mode === 'dark';

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      style={{
        position: 'fixed', bottom: 64, right: 18, zIndex: 1200,
        width: 38, height: 38, borderRadius: '50%',
        background: 'var(--t-surface)', border: '1px solid var(--t-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--t-textSecondary)',
        opacity: 0.55, transition: 'opacity .15s, transform .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = 0.55; e.currentTarget.style.transform = 'none'; }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
