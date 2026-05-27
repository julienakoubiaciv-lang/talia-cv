/**
 * useToast — système de notifications toast réutilisable.
 * Utilisé dans Editor, et disponible pour toute autre page.
 */
import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info', duration = 3200) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);
  return { toasts, show };
}

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: t.type === 'error'   ? '#dc2626'
                    : t.type === 'success' ? '#16a34a'
                    : '#1a3a5c',
          color: '#fff', boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
          animation: 'fadeInUp .25s ease',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
