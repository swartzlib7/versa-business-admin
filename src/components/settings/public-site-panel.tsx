"use client";

import { useEffect, useState } from "react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { Button } from "@/components/ui/button";
import { DEFAULT_CYCLE_STEPS, type CycleStep } from "@/lib/public/site-types";

export function PublicSitePanel() {
  const [headline, setHeadline] = useState("");
  const [subhead, setSubhead] = useState("");
  const [cycleEnabled, setCycleEnabled] = useState(true);
  const [steps, setSteps] = useState<CycleStep[]>(DEFAULT_CYCLE_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public-content")
      .then((r) => r.json())
      .then((json) => {
        if (!json?.data) return;
        setHeadline(json.data.hero_headline ?? "");
        setSubhead(json.data.hero_subhead ?? "");
        setCycleEnabled(json.data.cycle_enabled !== false);
        const next = Array.isArray(json.data.cycle_steps)
          ? [...json.data.cycle_steps]
          : [...DEFAULT_CYCLE_STEPS];
        while (next.length < 10) next.push({ title: "", desc: "", enabled: false });
        setSteps(next.slice(0, 10));
      })
      .catch(() => setError("Could not load public content."));
  }, []);

  const persist = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/public-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero_headline: headline,
          hero_subhead: subhead,
          cycle_enabled: cycleEnabled,
          cycle_steps: steps,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error?.message ?? "Save failed.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium">Hero copy</p>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Headline</span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Subhead</span>
          <textarea
            value={subhead}
            onChange={(e) => setSubhead(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">Cycle strip</p>
          <BooleanSwitch
            checked={cycleEnabled}
            onChange={setCycleEnabled}
            label={cycleEnabled ? "On" : "Off"}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Up to ten steps. Turn a step off to hide it on the public page.
        </p>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[auto_1fr_1fr]"
            >
              <BooleanSwitch
                checked={step.enabled}
                onChange={(enabled) => {
                  const next = [...steps];
                  next[index] = { ...step, enabled };
                  setSteps(next);
                }}
              />
              <input
                value={step.title}
                placeholder={`Step ${index + 1} title`}
                onChange={(e) => {
                  const next = [...steps];
                  next[index] = { ...step, title: e.target.value };
                  setSteps(next);
                }}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <input
                value={step.desc}
                placeholder="Short description"
                onChange={(e) => {
                  const next = [...steps];
                  next[index] = { ...step, desc: e.target.value };
                  setSteps(next);
                }}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="button" onClick={() => void persist()} disabled={saving}>
        {saved ? "Saved" : saving ? "Saving…" : "Save public content"}
      </Button>
    </div>
  );
}
