import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { getCurrentUser, logoutUser } from './services/authService';
import { supabase } from './services/supabaseClient';
import type { AuthUser } from './services/authService';

const AppWorkspace = lazy(() =>
  import('./components/AppWorkspace').then((module) => ({
    default: module.AppWorkspace,
  }))
);

const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((module) => ({
    default: module.AuthPage,
  }))
);

const App: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const authMode = new URLSearchParams(location.search).get('mode');
  const isResetRoute = location.pathname === '/auth' && authMode === 'reset';

  useEffect(() => {
    let isMounted = true;

    const syncCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    const queueUserSync = () => {
      window.setTimeout(() => {
        void syncCurrentUser();
      }, 0);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsPasswordRecovery(false);
        setIsAuthLoading(false);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        queueUserSync();
        return;
      }

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        queueUserSync();
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setIsPasswordRecovery(false);
    }
  };

  const handleAuthenticated = (nextUser: AuthUser) => {
    setUser(nextUser);
    setIsPasswordRecovery(false);
  };

  const handlePasswordResetComplete = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    setIsPasswordRecovery(false);
  };

  const handleUserUpdated = (nextUser: AuthUser) => {
    setUser(nextUser);
  };

  const sitePage = useMemo(
    () => (content: React.ReactNode) => <SiteLayout user={user}>{content}</SiteLayout>,
    [user]
  );

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-card w-full max-w-sm rounded-[30px] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(64,214,195,0.16)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-primary/90">Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Starting up</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Loading your creative environment and syncing account access.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="surface-card rounded-[28px] px-8 py-7 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-primary/90">Loading</p>
            <p className="mt-2 text-sm text-muted">Preparing the next screen.</p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={sitePage(<HomePage />)} />
        <Route path="/features" element={sitePage(<FeaturesPage />)} />
        <Route path="/pricing" element={sitePage(<PricingPage />)} />
        <Route path="/about" element={sitePage(<AboutPage />)} />
        <Route path="/contact" element={sitePage(<ContactPage />)} />
        <Route path="/privacy" element={sitePage(<PrivacyPage />)} />
        <Route path="/terms" element={sitePage(<TermsPage />)} />

        <Route
          path="/auth"
          element={
            user && !isPasswordRecovery && !isResetRoute ? (
              <Navigate to="/app" replace />
            ) : (
              <AuthPage
                onAuthenticated={handleAuthenticated}
                onPasswordResetComplete={handlePasswordResetComplete}
                isPasswordRecovery={isPasswordRecovery || isResetRoute}
              />
            )
          }
        />

        <Route
          path="/app/*"
          element={
            user ? (
              <AppWorkspace user={user} onLogout={handleLogout} onUserUpdated={handleUserUpdated} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
