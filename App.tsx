import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppWorkspace } from './components/AppWorkspace';
import { SiteLayout } from './components/SiteLayout';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AuthPage } from './pages/AuthPage';
import { getCurrentUser, logoutUser } from './services/authService';
import { supabase } from './services/supabaseClient';
import type { AuthUser } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      }
    });

    void bootstrap();

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
    }
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
        element={user ? <Navigate to="/app" replace /> : <AuthPage onAuthenticated={setUser} />}
      />

      <Route
        path="/app"
        element={user ? <AppWorkspace user={user} onLogout={handleLogout} /> : <Navigate to="/auth" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
