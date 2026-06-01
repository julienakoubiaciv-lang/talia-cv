/**
 * AdminFAB — Bouton flottant pour accéder au dashboard /admin.
 *
 * Affiché uniquement pour les rôles owner | admin (via useRole).
 * Caché sur les routes /admin et /auth.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';

export default function AdminFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isStaff } = useRole();

  if (!isStaff) return null;
  if (location.pathname.startsWith('/admin')) return null;
  if (location.pathname.startsWith('/auth'))  return null;

  return (
    <button
      onClick={() => navigate('/admin')}
      title="Dashboard admin"
      aria-label="Dashboard admin"
      style={{
        position: 'fixed',
        bottom: 22,
        left: 22,
        zIndex: 8500,
        background: 'linear-gradient(135deg, #1539B7, #1F4FE0)',
        color: '#fff',
        border: 'none',
        borderRadius: 28,
        padding: '11px 16px 11px 14px',
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: "'Manrope', sans-serif",
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 8px 24px rgba(21, 57, 183, 0.35)',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(21, 57, 183, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(21, 57, 183, 0.35)';
      }}
    >
      <span style={{ fontSize: 14 }}>🛡️</span>
      Admin
    </button>
  );
}
