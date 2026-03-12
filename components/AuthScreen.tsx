import React, { useEffect, useState } from 'react';
import { Lock, Mail, Sparkles, User } from 'lucide-react';
import { Button } from './ui/Button';
import { loginUser, registerUser } from '../services/authService';
import type { AuthUser } from '../services/authService';

type Mode = 'login' | 'register';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  initialMode?: Mode;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, initialMode = 'login' }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
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

        <div className="flex p-1 rounded-lg bg-black/30 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              mode === 'login' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              mode === 'register' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

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

          <label className="block space-y-1">
            <span className="text-xs text-muted">Password</span>
            <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2">
              <Lock className="w-4 h-4 text-muted" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                type="password"
                className="w-full bg-transparent outline-none text-sm text-white"
                placeholder="********"
              />
            </div>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" isLoading={isLoading} className="w-full">
            {mode === 'register' ? 'Create Account' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};
