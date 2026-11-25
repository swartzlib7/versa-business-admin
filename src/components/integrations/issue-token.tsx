"use client";

import { useState } from "react";

/**
 * 1.0.20 (state_integrations.md §3.2): Issue token on an Access-token Credential.
 * The token is shown once, with Copy. Done reloads the page, so no open form can save
 * an old Configuration over the new token.
 */
export function IssueTokenButton({
  credentialId,
  hasToken,
  className,
  onError,
}: {
  credentialId: string;
  hasToken: boolean;
  className: string;
  onError?: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ token: string; copied: boolean } | null>(null);
  const issue = async () => {
    if (hasToken && !window.confirm("Issue a new token? The current token stops working at once; paste the new one on the other side straight after.")) return;
    setBusy(true);
    onError?.("");
    try {
      const res = await fetch(`/api/credentials/${credentialId}/token`, { method: "POST", credentials: "include" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.error?.message ?? "The token was not issued.";
        if (onError) onError(message);
        else window.alert(message);
        return;
      }
      setIssued({ token: String(json.data.token), copied: false });
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" className={className} disabled={busy} title="Make an access token for the other system to use" onClick={() => void issue()}>
        {busy ? "Issuing…" : "Issue token"}
      </button>
      {issued ? (
        <div role="dialog" aria-modal="true" aria-label="New access token" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg space-y-3 rounded-lg border border-border bg-background p-5 shadow-xl">
            <h3 className="text-base font-semibold">New access token</h3>
            <p className="text-sm text-muted-foreground">
              Copy it now: it is not shown again. Paste it on the calling side, in a Credential with Auth type Access token and Configuration{" "}
              <code>{'{"token": "…"}'}</code>.
            </p>
            <code className="block select-all break-all rounded-md border border-border bg-muted px-3 py-2 text-xs">{issued.token}</code>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={className}
                onClick={() => {
                  void navigator.clipboard?.writeText(issued.token).then(
                    () => setIssued({ ...issued, copied: true }),
                    () => undefined,
                  );
                }}
              >
                {issued.copied ? "Copied" : "Copy"}
              </button>
              <button type="button" className={className} onClick={() => window.location.reload()}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
