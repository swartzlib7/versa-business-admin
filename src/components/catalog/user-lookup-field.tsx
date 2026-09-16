"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type UserRow = { id: string; name?: string; email?: string };

export function UserLookupField({
  label,
  value,
  onChange,
  required,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/users", { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: UserRow[] }) => setUsers(json.data ?? []))
      .catch(() => setUsers([]));
    return () => controller.abort();
  }, []);

  const selected = users.find((u) => u.id === value);
  const display = selected
    ? `${selected.name ?? selected.email ?? selected.id}${selected.email && selected.name ? ` (${selected.email})` : ""}`
    : value || "—";

  if (readOnly) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
          {required ? " *" : ""}
        </span>
        <p className="text-sm">{display}</p>
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <select
        className={cn(base)}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">Select user…</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name ?? u.email ?? u.id}
            {u.email && u.name ? ` (${u.email})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
