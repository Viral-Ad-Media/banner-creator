import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react';
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

const inputShellClass =
  'flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 transition-colors focus-within:border-primary/30 focus-within:bg-white/6';

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
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{label}</span>
      <div className={inputShellClass}>
        <Lock className="h-4 w-4 text-primary/80" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          type={visible ? 'text' : 'password'}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-muted transition-colors hover:text-white"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    <div className="flex min-h-screen items-center justify-center py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,25,35,0.94),rgba(8,16,24,0.92))] shadow-[0_40px_120px_-50px_rgba(0,0,0,0.82)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative hidden overflow-hidden border-r border-white/10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(64,214,195,0.24),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(255,177,102,0.2),transparent_30%),linear-gradient(180deg,rgba(9,19,27,0.96),rgba(8,15,22,0.88))]" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div>
              <span className="section-kicker">
                <Sparkles className="h-4 w-4" />
                Secure Access
              </span>
              <h1 className="mt-8 max-w-sm text-5xl font-semibold leading-tight text-white">
                Build social campaigns without breaking your creative flow.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-[#c2d2df]">
                Sign in to manage banners, avatars, image edits, and video experiments from one focused workspace.
              </p>
            </div>

            <div className="space-y-4">
              {[
                'Campaign planning, visuals, and editing stay in one system.',
                'Account data and API access stay protected behind Supabase auth.',
                'Recovery flow and password reset are built directly into the product.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-sm leading-6 text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#83efe0_0%,#48d9c8_42%,#168d87_100%)] text-[#04161a]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary/90">Social Studio</p>
                <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
              </div>
            </div>

            {mode === 'login' || mode === 'register' ? (
              <div className="mb-7 flex rounded-full border border-white/10 bg-black/20 p-1.5">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                    mode === 'login' ? 'bg-primary/14 text-primary' : 'text-muted hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                    mode === 'register' ? 'bg-primary/14 text-primary' : 'text-muted hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="mb-7 flex items-center justify-between">
                <p className="text-sm text-white">{mode === 'forgot' ? 'Reset your password' : 'Choose a new password'}</p>
                {!isPasswordRecovery && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs font-semibold uppercase tracking-[0.24em] text-primary transition-colors hover:text-white"
                  >
                    Back to login
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Name</span>
                  <div className={inputShellClass}>
                    <User className="h-4 w-4 text-primary/80" />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      minLength={2}
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted"
                      placeholder="Your name"
                    />
                  </div>
                </label>
              )}

              {mode !== 'reset' && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Email</span>
                  <div className={inputShellClass}>
                    <Mail className="h-4 w-4 text-primary/80" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      type="email"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted"
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

              {notice && (
                <p className="rounded-[18px] border border-emerald-400/15 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-200">
                  {notice}
                </p>
              )}
              {error && (
                <p className="rounded-[18px] border border-red-400/15 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}

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
                  className="w-full text-center text-xs font-semibold uppercase tracking-[0.24em] text-primary transition-colors hover:text-white"
                >
                  Forgot password?
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
