'use client';

import { useEffect, useState } from 'react';
import { Sidebar, SIDEBAR_COLLAPSE_EVENT, readSidebarCollapsed } from './sidebar';
import { Header } from './header';
import { DemoPasswordAlert } from './demo-password-alert';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  fillViewport = false,
}: {
  children: React.ReactNode;
  /** I5.6.22 — VBA: fill viewport height; content can set min-width. */
  fillViewport?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setCollapsed(readSidebarCollapsed());
    sync();
    window.addEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
    return () => window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
  }, []);

  // Mobile fit (Stephen 2026-09-14 03:06, iPhone 16 Pro Max): the operator
  // shell must never be wider than the viewport, or Safari zooms the whole
  // page out to fit the document width ("always too big, must pinch out").
  // Flex children default to min-width:auto, so a wide table or header row
  // used to stretch this column past the screen. `min-w-0` on every level of
  // the column lets the `overflow-x-auto` wrappers inside (listing tables,
  // records editor, org board) scroll on their own instead.
  return (
    <div className={cn("flex min-w-0", fillViewport ? "h-svh overflow-hidden" : "min-h-svh")}>
      <div className="hidden lg:block">
        <Sidebar variant="rail" />
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-14" : "lg:pl-56",
          fillViewport ? "min-h-svh lg:h-svh lg:min-h-0" : "min-h-svh"
        )}
      >
        <Header />
        <DemoPasswordAlert />
        <main
          className={cn(
            "flex-1 p-4 lg:p-6",
            fillViewport ? "flex min-h-0 min-w-0 flex-col overflow-y-auto" : "min-w-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
