"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PublicHeader } from "./public-header";
import { useSiteMode } from "@/components/shell/site-mode-provider";

export function PublicMaintenance({ brandName }: { brandName: string }) {
  const { public_login_enabled } = useSiteMode();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Maintenance
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            {brandName} is paused for a moment.
          </h1>
          <p className="mt-4 text-muted-foreground">
            The public site is in maintenance. Operators can still sign in to
            finish work and turn the site back on.
          </p>
          {public_login_enabled ? (
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
              Sign In
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
