"use client";

import { useState } from "react";
import { generatePassword, PASSWORD_RULE } from "@/lib/password-policy";

export function PasswordField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={value}
          readOnly={readOnly}
          placeholder={readOnly ? "" : "Leave blank to keep the current password"}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {!readOnly ? (
          <button
            type="button"
            className="shrink-0 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
            onClick={() => onChange?.(generatePassword())}
          >
            Generate
          </button>
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground">{PASSWORD_RULE}</p>
    </div>
  );
}
