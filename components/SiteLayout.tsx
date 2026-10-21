import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, Menu } from "lucide-react";
import type { AuthUser } from "../services/authService";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Wordmark } from "./BrandMark";

interface SiteLayoutProps {
  user: AuthUser | null;
  children: React.ReactNode;
}

const navItems = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm transition-colors duration-150",
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
  );

export const SiteLayout: React.FC<SiteLayoutProps> = ({ user, children }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Social Studio home">
            <Wordmark />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to="/app">Open workspace</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth?mode=register">Start free</Link>
                </Button>
              </>
            )}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs p-6">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Site navigation
                </SheetDescription>
                <Wordmark />
                <nav aria-label="Mobile" className="mt-8 flex flex-col">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex h-12 items-center text-lg",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  {user ? (
                    <Button asChild size="lg">
                      <Link to="/app">Open workspace</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg">
                        <Link to="/auth?mode=register">Start free</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                        <Link to="/auth">Log in</Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-32 border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Write the brief once.
              </p>
              <p className="mt-3 text-base text-muted-foreground">
                Copy, banners in every format, edits and short video from the
                same workspace.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link to={user ? "/app" : "/auth?mode=register"}>
                  {user ? "Open workspace" : "Start free"}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-6 gap-y-3 text-sm"
            >
              {[...navItems, { label: "Privacy", to: "/privacy" }, { label: "Terms", to: "/terms" }].map(
                (item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
          <div className="mt-16 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <Wordmark />
            <span>© {new Date().getFullYear()} Social Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
