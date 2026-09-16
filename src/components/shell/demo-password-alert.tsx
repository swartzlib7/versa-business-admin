"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useSiteMode } from "./site-mode-provider";

/** Shown in the operator shell while Demo mode is on — first-install password change. */
export function DemoPasswordAlert() {
  const { demo_mode } = useSiteMode();
  if (!demo_mode) return null;
  return (
    <div
      role="alert"
      className="flex gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm lg:px-6"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p>
        Demo mode is on. Change the <span className="font-medium">Administrator</span> (human)
        and <span className="font-medium">COA</span> (agent) passwords after first login — then
        turn Demo mode off in Settings → Modes.{" "}
        <Link href="/users" className="font-medium underline underline-offset-2">
          Open Users
        </Link>
      </p>
    </div>
  );
}
