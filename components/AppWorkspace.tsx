import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  Activity,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "../services/authService";
import {
  getOnboardingState,
  markTourCompleted,
  markWelcomeSeen,
  resetTour,
} from "../services/onboardingState";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Spinner } from "./ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "./ui/sheet";
import { Wordmark } from "./BrandMark";
import { ProductTour } from "./onboarding/ProductTour";
import { WelcomeModal } from "./onboarding/WelcomeModal";

const CopyGenerator = lazy(() =>
  import("./CopyGenerator").then((module) => ({
    default: module.CopyGenerator,
  })),
);

const ImageStudio = lazy(() =>
  import("./ImageStudio").then((module) => ({
    default: module.ImageStudio,
  })),
);

const AvatarStudioPanel = lazy(() =>
  import("./workspace/AvatarStudioPanel").then((module) => ({
    default: module.AvatarStudioPanel,
  })),
);

const ActivitiesPanel = lazy(() =>
  import("./workspace/ActivitiesPanel").then((module) => ({
    default: module.ActivitiesPanel,
  })),
);

const SettingsPanel = lazy(() =>
  import("./workspace/SettingsPanel").then((module) => ({
    default: module.SettingsPanel,
  })),
);

const VideoGeneratorPanel = lazy(() =>
  import("./workspace/VideoGeneratorPanel").then((module) => ({
    default: module.VideoGeneratorPanel,
  })),
);

type WorkspaceNavItem = {
  id:
    | "banner-generator"
    | "avatar-studio"
    | "image-studio"
    | "video-generator"
    | "activities"
    | "settings";
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
};

const workspaceNav: WorkspaceNavItem[] = [
  {
    id: "banner-generator",
    label: "Banner Generator",
    description: "Write a brief, get copy and banners in every format",
    to: "/app/banner-generator",
    icon: LayoutTemplate,
  },
  {
    id: "avatar-studio",
    label: "Avatar Studio",
    description: "Characters you can reuse in banners, edits and video",
    to: "/app/avatar-studio",
    icon: UserRound,
  },
  {
    id: "image-studio",
    label: "Image Studio",
    description: "Change a picture by describing the change",
    to: "/app/image-studio",
    icon: ImageIcon,
  },
  {
    id: "video-generator",
    label: "Video Generator",
    description: "Clips from a prompt, a still or an avatar",
    to: "/app/video-generator",
    icon: Video,
    badge: "Beta",
  },
  {
    id: "activities",
    label: "Activities",
    description: "Every run, its status and the credits it used",
    to: "/app/activities",
    icon: Activity,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Profile, plan and credits",
    to: "/app/settings",
    icon: Settings,
  },
];

interface AppWorkspaceProps {
  user: AuthUser;
  onLogout: () => Promise<void>;
  onUserUpdated: (user: AuthUser) => void;
}

const DESKTOP_QUERY = "(min-width: 1024px)";

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
};

const PLAN_LABEL: Record<AuthUser["plan"], string> = {
  FREE: "Free plan",
  PRO: "Pro plan",
  ENTERPRISE: "Enterprise plan",
};

const SidebarContents: React.FC<{
  user: AuthUser;
  onLogout: () => Promise<void>;
  tourTargets: boolean;
}> = ({ user, onLogout, tourTargets }) => (
  <div className="flex h-full flex-col">
    <div className="flex h-14 items-center px-3">
      <Wordmark />
    </div>

    <nav aria-label="Workspace" className="mt-4 flex-1 space-y-0.5 overflow-y-auto">
      {workspaceNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.description}
            data-tour={tourTargets ? `nav-${item.id}` : undefined}
            className={({ isActive }) =>
              cn(
                "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
                isActive
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[11px] font-medium text-muted-foreground">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        );
      })}
    </nav>

    <div className="mt-4 border-t border-border pt-4">
      <div className="px-3">
        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {user.email} · {PLAN_LABEL[user.plan]}
        </p>
      </div>
      <Button
        variant="ghost"
        onClick={() => void onLogout()}
        className="mt-2 w-full justify-start px-3"
      >
        <LogOut />
        Log out
      </Button>
    </div>
  </div>
);

