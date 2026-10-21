import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Wordmark } from './BrandMark';
import { loginUser, registerUser, resetPassword, sendPasswordResetEmail } from '../services/authService';
import type { AuthUser } from '../services/authService';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  initialMode?: Mode;
  onPasswordResetComplete: (user: AuthUser | null) => void;
  isPasswordRecovery: boolean;
}

const TITLES: Record<Mode, { title: string; body: string }> = {
  login: { title: 'Log in', body: 'Pick up your campaigns where you left them.' },
  register: { title: 'Create your account', body: 'Free, with 120 credits to try every tool.' },
  forgot: { title: 'Reset your password', body: 'We will email you a link to choose a new one.' },
  reset: { title: 'Choose a new password', body: 'Use at least 8 characters.' },
};

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
    id,
    label,
    value,
    onChange,
    visible,
    onToggle,
    autoComplete,
    minLength,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    visible: boolean;
    onToggle: () => void;
    autoComplete: string;
    minLength?: number;
  }) => (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={minLength}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="h-11 pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors duration-150 hover:text-foreground"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
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

  const copy = TITLES[mode];

  return (
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-16 py-10 lg:grid-cols-2">
      <div className="hidden lg:block">
        <p className="text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-foreground">
          One brief.
          <br />
          Every format.
        </p>
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-muted-foreground">
          Banners, edits and video from one workspace, on credits you can see.
        </p>
      </div>

      <div className="enter w-full max-w-md justify-self-center rounded-xl border border-border bg-card p-6 sm:p-8 lg:justify-self-end">
        <Link to="/" aria-label="Social Studio home" className="inline-flex">
          <Wordmark />
        </Link>

        {(mode === 'login' || mode === 'register') && (
          <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)} className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <h1 className="mt-8 text-2xl font-semibold tracking-[-0.02em] text-foreground">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {mode === 'register' && (
            <div className="grid gap-2">
              <Label htmlFor="auth-name">Name</Label>
              <Input
                id="auth-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                autoComplete="name"
                className="h-11"
              />
            </div>
          )}

          {mode !== 'reset' && (
            <div className="grid gap-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                className="h-11"
              />
            </div>
          )}

          {mode !== 'forgot' &&
            renderPasswordField({
              id: 'auth-password',
              label: mode === 'reset' ? 'New password' : 'Password',
              value: password,
              onChange: setPassword,
              visible: showPassword,
              onToggle: () => setShowPassword((current) => !current),
              autoComplete: mode === 'login' ? 'current-password' : 'new-password',
              // Existing accounts may predate the 8-character rule; only new passwords enforce it.
              minLength: mode === 'login' ? undefined : 8,
            })}

          {mode === 'reset' &&
            renderPasswordField({
              id: 'auth-password-confirm',
              label: 'Confirm password',
              value: confirmPassword,
              onChange: setConfirmPassword,
              visible: showConfirmPassword,
              onToggle: () => setShowConfirmPassword((current) => !current),
              autoComplete: 'new-password',
              minLength: 8,
            })}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="-mt-1 w-fit text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
            >
              Forgot password?
            </button>
          )}

          <div aria-live="polite">
            {notice && (
              <p className="rounded-md bg-positive/10 px-3 py-2.5 text-sm text-positive">{notice}</p>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
            {mode === 'register'
              ? 'Create account'
              : mode === 'forgot'
                ? 'Send reset link'
                : mode === 'reset'
                  ? 'Update password'
                  : 'Log in'}
          </Button>

          {(mode === 'forgot' || mode === 'reset') && !isPasswordRecovery && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Back to log in
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
