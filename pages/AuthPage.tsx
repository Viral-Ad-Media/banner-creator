import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthScreen } from '../components/AuthScreen';
import type { AuthUser } from '../services/authService';

interface AuthPageProps {
  onAuthenticated: (user: AuthUser) => void;
  onPasswordResetComplete: (user: AuthUser | null) => void;
  isPasswordRecovery: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthenticated,
  onPasswordResetComplete,
  isPasswordRecovery,
}) => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode =
    modeParam === 'register' || modeParam === 'forgot' || modeParam === 'reset' ? modeParam : 'login';

  return (
    <div className="min-h-screen px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
      <AuthScreen
        onAuthenticated={onAuthenticated}
        onPasswordResetComplete={onPasswordResetComplete}
        initialMode={initialMode}
        isPasswordRecovery={isPasswordRecovery}
      />
    </div>
  );
};
