export const UI_THEMES = ["light", "dusk", "slate", "dark", "architect"] as const;

export type UiTheme = (typeof UI_THEMES)[number];

export function isUiTheme(value: string): value is UiTheme {
  return (UI_THEMES as readonly string[]).includes(value);
}

export function normalizeUiTheme(value: unknown, fallback: UiTheme = "dark"): UiTheme {
  return typeof value === "string" && isUiTheme(value) ? value : fallback;
}

/**
 * 1.0.19: light or dark, for HTML pages that carry their own light and dark
 * designs (`:root[data-theme="dark"]`). Light and Dusk are light; Slate, Dark
 * and Architect are dark.
 */
export function themeFamily(theme: string | undefined | null): "light" | "dark" {
  return theme === "light" || theme === "dusk" ? "light" : "dark";
}

/** Attribute the page boxes (ShadowHtml) carry so the site's theme reaches them. */
export const THEME_HOST_ATTR = "data-vba-theme-host";
