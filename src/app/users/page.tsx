"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { EntityListing } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import type { User } from "@/lib/data";

type LocalUser = User & { _local?: boolean } & Record<string, unknown>;

export default function UsersPage() {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

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

  const fields = useMemo(
    () => [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      {
        key: "type",
        label: "Type",
        kind: "select" as const,
        options: ["human", "agent"],
      },
      {
        key: "role",
        label: "Role",
        kind: "select" as const,
        options: ["admin", "member"],
      },
      { key: "department", label: "Department" },
      {
        key: "status",
        label: "Status",
        kind: "select" as const,
        options: ["active", "inactive"],
      },
      {
        key: "bio",
        label: "Bio",
        kind: "textarea" as const,
        column: false,
      },
    ],
    []
  );

  const getCell = (row: LocalUser, key: string) => {
    const v = (row as unknown as Record<string, unknown>)[key];
    return v == null ? "" : String(v);
  };

  const onAdd = (draft: Record<string, string>) => {
    const id = `local-${Date.now()}`;
    const next: LocalUser = {
      id,
      name: draft.name || "New user",
      email: draft.email || "",
      type: (draft.type as User["type"]) || "human",
      role: (draft.role as User["role"]) || "member",
      department: draft.department || "",
      bio: draft.bio || "",
      status: (draft.status as User["status"]) || "active",
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
              department: draft.department || u.department,
              bio: draft.bio || u.bio,
              status: (draft.status as User["status"]) || u.status,
            }
          : u
      )
    );
    setNote("Updated in this session (mock) — refresh reloads from API.");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            People and agents with access to Mission Control. Same listing pattern as
            zone entity tabs — New under the header, Edit expands inline on the row.
          </p>
        </div>

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
            summary="Directory of humans and agents. Filter by type; edit expands on the row."
            accent={theme.colors.brand}
            fields={fields}
            rows={users}
            getRowId={(u) => u.id}
            getCell={getCell}
            onAdd={onAdd}
            onUpdate={onUpdate}
            headerExtra={
              <select
                className="border-input bg-background rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                <option value="human">Human</option>
                <option value="agent">Agent</option>
              </select>
            }
          />
        )}

        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </AppShell>
  );
}
