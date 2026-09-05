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

export type UiTheme = "light" | "dusk" | "slate" | "dark" | "architect";
export type PublicUiTheme = "architect" | "slate" | "dark";

export const PUBLIC_THEMES: PublicUiTheme[] = ["architect", "slate", "dark"];
export const PUBLIC_DEFAULT_THEME: PublicUiTheme = "dark";

const STORAGE_KEY = "versa-ui-theme";
const PUBLIC_STORAGE_KEY = "versa-public-ui-theme";

function isPublicTheme(theme: string): theme is PublicUiTheme {
  return theme === "architect" || theme === "slate" || theme === "dark";
}

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/terms" || pathname === "/board";
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

function readStoredPublicTheme(): PublicUiTheme {
  try {
    const stored = localStorage.getItem(PUBLIC_STORAGE_KEY);
    if (stored && isPublicTheme(stored)) return stored;
  } catch {
    /* ignore */
  }
  return PUBLIC_DEFAULT_THEME;
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [theme, setThemeState] = useState<UiTheme>("dark");

  useEffect(() => {
    if (isPublicPath(pathname)) {
      const next = readStoredPublicTheme();
      setThemeState(next);
      applyThemeClass(next);
      return;
    }
    const initial = readStoredTheme();
    setThemeState(initial);
    applyThemeClass(initial);
  }, [pathname]);

  const setTheme = useCallback((t: UiTheme) => {
    setThemeState(t);
    persistSurface(t, "operator");
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const order: UiTheme[] = ["light", "dusk", "slate", "dark", "architect"];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      persistSurface(next, "operator");
      return next;
    });
  }, []);

  const cyclePublicTheme = useCallback(() => {
    setThemeState((prev) => {
      const cur = isPublicTheme(prev) ? prev : PUBLIC_DEFAULT_THEME;
      const next = PUBLIC_THEMES[(PUBLIC_THEMES.indexOf(cur) + 1) % PUBLIC_THEMES.length];
      persistSurface(next, "public");
      return next;
    });
  }, []);

  const ensurePublicTheme = useCallback(() => {
    const next = readStoredPublicTheme();
    setThemeState(next);
    persistSurface(next, "public");
  }, []);

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
