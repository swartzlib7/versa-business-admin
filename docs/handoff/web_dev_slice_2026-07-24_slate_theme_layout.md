# Web-Dev Slice: Slate Theme + Fixed Layout Consistency

**Author:** COA
**Date:** 2026-07-24
**Branch:** agent/web-dev (rebase from beta d1ca6c0)
**Three-gate:** Web-dev delivery -> COA quality review -> Stephen full check

## Context

Stephen confirmed the site is back up but reports two issues:
1. `/users` and `/settings` render nothing (blank pages)
2. Two UI improvement requests (below)

### Blank Pages Root Cause

`/users` and `/settings` are auth-protected routes (see `src/middleware.ts`).
Without a valid session cookie, middleware redirects to `/login?redirect=...`.
The login page (`src/app/login/page.tsx`) uses client-side rendering.
If JS chunks fail to load on the client, the page stays blank (visibility:hidden until hydration).

**Action:** Verify the login page renders correctly. If there is a hydration or chunk-loading issue, fix it. If the redirect itself is the expected behavior (user not logged in), no code change needed — just confirm login flow works end-to-end.

---

## Scope Item 1: New Slate Theme

**Request:** Add a new theme called Slate — between dark and light, using gray shades that look elegant and good.

### Current State

- 3 themes exist: `light`, `dark`, `architect`
- Theme system: `src/components/shell/theme-provider.tsx` (UiTheme type, localStorage, class toggle)
- CSS variables: `src/app/globals.css` (lines 87-170 for dark/architect blocks)
- Theme init script in `src/app/layout.tsx` (inline script reads localStorage)
- Header has theme cycle button: `src/components/shell/header.tsx` (Sun/Moon/Compass icons)
- Settings page has Appearance tab: `src/app/settings/page.tsx`

### Requirements

1. Add `slate` as a 4th theme option in the `UiTheme` type
2. Add `.slate` CSS block in `globals.css` with elegant mid-gray palette:
   - Background: mid-gray (between dark 0.145 and light 1.0 — aim ~0.30-0.35 oklch)
   - Cards: slightly lighter than background
   - Foreground: light gray (not pure white, softer on eyes)
   - Borders: subtle gray with low opacity
   - Sidebar: slightly darker than main background
   - Keep all accent/brand colors the same (indigo)
   - No warm/cool tint — pure neutral gray elegance
3. Update theme init script in `layout.tsx` to recognize `slate`
4. Update `ThemeProvider` to handle `slate` class
5. Update Header theme cycle to include Slate (add appropriate icon — consider `Cloud` or `Palette` from lucide-react)
6. Update Settings > Appearance tab to include Slate option
7. Add `@custom-variant slate (&:is(.slate *));` in globals.css

### Design Reference

```css
.slate {
  --background: oklch(0.32 0 0);
  --foreground: oklch(0.92 0 0);
  --card: oklch(0.36 0 0);
  --card-foreground: oklch(0.92 0 0);
  --popover: oklch(0.34 0 0);
  --popover-foreground: oklch(0.92 0 0);
  --primary: oklch(0.85 0 0);
  --primary-foreground: oklch(0.20 0 0);
  --secondary: oklch(0.40 0 0);
  --secondary-foreground: oklch(0.92 0 0);
  --muted: oklch(0.38 0 0);
  --muted-foreground: oklch(0.65 0 0);
  --accent: oklch(0.40 0 0);
  --accent-foreground: oklch(0.92 0 0);
  --destructive: oklch(0.65 0.20 25);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 12%);
  --ring: oklch(0.55 0 0);
  --sidebar: oklch(0.28 0 0);
  --sidebar-foreground: oklch(0.92 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.36 0 0);
  --sidebar-accent-foreground: oklch(0.92 0 0);
  --sidebar-border: oklch(1 0 0 / 8%);
  --sidebar-ring: oklch(0.55 0 0);
}
```

Tune the exact values for visual elegance. The above is a starting point.

---

## Scope Item 2: Fixed Layout Consistency

**Request:** Clicking any sub-tab (like Policy under Executive) must not lose the Zone heading or shift the tabs higher. We need a consistent layout with fixed areas so users get a stable feel for where elements are while clicking around.

### Current State

- `AppShell` (`src/components/shell/app-shell.tsx`): sidebar + header + main content area
- Header is already sticky (`sticky top-0 z-30`)
- `PageHeader` (`src/components/ui/page-header.tsx`): title + subtitle + badge — NOT sticky
- `SectionTabs` (`src/components/ui/section-tabs.tsx`): tab bar with underline strip — NOT sticky
- Zone views render PageHeader + SectionTabs + content in the main area
- When switching sub-tabs, if content height changes, the page scrolls and the header/tabs shift

### Requirements

1. Make the Zone heading (PageHeader) sticky below the app header
   - App header is h-14 (56px). PageHeader should stick at top-14 (or top-3.5rem)
   - Add `sticky top-14 z-20 bg-background` to PageHeader container
2. Make the SectionTabs bar sticky below the PageHeader
   - Stacked below PageHeader, also sticky
   - Add appropriate sticky positioning so tabs stay visible when scrolling content
3. Ensure the content area below tabs scrolls independently
   - The main content region should allow vertical scroll without moving the header/tabs
4. Test: clicking between sub-tabs (e.g., Policy under Executive) should NOT cause any layout shift
   - Zone heading stays in place
   - Tab bar stays in place
   - Only the content below changes

### Implementation Notes

- The AppShell main area is `flex-1 p-4 lg:p-6`. Consider restructuring to:
  - Sticky PageHeader (top-14, full width of main)
  - Sticky SectionTabs (below PageHeader)
  - Scrollable content region (flex-1 overflow-y-auto)
- Do NOT change the sidebar or app header — those are already stable
- Keep the existing `fillViewport` prop behavior working
- Test with all 4 themes (light, dark, architect, slate)

---

## Out of Scope

- No changes to sidebar navigation structure
- No changes to data/API layer
- No changes to 3D hub visualization
- No new routes or pages
- Do NOT start any hub/32c/Phase 4+ work

## Deliverables

1. Working Slate theme with elegant gray palette
2. Sticky PageHeader + SectionTabs — no layout shift on sub-tab change
3. Login page blank-render issue investigated and fixed (if code issue)
4. All 4 themes tested and working
5. Commit on agent/web-dev branch, rebase from beta d1ca6c0

## Three-Gate Flow

1. Web-dev delivers on agent/web-dev branch
2. COA quality review (build, smoke test, visual check)
3. Stephen full check before promote to beta