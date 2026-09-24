"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type OrgRow = { id: string; name?: string; org_type?: string };

const ORG_TYPE_LABEL: Record<string, string> = {
  vendor: "Vendor",
  customer: "Customer",
  partner: "Partner",
  branch: "Branch",
  internal: "Org",
};

export function OrganizationLookupField({
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
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/organizations", { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: OrgRow[] }) => setOrgs(json.data ?? []))
      .catch(() => setOrgs([]));
    return () => controller.abort();
  }, []);

  const selected = orgs.find((o) => o.id === value);
  const typeLabel = selected?.org_type ? ORG_TYPE_LABEL[selected.org_type] ?? selected.org_type : "";
  const display = selected?.name
    ? typeLabel
      ? `${selected.name} · ${typeLabel}`
      : selected.name
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
      <select className={cn(base)} value={value} onChange={(e) => onChange?.(e.target.value)}>
        <option value="">Select organization…</option>
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name ?? o.id}
          </option>
        ))}
      </select>
    </label>
  );
}
