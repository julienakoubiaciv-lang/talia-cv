import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { SettingsProvider } from './hooks/useSettings.jsx';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { UpgradeModalProvider } from './components/UpgradeModal.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProgressSync from './components/ProgressSync.jsx';

// SettingsPanel chargé en lazy : il n'est jamais visible au premier rendu
// (s'ouvre uniquement sur clic icône ⚙) → hors du bundle initial
const SettingsPanel = lazy(() => import('./components/SettingsPanel.jsx'));
const AdminFAB      = lazy(() => import('./components/AdminFAB.jsx'));

// Chargement paresseux des pages — chaque route crée son propre chunk JS
const Home          = lazy(() => import('./pages/Home.jsx'));
const Generate      = lazy(() => import('./pages/Generate.jsx'));
// EditorRouter dispatch vers EditorAtelier (nouveau) ou Editor classique
// selon le choix utilisateur dans Settings (useEditorLayout).
const Editor        = lazy(() => import('./pages/EditorRouter.jsx'));
const Bulk          = lazy(() => import('./pages/Bulk.jsx'));
const History       = lazy(() => import('./pages/History.jsx'));
const Profiles      = lazy(() => import('./pages/Profiles.jsx'));
const ProfileWizard = lazy(() => import('./pages/ProfileWizard.jsx'));
const Auth          = lazy(() => import('./pages/Auth.jsx'));
const Pricing       = lazy(() => import('./pages/Pricing.jsx'));
const Admin         = lazy(() => import('./pages/Admin.jsx'));
const Interview     = lazy(() => import('./pages/Interview.jsx'));
const Jobs          = lazy(() => import('./pages/Jobs.jsx'));
const Journey       = lazy(() => import('./pages/Journey.jsx'));
const LetterWriter  = lazy(() => import('./pages/LetterWriter.jsx'));
const WorkCodes     = lazy(() => import('./pages/WorkCodes.jsx'));
const AnalyzeOffer  = lazy(() => import('./pages/AnalyzeOffer.jsx'));
const Diagnostic    = lazy(() => import('./pages/Diagnostic.jsx'));
const RecruitTest   = lazy(() => import('./pages/RecruitTest.jsx'));
const Charte        = lazy(() => import('./pages/Charte.jsx'));
const CohortDashboard = lazy(() => import('./pages/CohortDashboard.jsx'));
const OralInterview = lazy(() => import('./pages/OralInterview.jsx'));
const PhoneVerify   = lazy(() => import('./pages/PhoneVerify.jsx'));
const Confidentialite = lazy(() => import('./pages/Legal.jsx').then(m => ({ default: m.Confidentialite })));
const MentionsLegales = lazy(() => import('./pages/Legal.jsx').then(m => ({ default: m.MentionsLegales })));
const CGU             = lazy(() => import('./pages/Legal.jsx').then(m => ({ default: m.CGU })));

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

// Feature flag : la barrière ne s'active que si la variable est à "true"
// (à basculer une fois Twilio configuré). Sinon le code reste dormant.
const REQUIRE_PHONE = import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === 'true';

// Barrière : un utilisateur connecté sans téléphone vérifié est forcé
// vers l'écran de vérification. Les visiteurs anonymes ne sont pas affectés.
function GatedRoutes() {
  const { user, loading, phoneVerified } = useAuth();

  if (loading) return <PageLoader />;

  if (REQUIRE_PHONE && user && !phoneVerified) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PhoneVerify />
      </Suspense>
    );
  }

  return (
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
        <Route path="/pricing"            element={<Pricing />} />
        <Route path="/admin"              element={<Admin />} />
        <Route path="/entretien"          element={<Interview />} />
        <Route path="/metiers"            element={<Jobs />} />
        <Route path="/parcours"           element={<Journey />} />
        <Route path="/lettre"             element={<LetterWriter />} />
        <Route path="/codes"              element={<WorkCodes />} />
        <Route path="/analyse"            element={<AnalyzeOffer />} />
        <Route path="/diagnostic"         element={<Diagnostic />} />
        <Route path="/test-recrutement"   element={<RecruitTest />} />
        <Route path="/charte"             element={<Charte />} />
        <Route path="/encadrement"        element={<CohortDashboard />} />
        <Route path="/entretien-oral"     element={<OralInterview />} />
        <Route path="/confidentialite"    element={<Confidentialite />} />
        <Route path="/mentions-legales"   element={<MentionsLegales />} />
        <Route path="/cgu"                element={<CGU />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <ProgressSync />
            <UpgradeModalProvider>
              <ErrorBoundary>
                <GatedRoutes />
              </ErrorBoundary>
              <ThemeToggle />
              {/* SettingsPanel lazy — se charge au premier clic ⚙ */}
              <Suspense fallback={null}>
                <SettingsPanel />
              </Suspense>
              {/* AdminFAB lazy — visible uniquement pour owner/admin */}
              <Suspense fallback={null}>
                <AdminFAB />
              </Suspense>
            </UpgradeModalProvider>
          </AuthProvider>
        </BrowserRouter>
      </SettingsProvider>
    </ThemeProvider>
  );
}
