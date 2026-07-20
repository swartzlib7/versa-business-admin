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
    <div className={cn("flex", fillViewport ? "h-svh min-h-svh overflow-auto" : "min-h-screen")}>
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className={cn("flex flex-1 flex-col lg:pl-56", fillViewport && "min-h-0 min-w-0")}>
        <Header />
        <main
          className={cn(
            "flex-1 p-4 lg:p-6",
            fillViewport && "flex min-h-0 min-w-[800px] flex-col"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
