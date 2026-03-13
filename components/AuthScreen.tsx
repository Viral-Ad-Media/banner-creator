import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Sparkles, User } from 'lucide-react';
import { Button } from './ui/Button';
import { loginUser, registerUser, resetPassword, sendPasswordResetEmail } from '../services/authService';
import type { AuthUser } from '../services/authService';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  initialMode?: Mode;
  onPasswordResetComplete: (user: AuthUser | null) => void;
  isPasswordRecovery: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  initialMode = 'login',
  onPasswordResetComplete,
  isPasswordRecovery,
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setMode(isPasswordRecovery ? 'reset' : initialMode);
    setError(null);
    setNotice(isPasswordRecovery ? 'Enter a new password for your account.' : null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [initialMode, isPasswordRecovery]);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setNotice(nextMode === 'forgot' ? 'Enter your email and we will send you a reset link.' : null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const renderPasswordField = ({
    label,
    value,
    onChange,
    visible,
    onToggle,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    visible: boolean;
    onToggle: () => void;
    placeholder: string;
  }) => (
    <label className="block space-y-1">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2">
        <Lock className="w-4 h-4 text-muted" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={8}
          type={visible ? 'text' : 'password'}
          className="w-full bg-transparent outline-none text-sm text-white"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-muted hover:text-white transition-colors"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        await sendPasswordResetEmail(email.trim());
        setNotice('Password reset link sent. Check your inbox and spam folder.');
        return;
      }

      if (mode === 'reset') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const user = await resetPassword(password);
        onPasswordResetComplete(user);
        setNotice(user ? 'Password updated. Redirecting to your workspace.' : 'Password updated. You can log in now.');
        if (!user) {
          switchMode('login');
        }
        return;
      }

      const user =
        mode === 'register'
          ? await registerUser({ name: name.trim(), email: email.trim(), password })
          : await loginUser({ email: email.trim(), password });
      onAuthenticated(user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-surface/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-indigo-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Social Studio SaaS</h1>
            <p className="text-xs text-muted">Secure account required</p>
          </div>
        </div>

        {mode === 'login' || mode === 'register' ? (
          <div className="flex p-1 rounded-lg bg-black/30 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                mode === 'login' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                mode === 'register' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-white">{mode === 'forgot' ? 'Reset your password' : 'Choose a new password'}</p>
            {!isPasswordRecovery && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-primary hover:text-white transition-colors"
              >
                Back to login
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <label className="block space-y-1">
              <span className="text-xs text-muted">Name</span>
              <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-muted" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full bg-transparent outline-none text-sm text-white"
                  placeholder="Your name"
                />
              </div>
            </label>
          )}

          {mode !== 'reset' && (
            <label className="block space-y-1">
              <span className="text-xs text-muted">Email</span>
              <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2">
                <Mail className="w-4 h-4 text-muted" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  className="w-full bg-transparent outline-none text-sm text-white"
                  placeholder="you@company.com"
                />
              </div>
            </label>
          )}

          {mode !== 'forgot' &&
            renderPasswordField({
              label: mode === 'reset' ? 'New Password' : 'Password',
              value: password,
              onChange: setPassword,
              visible: showPassword,
              onToggle: () => setShowPassword((current) => !current),
              placeholder: mode === 'reset' ? 'Enter a new password' : '********',
            })}

          {mode === 'reset' &&
            renderPasswordField({
              label: 'Confirm Password',
              value: confirmPassword,
              onChange: setConfirmPassword,
              visible: showConfirmPassword,
              onToggle: () => setShowConfirmPassword((current) => !current),
              placeholder: 'Confirm your new password',
            })}

          {notice && <p className="text-xs text-emerald-300">{notice}</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" isLoading={isLoading} className="w-full">
            {mode === 'register'
              ? 'Create Account'
              : mode === 'forgot'
                ? 'Send Reset Link'
                : mode === 'reset'
                  ? 'Update Password'
                  : 'Login'}
          </Button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="w-full text-center text-xs text-primary hover:text-white transition-colors"
            >
              Forgot password?
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
