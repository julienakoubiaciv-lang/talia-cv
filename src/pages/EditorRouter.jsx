/**
 * EditorRouter — Dispatch vers le bon layout d'éditeur selon useEditorLayout.
 *
 * - 'atelier'   → EditorAtelier (nouveau, 3 colonnes, défaut)
 * - 'classique' → Editor (legacy, conservé pour fallback)
 *
 * Chaque layout est chargé en lazy → l'utilisateur ne paie que pour celui qu'il utilise.
 * Switch instantané via SettingsPanel (le toggle déclenche un re-render).
 */
import React, { lazy, Suspense } from 'react';
import { useEditorLayout } from '@/hooks/useEditorLayout';

const EditorAtelier   = lazy(() => import('./EditorAtelier.jsx'));
const EditorClassique = lazy(() => import('./Editor.jsx'));

// Loader minimal pour le switch entre layouts (déjà dans App.Suspense, donc bref)
function LayoutLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F4F6FA', fontFamily: "'Manrope', sans-serif",
    }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #ECEDF1',
        borderTopColor: '#0B1B33', borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function EditorRouter() {
  const { isAtelier } = useEditorLayout();

  return (
    <Suspense fallback={<LayoutLoader />}>
      {isAtelier ? <EditorAtelier /> : <EditorClassique />}
    </Suspense>
  );
}
