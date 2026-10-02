"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { isUiTheme, UI_THEMES, type UiTheme } from "@/lib/ui-themes";

export type { UiTheme } from "@/lib/ui-themes";
export type PublicUiTheme = UiTheme;

export const PUBLIC_THEMES: UiTheme[] = [...UI_THEMES];
export const PUBLIC_DEFAULT_THEME: UiTheme = "dark";

const STORAGE_KEY = "versa-ui-theme";
const PUBLIC_STORAGE_KEY = "versa-public-ui-theme";

function isPublicTheme(theme: string): theme is UiTheme {
  return isUiTheme(theme);
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/terms" ||
    pathname === "/board" ||
    pathname === "/p" ||
    pathname.startsWith("/p/")
  );
}

type ThemeContextValue = {
  theme: UiTheme;
  setTheme: (t: UiTheme) => void;
  cycleTheme: () => void;
  cyclePublicTheme: () => void;
  ensurePublicTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(theme: UiTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "architect", "slate", "dusk");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "architect") root.classList.add("architect");
  if (theme === "slate") root.classList.add("slate");
  if (theme === "dusk") root.classList.add("dusk");
  root.dataset.theme = theme;
}

function readStoredTheme(): UiTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dusk" || v === "dark" || v === "architect" || v === "slate") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

function readStoredPublicTheme(fallback: UiTheme): UiTheme {
  try {
    const stored = localStorage.getItem(PUBLIC_STORAGE_KEY);
    if (stored && isPublicTheme(stored)) return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}

function persistSurface(next: UiTheme, surface: "public" | "operator") {
  applyThemeClass(next);
  try {
    if (surface === "public") {
      localStorage.setItem(PUBLIC_STORAGE_KEY, next);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({
  children,
  defaultPublicTheme = PUBLIC_DEFAULT_THEME,
}: {
  children: ReactNode;
  defaultPublicTheme?: UiTheme;
}) {
  const pathname = usePathname() ?? "";
  const [theme, setThemeState] = useState<UiTheme>("dark");

  useEffect(() => {
    if (isPublicPath(pathname)) {
      const next = readStoredPublicTheme(defaultPublicTheme);
      setThemeState(next);
      applyThemeClass(next);
      return;
    }
    const initial = readStoredTheme();
    setThemeState(initial);
    applyThemeClass(initial);
  }, [pathname, defaultPublicTheme]);

  const setTheme = useCallback((t: UiTheme) => {
    setThemeState(t);
    persistSurface(t, "operator");
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = UI_THEMES[(UI_THEMES.indexOf(prev) + 1) % UI_THEMES.length];
      persistSurface(next, "operator");
      return next;
    });
  }, []);

  const cyclePublicTheme = useCallback(() => {
    setThemeState((prev) => {
      const cur = isPublicTheme(prev) ? prev : defaultPublicTheme;
      const next = UI_THEMES[(UI_THEMES.indexOf(cur) + 1) % UI_THEMES.length];
      persistSurface(next, "public");
      return next;
    });
  }, [defaultPublicTheme]);

  const ensurePublicTheme = useCallback(() => {
    const next = readStoredPublicTheme(defaultPublicTheme);
    setThemeState(next);
    persistSurface(next, "public");
  }, [defaultPublicTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme, cyclePublicTheme, ensurePublicTheme }),
    [theme, setTheme, cycleTheme, cyclePublicTheme, ensurePublicTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useUiTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useUiTheme must be used within ThemeProvider");
  }
  return ctx;
}
