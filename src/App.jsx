import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { SettingsProvider } from './hooks/useSettings.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Chargement paresseux des pages — chaque route crée son propre chunk JS
const Home          = lazy(() => import('./pages/Home.jsx'));
const Generate      = lazy(() => import('./pages/Generate.jsx'));
const Editor        = lazy(() => import('./pages/Editor.jsx'));
const Bulk          = lazy(() => import('./pages/Bulk.jsx'));
const History       = lazy(() => import('./pages/History.jsx'));
const Profiles      = lazy(() => import('./pages/Profiles.jsx'));
const ProfileWizard = lazy(() => import('./pages/ProfileWizard.jsx'));
const Auth          = lazy(() => import('./pages/Auth.jsx'));

// Spinner minimal affiché pendant le chargement d'un chunk
function PageLoader() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F8FA', fontFamily: "'Manrope', sans-serif",
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid #ECEDF1',
        borderTopColor: '#1539B7', borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"            element={<Home />} />
                <Route path="/auth"        element={<Auth />} />
                <Route path="/generate"    element={<Generate />} />
                <Route path="/bulk"        element={<Bulk />} />
                <Route path="/editor"      element={<Editor />} />
                <Route path="/editor/:id"  element={<Editor />} />
                <Route path="/history"            element={<History />} />
                <Route path="/profils"            element={<Profiles />} />
                <Route path="/profils/nouveau"    element={<ProfileWizard />} />
                <Route path="/profils/:id/editer" element={<ProfileWizard />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
            <SettingsPanel />
          </AuthProvider>
        </BrowserRouter>
      </SettingsProvider>
    </ThemeProvider>
  );
}
