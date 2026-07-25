"use client";

import { useState, useEffect } from "react";
import { Menu, LogOut, User as UserIcon, Sun, Moon, Compass, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import type { Session } from "@/lib/data";
import { useRouter } from "next/navigation";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";

function ThemeIcon({ theme }: { theme: UiTheme }) {
  if (theme === "light") return <Sun className="h-4 w-4" />;
  if (theme === "architect") return <Compass className="h-4 w-4" />;
  if (theme === "slate") return <Cloud className="h-4 w-4" />;
  return <Moon className="h-4 w-4" />;
}

function themeLabel(theme: UiTheme): string {
  if (theme === "light") return "Light";
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
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
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
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
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
        <Badge variant="outline" className="gap-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          System Online
        </Badge>
        {session && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Open profile"
            >
              <UserIcon className="h-4 w-4" />
              <span className="font-medium">{session.name}</span>
              <Badge variant="secondary" className="text-xs">
                {session.role}
              </Badge>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
