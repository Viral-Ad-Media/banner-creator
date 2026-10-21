import { createAuthSync } from "./services/authSync";
import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { PricingPage } from "./pages/PricingPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { getCurrentUser, logoutUser } from "./services/authService";
import { supabase } from "./services/supabaseClient";
import type { AuthUser } from "./services/authService";
import { Button } from "./components/ui/button";
import { Spinner } from "./components/ui/spinner";
import { Wordmark } from "./components/BrandMark";

// Plain, centred and quiet: the wordmark and one spinner, no copy to read while waiting.
const FullScreenLoader: React.FC<{ label: string }> = ({ label }) => (
  <div
    role="status"
    aria-label={label}
    className="flex min-h-screen flex-col items-center justify-center gap-5"
  >
    <Wordmark />
    <Spinner className="size-5 text-muted-foreground" />
  </div>
);

const AppWorkspace = lazy(() =>
  import("./components/AppWorkspace").then((module) => ({
    default: module.AppWorkspace,
  })),
);

const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((module) => ({
    default: module.AuthPage,
  })),
);

const App: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authRetry, setAuthRetry] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const authMode = new URLSearchParams(location.search).get("mode");
  const isResetRoute = location.pathname === "/auth" && authMode === "reset";

  useEffect(() => {
    let isMounted = true;
    setAuthError(null);
    setIsAuthLoading(true);
    const sync = createAuthSync({
      load: getCurrentUser,
      success: (currentUser) => {
        setUser(currentUser);
        setAuthError(null);
      },
      failure: (error) =>
        setAuthError(
          error instanceof Error
            ? error.message
            : "Could not load your profile.",
        ),
      settled: () => setIsAuthLoading(false),
    });
    const queueUserSync = () => {
      sync.invalidate();
      window.setTimeout(() => {
        void sync.refresh();
      }, 0);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        sync.invalidate();
        setAuthError(null);
        setUser(null);
        setIsPasswordRecovery(false);
        setIsAuthLoading(false);
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        queueUserSync();
        return;
      }

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        queueUserSync();
      }
    });

    return () => {
      isMounted = false;
      sync.dispose();
      authListener.subscription.unsubscribe();
    };
  }, [authRetry]);

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
    () => (content: React.ReactNode) => (
      <SiteLayout user={user}>{content}</SiteLayout>
    ),
    [user],
  );

  if (authError)
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div role="alert" className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <Wordmark />
          <h1 className="mt-6 text-lg font-semibold text-foreground">Couldn't load your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">{authError}</p>
          <Button className="mt-6" onClick={() => setAuthRetry((n) => n + 1)}>
            Try again
          </Button>
        </div>
      </div>
    );
  if (isAuthLoading) {
    return <FullScreenLoader label="Loading your account" />;
  }

  return (
    <Suspense fallback={<FullScreenLoader label="Loading" />}>
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
              <AppWorkspace
                user={user}
                onLogout={handleLogout}
                onUserUpdated={handleUserUpdated}
              />
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
