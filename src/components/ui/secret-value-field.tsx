"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const maskedStyle = { WebkitTextSecurity: "disc" } as CSSProperties;

/** Masked long-text / config field with Show / Hide. Value stays in the form; only the screen is hidden. */
export function SecretValueField({
  label,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const masked = !visible;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
          {required ? " *" : ""}
        </span>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {readOnly ? (
        <p
          className={cn("text-sm break-all whitespace-pre-wrap", masked && value && "select-none")}
          style={masked && value ? maskedStyle : undefined}
        >
          {value || "—"}
        </p>
      ) : (
        <textarea
          className={cn(base, "min-h-[72px] resize-y")}
          value={value}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => onChange?.(e.target.value)}
          style={masked && value ? maskedStyle : undefined}
        />
      )}
    </div>
  );
}

export function maskSecretDisplay(value: string): string {
  if (!value) return "";
  return "••••••••";
}
