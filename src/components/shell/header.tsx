"use client";

import { useState, useEffect } from "react";
import { Menu, LogOut, User as UserIcon, Sun, Moon, Compass, Cloud, Sunset, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import type { Session } from "@/lib/data";
import { useRouter } from "next/navigation";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";

function ThemeIcon({ theme }: { theme: UiTheme }) {
  if (theme === "light") return <Sun className="h-4 w-4" />;
  if (theme === "dusk") return <Sunset className="h-4 w-4" />;
  if (theme === "architect") return <Compass className="h-4 w-4" />;
  if (theme === "slate") return <Cloud className="h-4 w-4" />;
  return <Moon className="h-4 w-4" />;
}

function themeLabel(theme: UiTheme): string {
  if (theme === "light") return "Light";
  if (theme === "dusk") return "Dusk";
  if (theme === "architect") return "Architect";
  if (theme === "slate") return "Slate";
  return "Dark";
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const { theme, cycleTheme } = useUiTheme();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((json) => setSession(json.data))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/login");
    router.refresh();
  };

  return (
    // Mobile fit (2026-09-14): below `md` the right-hand cluster collapses to
    // icons (theme, profile, home, sign out) and hides the status badge, so the
    // header never forces the page wider than a phone screen.
    <header className="flex h-14 min-w-0 items-center gap-2 border-b border-border bg-background px-3 sm:gap-4 sm:px-4 lg:px-6">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 lg:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0">
          <Sidebar variant="drawer" />
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1" />
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={cycleTheme}
          className="gap-1.5"
          title={`Theme: ${themeLabel(theme)} (click to cycle)`}
        >
          <ThemeIcon theme={theme} />
          <span className="hidden sm:inline">{themeLabel(theme)}</span>
        </Button>
        <Badge variant="outline" className="hidden gap-1.5 text-xs md:inline-flex">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          System Online
        </Badge>
        {session && (
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={`Open profile — ${session.name} (${session.role})`}
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{session.name}</span>
              <Badge variant="secondary" className="hidden text-xs md:inline-flex">
                {session.role}
              </Badge>
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Open home page"
            >
              <span className="hidden md:inline">Open home page</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
