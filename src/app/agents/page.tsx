"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy agents list soft-retired I5.5.1 — agents are users with type=agent. */
export default function AgentsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/users?type=agent");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting to Users (agents)…
    </div>
  );
}
