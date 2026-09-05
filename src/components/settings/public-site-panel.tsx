"use client";

import { useEffect, useState } from "react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { Button } from "@/components/ui/button";
import { DEFAULT_CYCLE_STEPS, type CycleStep } from "@/lib/public/site-types";

function emptyStep(index: number): CycleStep {
  return {
    number: String(index + 1).padStart(2, "0"),
    numberEnabled: false,
    title: "",
    titleEnabled: false,
    desc: "",
    descEnabled: false,
    enabled: false,
  };
}

function padSteps(rows: CycleStep[]): CycleStep[] {
  const next = [...rows];
  while (next.length < 10) next.push(emptyStep(next.length));
  return next.slice(0, 10);
}

export function PublicSitePanel() {
  const [cycleEnabled, setCycleEnabled] = useState(true);
  const [steps, setSteps] = useState<CycleStep[]>(() => padSteps(DEFAULT_CYCLE_STEPS));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public-content")
      .then((r) => r.json())
      .then((json) => {
        if (!json?.data) return;
        setCycleEnabled(json.data.cycle_enabled !== false);
        const next = Array.isArray(json.data.cycle_steps)
          ? [...json.data.cycle_steps]
          : [...DEFAULT_CYCLE_STEPS];
        setSteps(padSteps(next as CycleStep[]));
      })
      .catch(() => setError("Could not load cycle strip."));
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

  const update = (index: number, partial: Partial<CycleStep>) => {
    const next = [...steps];
    const merged = { ...next[index], ...partial };
    merged.enabled = merged.numberEnabled || merged.titleEnabled || merged.descEnabled;
    next[index] = merged;
    setSteps(next);
    setSaved(false);
  };

  return (
    <div className="space-y-8">
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
          Up to ten steps. Each cell has its own Yes / No. Turn a cell off to hide
          it on the public page.
        </p>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[auto_4.5rem_auto_1fr_auto_1.4fr]"
            >
              <BooleanSwitch
                checked={step.numberEnabled}
                onChange={(numberEnabled) => update(index, { numberEnabled })}
              />
              <input
                value={step.number}
                placeholder="01"
                onChange={(e) => update(index, { number: e.target.value })}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <BooleanSwitch
                checked={step.titleEnabled}
                onChange={(titleEnabled) => update(index, { titleEnabled })}
              />
              <input
                value={step.title}
                placeholder={`Step ${index + 1} heading`}
                onChange={(e) => update(index, { title: e.target.value })}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <BooleanSwitch
                checked={step.descEnabled}
                onChange={(descEnabled) => update(index, { descEnabled })}
              />
              <input
                value={step.desc}
                placeholder="Short description"
                onChange={(e) => update(index, { desc: e.target.value })}
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
        {saved ? "Saved" : saving ? "Saving…" : "Save cycle strip"}
      </Button>
    </div>
  );
}
