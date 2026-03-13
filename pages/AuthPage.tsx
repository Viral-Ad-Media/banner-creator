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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
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
