"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { EntityListing } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import { PageHeader } from "@/components/ui/page-header";
import type { User } from "@/lib/data";
import { listingFieldsFromCatalog } from "@/lib/catalog/layout-to-fields";
import { resolvePicklistLabel } from "@/lib/catalog/layout-to-fields";
import type { ListingField } from "@/components/listing/entity-listing";

type LocalUser = User & { _local?: boolean; data?: Record<string, unknown> } & Record<
  string,
  unknown
>;

/** Map fixture/API user into catalog field keys (department_id, job_title, data JSON). */
function toCatalogValues(u: LocalUser): Record<string, string> {
  const data = (u.data ?? {}) as Record<string, unknown>;
  return {
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    type: String(u.type ?? "human"),
    role: String(u.role ?? "member"),
    status: String(u.status ?? "active"),
    department_id: String(
      u.department_id ?? u.department ?? data.department_id ?? "",
    ),
    bio: String(u.bio ?? data.bio ?? ""),
    job_title: String(data.job_title ?? u.job_title ?? ""),
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
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
      })),
    [catalogFields],
  );

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    const qs = params.toString();

    fetch(`/api/users${qs ? "?" + qs : ""}`)
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
    return vals[key] ?? "";
  };

  const formatCell = (row: LocalUser, key: string, raw: string) => {
    const meta = catalogFields.find((f) => f.key === key);
    if (meta?.kind === "select" && raw) {
      return resolvePicklistLabel(meta, raw);
    }
    return raw;
  };

  const onAdd = (draft: Record<string, string>) => {
    const id = `local-${Date.now()}`;
    const next: LocalUser = {
      id,
      name: draft.name || "New user",
      email: draft.email || "",
      type: (draft.type as User["type"]) || "human",
      role: (draft.role as User["role"]) || "member",
      department: draft.department_id || "",
      department_id: draft.department_id || "",
      bio: draft.bio || "",
      status: (draft.status as User["status"]) || "active",
      data: {
        job_title: draft.job_title || "",
        bio: draft.bio || "",
      },
      _local: true,
    };
    setUsers((prev) => [...prev, next]);
    setNote(
      "Added locally (mock) — layout from catalog; API persistence not wired on this form yet.",
    );
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
    setNote(
      "Updated in this session (mock) — catalog layout fields; refresh reloads from API.",
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          subtitle="People and agent accounts — layout-driven pilot from catalog field and layout definitions."
          badge="Users"
          accent={theme.colors.brand}
        />

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please sign in to view users.
              </p>
            </CardContent>
          </Card>
        ) : (
          <EntityListing<LocalUser & Record<string, unknown>>
            title="Users"
            summary="Directory driven by User list layout catalog. Filter by type; edit expands on the row; name links to detail."
            accent={theme.colors.brand}
            fields={fields}
            rows={users}
            getRowId={(u) => u.id}
            getCell={getCell}
            formatCell={formatCell}
            onAdd={onAdd}
            onUpdate={onUpdate}
            viewHref={(u) => `/users/${u.id}`}
            headerExtra={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="border-input bg-background rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All types</option>
                  <option value="human">Human</option>
                  <option value="agent">Agent</option>
                </select>
                <span className="text-xs text-muted-foreground">
                  Catalog: user list layout
                </span>
              </div>
            }
          />
        )}

        {note && <p className="pt-2 text-xs text-muted-foreground">{note}</p>}
      </div>
    </AppShell>
  );
}
