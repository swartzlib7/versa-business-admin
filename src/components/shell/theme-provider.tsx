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

export type UiTheme = "light" | "dark" | "architect" | "slate";

const STORAGE_KEY = "versa-ui-theme";

type ThemeContextValue = {
  theme: UiTheme;
  setTheme: (t: UiTheme) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(theme: UiTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "architect", "slate");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "architect") root.classList.add("architect");
  if (theme === "slate") root.classList.add("slate");
  root.dataset.theme = theme;
}

function readStoredTheme(): UiTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "architect" || v === "slate") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<UiTheme>("dark");

  useEffect(() => {
    const initial = readStoredTheme();
    setThemeState(initial);
    applyThemeClass(initial);
  }, []);

  const setTheme = useCallback((t: UiTheme) => {
    setThemeState(t);
    applyThemeClass(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const order: UiTheme[] = ["light", "dark", "slate", "architect"];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      applyThemeClass(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme],
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
