import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import type { AuthUser } from '../services/authService';

interface SiteLayoutProps {
  user: AuthUser | null;
  children: React.ReactNode;
}

const navItems = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export const SiteLayout: React.FC<SiteLayoutProps> = ({ user, children }) => {
  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-r from-primary to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </span>
            <span className="font-bold text-white tracking-tight">
              Social<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Studio</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive ? 'text-white bg-white/10' : 'text-muted hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/app"
                className="px-4 py-2 rounded-lg text-sm text-white bg-primary/80 hover:bg-primary transition-colors"
              >
                Open App
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-lg text-sm text-muted border border-white/15 hover:text-white hover:border-white/25 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="px-4 py-2 rounded-lg text-sm text-white bg-primary/80 hover:bg-primary transition-colors"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">© {new Date().getFullYear()} Social Studio. AI creative SaaS.</p>
          <div className="flex items-center gap-3 text-xs">
            <Link to="/privacy" className="text-muted hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="text-muted hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
