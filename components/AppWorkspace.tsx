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
  UserRound,
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

const AvatarStudioPanel = lazy(() =>
  import('./workspace/AvatarStudioPanel').then((module) => ({
    default: module.AvatarStudioPanel,
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
  id: 'banner-generator' | 'avatar-studio' | 'image-studio' | 'video-generator' | 'activities' | 'settings';
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
    id: 'avatar-studio',
    label: 'Avatar Studio',
    description: 'Create and manage reusable characters',
    to: '/app/avatar-studio',
    icon: UserRound,
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
    description: 'Create motion clips and image-to-video',
    to: '/app/video-generator',
    icon: Video,
    badge: 'Beta',
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
  const ActiveIcon = activeItem.icon;
  const mobileNavItemIds: WorkspaceNavItem['id'][] = ['banner-generator', 'avatar-studio', 'image-studio', 'video-generator'];
  const mobileNavItems = mobileNavItemIds
    .map((itemId) => workspaceNav.find((item) => item.id === itemId))
    .filter((item): item is WorkspaceNavItem => Boolean(item));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(64,214,195,0.15),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,177,102,0.12),transparent_22%),linear-gradient(180deg,#071219_0%,#0b1620_100%)] font-sans selection:bg-primary/30">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="mx-auto max-w-[1720px] px-3 py-3 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-6">
        <div className="flex min-h-[calc(100vh-2rem)] gap-6">
          <aside
            className={`fixed bottom-3 left-3 top-3 z-50 flex w-[calc(100vw-1.5rem)] max-w-[340px] flex-col transition-transform duration-300 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[298px] lg:max-w-none lg:translate-x-0 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="surface-card-strong flex h-full flex-col overflow-hidden rounded-[34px] border border-white/10 p-4">
              <div className="flex items-center justify-between rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-[22px] bg-[linear-gradient(135deg,rgba(131,239,224,0.65),rgba(22,141,135,0.24))] blur-md" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#0c161d] text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-primary">Workspace</p>
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

              <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
                {workspaceNav.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `group flex items-start gap-3 rounded-[26px] border px-4 py-4 transition-all ${
                          isActive
                            ? 'border-primary/22 bg-[linear-gradient(180deg,rgba(64,214,195,0.12),rgba(64,214,195,0.06))] shadow-[0_18px_40px_-28px_rgba(64,214,195,0.85)]'
                            : 'border-white/0 text-muted hover:border-white/10 hover:bg-white/6 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] ${
                              isActive ? 'bg-primary/18 text-primary' : 'bg-white/5 text-muted group-hover:text-white'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                              {item.badge && (
                                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-primary">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className={`mt-1 text-xs leading-5 ${isActive ? 'text-white/72' : 'text-muted'}`}>{item.description}</p>
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
            </div>
          </aside>

          <div className="min-w-0 flex-1 lg:pl-0">
            <header className="sticky top-4 z-30 overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,30,41,0.9),rgba(10,19,27,0.85))] p-4 shadow-[0_30px_80px_-44px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-5">
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(64,214,195,0.12),transparent_65%)]" />
              <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-3 text-white lg:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </button>

                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/12 text-primary">
                    <ActiveIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Current Section</p>
                    <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">{activeItem.label}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c0d1de]">{activeItem.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[430px]">
                  <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Workspace Owner</p>
                    <p className="mt-2 text-base font-semibold text-white">{user.name}</p>
                    <p className="mt-1 text-sm text-muted">{user.email}</p>
                  </div>
                  <div className="rounded-[24px] border border-primary/15 bg-primary/8 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-primary">Plan Access</p>
                    <p className="mt-2 text-base font-semibold text-white">{user.plan}</p>
                    <p className="mt-1 text-sm text-white/70">Workspace tools, activity, and settings are ready.</p>
                  </div>
                </div>
              </div>
            </header>

            <main className="mt-6">
              <Suspense
                fallback={
                  <div className="surface-card flex min-h-[360px] items-center justify-center rounded-[32px]">
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
                    element={
                      <CopyGenerator
                        draftStorageKey={`social-studio:banner-workspace-draft:${user.id}`}
                        avatarStorageKey={`social-studio:avatars:${user.id}`}
                      />
                    }
                  />
                  <Route
                    path="avatar-studio"
                    element={<AvatarStudioPanel avatarStorageKey={`social-studio:avatars:${user.id}`} />}
                  />
                  <Route
                    path="image-studio"
                    element={<ImageStudio avatarStorageKey={`social-studio:avatars:${user.id}`} />}
                  />
                  <Route
                    path="video-generator"
                    element={
                      <VideoGeneratorPanel
                        draftStorageKey={`social-studio:video-generator:${user.id}`}
                        avatarStorageKey={`social-studio:avatars:${user.id}`}
                      />
                    }
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

      <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
        <div className="surface-card-strong grid grid-cols-5 rounded-[28px] p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-w-0 flex-col items-center gap-1 rounded-[20px] px-2 py-2.5 text-[11px] font-semibold transition-all ${
                    isActive ? 'bg-primary/14 text-primary' : 'text-muted hover:bg-white/6 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label.replace(' Generator', '').replace(' Studio', '')}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex min-w-0 flex-col items-center gap-1 rounded-[20px] px-2 py-2.5 text-[11px] font-semibold text-muted transition-all hover:bg-white/6 hover:text-white"
          >
            <Menu className="h-4 w-4" />
            <span className="truncate">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
