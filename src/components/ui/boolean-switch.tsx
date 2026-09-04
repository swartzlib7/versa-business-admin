"use client";

import { cn } from "@/lib/utils";

export function BooleanSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-transparent bg-primary"
            : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
      {label ? (
        <span className="text-sm text-foreground">{label}</span>
      ) : (
        <span className="text-sm text-muted-foreground">{checked ? "Yes" : "No"}</span>
      )}
    </div>
  );
}
