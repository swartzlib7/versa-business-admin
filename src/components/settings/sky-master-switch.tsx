"use client";

import { useEffect, useState } from "react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";

export function SkyMasterSwitch() {
  const [on, setOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("sky"))))
      .then((json: { data?: { sky_enabled?: boolean } }) => {
        setOn(json.data?.sky_enabled !== false);
      })
      .catch(() => setError("Could not load Sky Animation."));
  }, []);

  const toggle = async (next: boolean) => {
    setOn(next);
    setError(null);
    const res = await fetch("/api/settings/system", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sky_enabled: next }),
    });
    if (!res.ok) {
      setOn(!next);
      setError("Could not save Sky Animation.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div>
        <p className="text-sm font-medium">Sky Animation</p>
        <p className="text-xs text-muted-foreground">Off hides the sky on every canvas.</p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <BooleanSwitch checked={on} onChange={(value) => void toggle(value)} label={on ? "On" : "Off"} />
    </div>
  );
}
