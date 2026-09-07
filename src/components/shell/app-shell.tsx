'use client';

import { useEffect, useState } from 'react';
import { Sidebar, SIDEBAR_COLLAPSE_EVENT, readSidebarCollapsed } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  fillViewport = false,
}: {
  children: React.ReactNode;
  /** I5.6.22 — Mission Control: fill viewport height; content can set min-width. */
  fillViewport?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setCollapsed(readSidebarCollapsed());
    sync();
    window.addEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
    return () => window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
  }, []);

  return (
    <div className={cn("flex min-w-[400px]", fillViewport ? "h-svh overflow-hidden" : "min-h-svh")}>
      <div className="hidden lg:block">
        <Sidebar variant="rail" />
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-14" : "lg:pl-56",
          fillViewport ? "min-h-svh lg:h-svh lg:min-h-0 min-w-0" : "min-h-svh"
        )}
      >
        <Header />
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
