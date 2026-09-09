"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EntityListing, type ListingField } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import { listingFieldsFromCatalog, resolvePicklistLabel } from "@/lib/catalog/layout-to-fields";
import type { User } from "@/lib/data";

type LocalUser = User & { _local?: boolean; data?: Record<string, unknown> } & Record<string, unknown>;

function toCatalogValues(u: LocalUser): Record<string, string> {
  const data = (u.data ?? {}) as Record<string, unknown>;
  return {
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    type: String(u.type ?? "human"),
    role: String(u.role ?? "member"),
    status: String(u.status ?? "active"),
    department_id: String(u.department_id ?? u.department ?? data.department_id ?? ""),
    bio: String(u.bio ?? data.bio ?? ""),
    job_title: String(data.job_title ?? u.job_title ?? ""),
  };
}

const USER_COLUMN_ORDER = ["status", "role", "type", "department_id", "name", "email"];

export function UsersPanel({ typeFilter = "human" }: { typeFilter?: "human" | "agent" }) {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const catalogFields = useMemo(() => listingFieldsFromCatalog("user"), []);
  const fields: ListingField[] = useMemo(
    () =>
      catalogFields.map((f) => ({
        key: f.key,
        label: f.label,
        kind: f.kind,
        options: f.options,
        optionLabels: f.optionLabels,
        column: f.column,
        secret: f.secret,
      })),
    [catalogFields],
  );

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    const qs = params.toString();
    fetch("/api/users" + (qs ? "?" + qs : ""))
      .then((r) => {
        if (!r.ok) throw new Error("Not authorized");
        return r.json();
      })
      .then((json) => {
        setUsers(json.data ?? []);
        setLoading(false);
        setError("");
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [typeFilter]);

  const getCell = (row: LocalUser, key: string) => {
    const vals = toCatalogValues(row);
    if (Object.prototype.hasOwnProperty.call(vals, key)) return vals[key];
    const data = (row.data ?? {}) as Record<string, unknown>;
    const v = (row as Record<string, unknown>)[key] ?? data[key];
    if (v == null) return "";
    if (typeof v === "boolean") return v ? "true" : "false";
    return String(v);
  };

  const formatCell = (row: LocalUser, key: string, raw: string) => {
    const meta = catalogFields.find((f) => f.key === key);
    if (meta?.kind === "select" && raw) return resolvePicklistLabel(meta, raw);
    return raw;
  };

  const onAdd = (draft: Record<string, string>) => {
    const id = "local-" + Date.now();
    const next: LocalUser = {
      id,
      name: draft.name || "New user",
      email: draft.email || "",
      type: (draft.type as User["type"]) || typeFilter,
      role: (draft.role as User["role"]) || "member",
      department: draft.department_id || "",
      department_id: draft.department_id || "",
      bio: draft.bio || "",
      status: (draft.status as User["status"]) || "active",
      data: { job_title: draft.job_title || "", bio: draft.bio || "" },
      _local: true,
    };
    setUsers((prev) => [...prev, next]);
    setNote("Added locally (mock) — API persistence not wired on this form yet.");
  };

  const onUpdate = (id: string, draft: Record<string, string>) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              name: draft.name || u.name,
              email: draft.email || u.email,
              type: (draft.type as User["type"]) || u.type,
              role: (draft.role as User["role"]) || u.role,
              department: draft.department_id || u.department,
              department_id: draft.department_id || u.department_id,
              bio: draft.bio || u.bio,
              status: (draft.status as User["status"]) || u.status,
              data: {
                ...(typeof u.data === "object" && u.data ? u.data : {}),
                job_title: draft.job_title ?? "",
                bio: draft.bio || u.bio,
              },
            }
          : u,
      ),
    );
    setNote("Updated in this session (mock) — refresh reloads from API.");
  };

  if (loading)
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    );
  if (error)
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="mt-1 text-sm text-muted-foreground">Please sign in to view users.</p>
        </CardContent>
      </Card>
    );

  return (
    <>
      <EntityListing<LocalUser & Record<string, unknown>>
        summary={
          typeFilter === "agent"
            ? "Agent accounts. Click a row to open or close. Drag headers to reorder."
            : "Human accounts. Click a row to open or close. Drag headers to reorder."
        }
        accent={theme.colors.brand}
        fields={fields}
        rows={users}
        getRowId={(u) => u.id}
        getCell={getCell}
        formatCell={formatCell}
        onAdd={onAdd}
        onUpdate={onUpdate}
        columnStorageKey={`mc.listing.users.${typeFilter}`}
        columnOrder={USER_COLUMN_ORDER}
      />
      {note && <p className="pt-2 text-xs text-muted-foreground">{note}</p>}
    </>
  );
}
