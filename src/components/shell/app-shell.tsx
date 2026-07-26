'use client';

import { Sidebar } from './sidebar';
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
  return (
    <div className={cn("flex", fillViewport ? "h-svh overflow-hidden" : "min-h-svh")}>
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className={cn("flex flex-1 flex-col lg:pl-56", fillViewport ? "min-h-svh lg:h-svh lg:min-h-0 min-w-0" : "min-h-svh")}>
        <Header />
        <main
          className={cn(
            "flex-1 p-4 lg:p-6",
            fillViewport ? "flex min-h-0 min-w-0 flex-col overflow-y-auto lg:overflow-y-auto" : ""
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
