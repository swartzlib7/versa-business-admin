"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/lib/data/types";

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/session", { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json: { data?: Session | null }) => setSession(json.data ?? null))
      .catch(() => setSession(null));
    return () => controller.abort();
  }, []);

  return session;
}
