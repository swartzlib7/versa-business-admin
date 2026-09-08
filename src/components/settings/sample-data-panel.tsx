"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type SampleStatus = {
  inserted: boolean;
  org_count: number;
  record_count: number;
  user_count?: number;
  created_orgs?: number;
  created_records?: number;
  created_users?: number;
  deleted_orgs?: number;
  deleted_records?: number;
  deleted_users?: number;
};

export function SampleDataPanel() {
  const [status, setStatus] = useState<SampleStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const run = async (action: "insert" | "delete") => {
    if (action === "delete" && status?.inserted) {
      const ok = window.confirm(
        "Delete all sample organizations, users, and records tagged ba_sample:? The Primary Org, Administrator, and COA accounts are never deleted.",
      );
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Sample data request failed.");
        return;
      }
      setStatus(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inserted = status?.inserted === true;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-lg space-y-1">
          <p className="text-sm font-medium">Sample data</p>
          <p className="text-sm text-muted-foreground">
            Inserts live collaboration parties, member users, and records tagged{" "}
            <code className="text-xs">ba_sample:</code> (vendor, customer,
            partner, branch, location, product, transaction, task,
            integration, staff, contact, project, and demo humans/agents). The
            packaged database ships empty except the Primary Org, the
            Administrator human, the COA agent, and the pre-configured catalog —
            demo content arrives only here. Not Demo mode: Demo only changes
            the visitor site fixtures and never writes these rows. After an
            AGi Org migration, disable the built-in AGi Org module so the two
            catalogs do not both own the same parties.
          </p>
          <p className="text-xs text-muted-foreground">
            {status
              ? inserted
                ? `Inserted — ${status.org_count} sample orgs, ${status.user_count ?? 0} sample users, ${status.record_count} sample records.`
                : "No sample rows in the live store."
              : "Checking…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy || inserted}
            onClick={() => void run("insert")}
          >
            Insert sample data
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !inserted}
            onClick={() => void run("delete")}
          >
            Delete sample data
          </Button>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Separator />
    </div>
  );
}
