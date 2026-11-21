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
  filter,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  /** 1.0.15 lookup filter, e.g. { field: "org_type", value: "vendor" }. */
  filter?: { field: string; value: string } | null;
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
        {orgs
          .filter((o) => !filter || o.id === value || String((o as Record<string, unknown>)[filter.field] ?? "") === filter.value)
          .map((o) => (
          <option key={o.id} value={o.id}>
            {o.name ?? o.id}
          </option>
          ))}
      </select>
    </label>
  );
}

/** Organization names for listings (1.0.15): one fetch per page, shared by every cell. */
let orgNamesPromise: Promise<Map<string, string>> | null = null;
function loadOrgNames(): Promise<Map<string, string>> {
  orgNamesPromise ??= fetch("/api/organizations", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : { data: [] }))
    .then((json: { data?: OrgRow[] }) => new Map((json.data ?? []).map((o) => [o.id, o.name ?? o.id])))
    .catch(() => {
      orgNamesPromise = null;
      return new Map<string, string>();
    });
  return orgNamesPromise;
}

export function OrganizationName({ id }: { id: string }) {
  const [names, setNames] = useState<Map<string, string> | null>(null);
  useEffect(() => {
    let live = true;
    void loadOrgNames().then((map) => live && setNames(map));
    return () => {
      live = false;
    };
  }, []);
  return <>{names?.get(id) ?? (names ? id : "…")}</>;
}
