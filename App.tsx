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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted mt-4">Starting workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted mt-3">Loading page...</p>
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