export const AppWorkspace: React.FC<AppWorkspaceProps> = ({
  user,
  onLogout,
  onUserUpdated,
}) => {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isTourRunning, setIsTourRunning] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setIsWelcomeOpen(!getOnboardingState(user.id).hasSeenWelcome);
  }, [user.id]);

  const handleWelcomeComplete = () => {
    const state = markWelcomeSeen(user.id);
    setIsWelcomeOpen(false);

    if (!state.hasCompletedTour) {
      setIsSidebarOpen(true);
      setIsTourRunning(true);
    }
  };

  const handleTourFinish = () => {
    markTourCompleted(user.id);
    setIsTourRunning(false);
    setIsSidebarOpen(false);
  };

  const handleReplayTour = () => {
    resetTour(user.id);
    setIsSidebarOpen(true);
    setIsTourRunning(true);
  };

  const mobileNavItemIds: WorkspaceNavItem["id"][] = [
    "banner-generator",
    "avatar-studio",
    "image-studio",
    "video-generator",
  ];
  const mobileNavItems = mobileNavItemIds
    .map((itemId) => workspaceNav.find((item) => item.id === itemId))
    .filter((item): item is WorkspaceNavItem => Boolean(item));

  const current =
    workspaceNav.find((item) => location.pathname.startsWith(item.to)) ??
    workspaceNav[0];

  return (
    <div className="min-h-screen bg-background">
      <WelcomeModal
        open={isWelcomeOpen}
        userName={user.name}
        onComplete={handleWelcomeComplete}
      />
      <ProductTour run={isTourRunning} onFinish={handleTourFinish} />

      {isDesktop ? (
        <aside className="fixed inset-y-0 left-0 z-30 w-60 border-r border-border bg-background px-3 py-3">
          <SidebarContents user={user} onLogout={onLogout} tourTargets />
        </aside>
      ) : (
        // While the tour runs the sheet is non-modal, so the tour's own controls stay clickable.
        <Sheet
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          modal={!isTourRunning}
        >
          <SheetContent side="left" className="w-[280px] gap-0 px-3 py-3" showCloseButton={!isTourRunning}>
            <SheetTitle className="sr-only">Workspace menu</SheetTitle>
            <SheetDescription className="sr-only">
              Move between the workspace tools
            </SheetDescription>
            <SidebarContents user={user} onLogout={onLogout} tourTargets />
          </SheetContent>
        </Sheet>
      )}

      <div className="lg:pl-60">
        <header className="flex items-end justify-between gap-4 px-4 pb-4 pt-5 sm:px-6 lg:px-8 lg:pt-7">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] text-foreground">
              {current.label}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {current.description}
            </p>
          </div>
        </header>

        <main className="px-3 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          <Suspense
            fallback={
              <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-card">
                <Spinner className="size-5 text-muted-foreground" />
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
                  />
                }
              />
              <Route path="avatar-studio" element={<AvatarStudioPanel />} />
              <Route
                path="image-studio"
                element={
                  <ImageStudio
                    draftStorageKey={`social-studio:image-studio:${user.id}`}
                  />
                }
              />
              <Route
                path="video-generator"
                element={
                  <VideoGeneratorPanel
                    draftStorageKey={`social-studio:video-generator:${user.id}`}
                  />
                }
              />
              <Route path="activities" element={<ActivitiesPanel />} />
              <Route
                path="settings"
                element={
                  <SettingsPanel
                    user={user}
                    onUserUpdated={onUserUpdated}
                    onReplayTour={handleReplayTour}
                  />
                }
              />
              <Route path="*" element={<Navigate to="banner-generator" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {!isDesktop && (
        <nav
          aria-label="Workspace shortcuts"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "pressable flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-[18px]" />
                <span className="truncate">
                  {item.label.replace(" Generator", "").replace(" Studio", "")}
                </span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open workspace menu"
            className="pressable flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-muted-foreground"
          >
            <Menu className="size-[18px]" />
            <span className="truncate">More</span>
          </button>
        </nav>
      )}
    </div>
  );
};
