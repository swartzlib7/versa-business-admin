export const UI_THEMES = ["light", "dusk", "slate", "dark", "architect"] as const;

export type UiTheme = (typeof UI_THEMES)[number];

export function isUiTheme(value: string): value is UiTheme {
  return (UI_THEMES as readonly string[]).includes(value);
}

export function normalizeUiTheme(value: unknown, fallback: UiTheme = "dark"): UiTheme {
  return typeof value === "string" && isUiTheme(value) ? value : fallback;
}
