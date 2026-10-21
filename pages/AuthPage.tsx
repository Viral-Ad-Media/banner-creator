import React from 'react';
import { useSearchParams } from 'react-router-dom';
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
    <div className="min-h-screen px-4 sm:px-6 lg:px-8">
      <AuthScreen
        onAuthenticated={onAuthenticated}
        onPasswordResetComplete={onPasswordResetComplete}
        initialMode={initialMode}
        isPasswordRecovery={isPasswordRecovery}
      />
    </div>
  );
};
