"use client";

import { useEffect, useState } from "react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type SampleStatus = {
  inserted: boolean;
  org_count: number;
  record_count: number;
  user_count?: number;
};

export function DemoSampleSwitch({
  demoOn,
  persistDemo,
}: {
  demoOn: boolean;
  persistDemo: (on: boolean) => Promise<void>;
}) {
  const [status, setStatus] = useState<SampleStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offOpen, setOffOpen] = useState(false);

  const refresh = () => {
    fetch("/api/settings/sample-data")
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setStatus(json.data);
      })
      .catch(() => setError("Could not load sample data status."));
  };

  useEffect(() => {
    refresh();
  }, []);

  const run = async (next: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "insert" : "delete" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Sample data request failed.");
        return;
      }
      setStatus(json.data);
      await persistDemo(next);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inserted = status?.inserted === true;
  const on = demoOn || inserted;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-lg space-y-1">
          <p className="text-sm font-medium">Demo with Sample data</p>
          <p className="text-sm text-muted-foreground">
            One switch. On installs the sample pack and shows it on a new
            Demo canvas. Off deletes the sample pack and that canvas. The
            Primary canvas, your own canvases, the Primary Org, Administrator,
            and COA accounts stay.
          </p>
          <p className="text-xs text-muted-foreground">
            {status
              ? inserted
                ? `Sample pack in — ${status.org_count} orgs, ${status.user_count ?? 0} users, ${status.record_count} records.`
                : "No sample rows in the live store."
              : "Checking…"}
          </p>
        </div>
        <BooleanSwitch
          checked={on}
          onChange={(next) => {
            if (busy) return;
            if (!next) {
              setOffOpen(true);
              return;
            }
            void run(true);
          }}
          label={on ? "On" : "Off"}
          labelSide="start"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={offOpen}
        title="Turn off Demo with Sample data"
        description="This permanently deletes sample organizations, users, and records tagged ba_sample:. The Primary Org, Administrator, and COA accounts are never deleted."
        confirmLabel="Turn off"
        tone="danger"
        onCancel={() => setOffOpen(false)}
        onConfirm={() => {
          setOffOpen(false);
          void run(false);
        }}
      />
    </div>
  );
}
