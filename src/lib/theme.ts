// White-label theme tokens — override these to rebrand the admin system.
// Customers set their own logo, colors, and brand name here.

export const theme = {
  brand: {
    name: 'Northstar Works',
    shortName: 'NW',
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.ico',
  },
  colors: {
    // Primary brand color — used for sidebar accent, buttons, links
    brand: '#6366f1', // indigo-500
    brandForeground: '#ffffff',
    // Sidebar
    sidebarBackground: 'oklch(0.205 0 0)',
    sidebarForeground: 'oklch(0.985 0 0)',
    sidebarAccent: 'oklch(0.269 0 0)',
    // Status colors
    statusActive: '#22c55e',   // green-500
    statusIdle: '#eab308',     // yellow-500
    statusError: '#ef4444',    // red-500
    statusOffline: '#6b7280',  // gray-500
  },
  // 3D Mission Control scene — Versa-branded default.
  // Override these to rebrand the hub visualization for a customer.
  scene: {
    hubName: 'Versa AGi',
    hubSubtitle: 'Mission Control',
    // Hub color — Versa brand indigo
    hubColor: '#6366f1',
    hubGlow: '#818cf8',
    // Ring category colors — must be obvious at a glance
    systemColor: '#3b82f6',   // blue-500 — business systems
    teamColor: '#22c55e',     // green-500 — people / teams
    surfaceColor: '#f59e0b',  // amber-500 — operating surfaces
    // Connection colors (shared defaults; mode palettes can override)
    primaryLinkColor: '#6366f1',
    secondaryLinkColor: '#94a3b8', // slate-400 — triangle links between systems
    // Dark mode scene palette
    dark: {
      background: '#0a0a0f',
      gridMain: '#3f3f55',       // brighter orbital guides (was #1e1e2e — nearly invisible)
      gridSub: '#252533',
      ringGuideColor: '#64748b', // slate-500 — clear circle lines on dark bg
      ringGuideOpacity: 0.55,
      secondaryLinkColor: '#93c5fd', // blue-300 — triangular system links readable in dark
      secondaryLinkOpacity: 0.65,
      primaryLinkOpacity: 0.55,
      labelColor: '#a1a1aa',
      ambientIntensity: 0.3,
      pointLightIntensity: 0.8,
    },
    // Light mode scene palette
    light: {
      background: '#f8f8fb',
      gridMain: '#a1a1aa',
      gridSub: '#d4d4d8',
      ringGuideColor: '#71717a', // zinc-500
      ringGuideOpacity: 0.45,
      secondaryLinkColor: '#3b82f6', // blue-500 triangle
      secondaryLinkOpacity: 0.5,
      primaryLinkOpacity: 0.5,
      labelColor: '#3f3f46',
      ambientIntensity: 0.7,
      pointLightIntensity: 1.0,
    },
  },
} as const;

export type ThemeConfig = typeof theme;
