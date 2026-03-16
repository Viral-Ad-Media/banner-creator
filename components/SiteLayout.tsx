import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
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
      <header className="sticky top-0 z-50 px-4 pb-2 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="surface-card-strong flex items-center justify-between rounded-[30px] px-4 py-3 sm:px-5">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#83efe0_0%,#48d9c8_42%,#168d87_100%)] text-[#04161a] shadow-[0_16px_32px_-18px_rgba(64,214,195,0.9)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-primary/90">Creative OS</span>
                <span className="block text-lg font-semibold tracking-tight text-white">
                  Social <span className="font-serif italic text-[#ffd8ad]">Studio</span>
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm transition-all ${
                      isActive
                        ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                        : 'text-muted hover:bg-white/6 hover:text-white'
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
                  className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/16 hover:text-white"
                >
                  Open App
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="hidden rounded-full border border-white/12 px-4 py-2 text-sm text-muted transition-all hover:border-white/20 hover:bg-white/6 hover:text-white sm:inline-flex"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#83efe0_0%,#48d9c8_42%,#168d87_100%)] px-4 py-2 text-sm font-semibold text-[#04161a] shadow-[0_18px_32px_-18px_rgba(64,214,195,0.85)] transition-transform hover:-translate-y-0.5"
                  >
                    Start Free
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(64,214,195,0.16),transparent_58%)]" />
        {children}
      </main>

      <footer className="mt-24 px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="surface-card rounded-[32px] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary/90">Social Studio</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                  Campaign planning, image generation, editing, and motion workflows in one focused creative workspace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link to="/privacy" className="text-muted transition-colors hover:text-white">
                  Privacy
                </Link>
                <Link to="/terms" className="text-muted transition-colors hover:text-white">
                  Terms
                </Link>
                <span className="text-muted/80">© {new Date().getFullYear()} Social Studio</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
