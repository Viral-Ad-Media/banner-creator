import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  Activity,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserCircle2,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { AuthUser } from '../services/authService';
import { Button } from './ui/Button';

const CopyGenerator = lazy(() =>
  import('./CopyGenerator').then((module) => ({
    default: module.CopyGenerator,
  }))
);

const ImageStudio = lazy(() =>
  import('./ImageStudio').then((module) => ({
    default: module.ImageStudio,
  }))
);

const ActivitiesPanel = lazy(() =>
  import('./workspace/ActivitiesPanel').then((module) => ({
    default: module.ActivitiesPanel,
  }))
);

const SettingsPanel = lazy(() =>
  import('./workspace/SettingsPanel').then((module) => ({
    default: module.SettingsPanel,
  }))
);

const VideoGeneratorPanel = lazy(() =>
  import('./workspace/VideoGeneratorPanel').then((module) => ({
    default: module.VideoGeneratorPanel,
  }))
);

type WorkspaceNavItem = {
  id: 'banner-generator' | 'image-studio' | 'video-generator' | 'activities' | 'settings';
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
};

const workspaceNav: WorkspaceNavItem[] = [
  {
    id: 'banner-generator',
    label: 'Banner Generator',
    description: 'Create campaign copy and visuals',
    to: '/app/banner-generator',
    icon: LayoutTemplate,
  },
  {
    id: 'image-studio',
    label: 'Image Studio',
    description: 'Edit uploaded images with AI',
    to: '/app/image-studio',
    icon: ImageIcon,
  },
  {
    id: 'video-generator',
    label: 'Video Generator',
    description: 'Prepare motion workflows',
    to: '/app/video-generator',
    icon: Video,
    badge: 'Soon',
  },
  {
    id: 'activities',
    label: 'Activities',
    description: 'Review generation history',
    to: '/app/activities',
    icon: Activity,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Profile, plan, and workspace setup',
    to: '/app/settings',
    icon: Settings,
  },
];

interface AppWorkspaceProps {
  user: AuthUser;
  onLogout: () => Promise<void>;
  onUserUpdated: (user: AuthUser) => void;
}

export const AppWorkspace: React.FC<AppWorkspaceProps> = ({ user, onLogout, onUserUpdated }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const activeItem = workspaceNav.find((item) => location.pathname === item.to) ?? workspaceNav[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),transparent_28%),linear-gradient(180deg,#050505_0%,#09090b_100%)] font-sans selection:bg-primary/30">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="mx-auto max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex min-h-[calc(100vh-2rem)] gap-6">
          <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-white/8 bg-[#09090bdd] p-4 backdrop-blur-2xl transition-transform duration-300 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:translate-x-0 lg:rounded-[32px] lg:border lg:bg-surface/80 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between rounded-3xl border border-white/8 bg-white/5 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/60 to-indigo-500/60 blur-md" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111114]">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-primary">Workspace</p>
                  <h1 className="text-lg font-semibold text-white">Social Studio</h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-xl p-2 text-muted transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-[28px] border border-white/8 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2">
                <span className="text-xs uppercase tracking-[0.24em] text-primary">Plan</span>
                <span className="text-sm font-semibold text-white">{user.plan}</span>
              </div>
            </div>

            <nav className="mt-5 flex-1 space-y-2">
              {workspaceNav.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-start gap-3 rounded-[24px] border px-4 py-4 transition-all ${
                        isActive
                          ? 'border-primary/25 bg-primary/10 shadow-lg shadow-primary/10'
                          : 'border-white/0 text-muted hover:border-white/10 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                            isActive ? 'bg-primary text-white' : 'bg-white/5 text-muted group-hover:text-white'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                            {item.badge && (
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-primary">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 text-xs leading-5 ${isActive ? 'text-white/70' : 'text-muted'}`}>{item.description}</p>
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-5 rounded-[28px] border border-white/8 bg-black/20 p-4">
              <Button variant="secondary" onClick={() => void onLogout()} className="w-full justify-center">
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
          </aside>

          <div className="min-w-0 flex-1 lg:pl-0">
            <header className="sticky top-4 z-30 rounded-[30px] border border-white/10 bg-black/35 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-3 text-white lg:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </button>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-primary">Current Section</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{activeItem.label}</h2>
                    <p className="mt-1 text-sm text-muted">{activeItem.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted">
                    Signed in as <span className="text-white">{user.name}</span>
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    {user.plan} workspace
                  </span>
                </div>
              </div>
            </header>

            <main className="mt-6">
              <Suspense
                fallback={
                  <div className="flex min-h-[360px] items-center justify-center rounded-[32px] border border-white/8 bg-surface/60">
                    <div className="text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="mt-3 text-sm text-muted">Loading workspace...</p>
                    </div>
                  </div>
                }
              >
                <Routes>
                  <Route index element={<Navigate to="banner-generator" replace />} />
                  <Route
                    path="banner-generator"
                    element={<CopyGenerator draftStorageKey={`social-studio:banner-workspace-draft:${user.id}`} />}
                  />
                  <Route path="image-studio" element={<ImageStudio />} />
                  <Route
                    path="video-generator"
                    element={<VideoGeneratorPanel draftStorageKey={`social-studio:video-generator:${user.id}`} />}
                  />
                  <Route path="activities" element={<ActivitiesPanel />} />
                  <Route path="settings" element={<SettingsPanel user={user} onUserUpdated={onUserUpdated} />} />
                  <Route path="*" element={<Navigate to="banner-generator" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
