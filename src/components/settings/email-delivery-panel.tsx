"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelShell } from "@/components/settings/settings-chrome";

type CredentialRow = { id: string; name?: string };

export function EmailDeliveryPanel() {
  const [credentialId, setCredentialId] = useState("");
  const [rows, setRows] = useState<CredentialRow[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/records?type=vendor_credential", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: CredentialRow[] }) => setRows(json.data ?? []))
      .catch(() => setRows([]));
    void fetch("/api/settings/system", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const mail = json?.data?.email_delivery;
        setCredentialId(String(mail?.credential_id ?? ""));
      })
      .catch(() => setError("Could not load e-mail delivery settings."));
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email_delivery: { credential_id: credentialId } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "Save failed.");
        return;
      }
      setNote("Saved. This credential is the system email delivery credential.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell
      summary="This is the system email delivery credential. The mailbox configuration lives on the Credential record. Sending alerts is not built yet."
      badge="Credential"
    >
      <div className="max-w-lg space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Credential</span>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
          >
            <option value="">Select a credential…</option>
            {rows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name || row.id}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">This is the system email delivery credential.</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </PanelShell>
  );
}
