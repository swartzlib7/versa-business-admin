"use client";

import { useEffect, useState } from "react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelShell } from "@/components/settings/settings-chrome";

type MailForm = {
  enabled: boolean;
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  mailbox: string;
  password_set: boolean;
};

const EMPTY: MailForm = {
  enabled: false,
  host: "",
  port: "993",
  secure: true,
  username: "",
  password: "",
  mailbox: "INBOX",
  password_set: false,
};

export function EmailDeliveryPanel() {
  const [form, setForm] = useState<MailForm>(EMPTY);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/system", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const mail = json?.data?.email_delivery;
        if (!mail) return;
        setForm({
          enabled: mail.enabled === true,
          host: String(mail.host ?? ""),
          port: String(mail.port ?? 993),
          secure: mail.secure !== false,
          username: String(mail.username ?? ""),
          password: "",
          mailbox: String(mail.mailbox ?? "INBOX"),
          password_set: mail.password_set === true,
        });
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
        body: JSON.stringify({
          email_delivery: {
            enabled: form.enabled,
            host: form.host,
            port: Number(form.port) || 993,
            secure: form.secure,
            username: form.username,
            password: form.password,
            mailbox: form.mailbox,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "Save failed.");
        return;
      }
      const mail = json?.data?.email_delivery;
      setForm((cur) => ({
        ...cur,
        password: "",
        password_set: mail?.password_set === true,
      }));
      setNote("Saved. Alerts that use this mailbox are not built yet.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell
      summary="IMAP mailbox this system can use later for automated e-mail alerts. Sending those alerts is not built yet."
      badge="IMAP"
    >
      <div className="max-w-lg space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Use this mailbox</p>
          <BooleanSwitch
            checked={form.enabled}
            onChange={(enabled) => setForm((cur) => ({ ...cur, enabled }))}
            label={form.enabled ? "On" : "Off"}
          />
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Host</span>
          <Input value={form.host} onChange={(e) => setForm((cur) => ({ ...cur, host: e.target.value }))} placeholder="imap.example.com" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Port</span>
          <Input value={form.port} onChange={(e) => setForm((cur) => ({ ...cur, port: e.target.value }))} inputMode="numeric" />
        </label>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">TLS</p>
          <BooleanSwitch
            checked={form.secure}
            onChange={(secure) => setForm((cur) => ({ ...cur, secure }))}
            label={form.secure ? "On" : "Off"}
          />
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Username</span>
          <Input value={form.username} onChange={(e) => setForm((cur) => ({ ...cur, username: e.target.value }))} autoComplete="off" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">
            Password{form.password_set ? " (saved — leave blank to keep it)" : ""}
          </span>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((cur) => ({ ...cur, password: e.target.value }))}
            autoComplete="new-password"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Mailbox</span>
          <Input value={form.mailbox} onChange={(e) => setForm((cur) => ({ ...cur, mailbox: e.target.value }))} />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </PanelShell>
  );
}
