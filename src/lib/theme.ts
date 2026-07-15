// White-label theme tokens — override these to rebrand the admin system.
// Customers set their own logo, colors, and brand name here.

export const theme = {
  brand: {
    name: 'Versa Admin',
    shortName: 'VA',
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
} as const;

export type ThemeConfig = typeof theme;
