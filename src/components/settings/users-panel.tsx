"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EntityListing, type ListingField } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import { listingFieldsFromCatalog, resolvePicklistLabel } from "@/lib/catalog/layout-to-fields";
import type { User } from "@/lib/data";
import { passwordProblem } from "@/lib/password-policy";

type LocalUser = User & { _local?: boolean; data?: Record<string, unknown> } & Record<string, unknown>;

function toCatalogValues(u: LocalUser): Record<string, string> {
  const data = (u.data ?? {}) as Record<string, unknown>;
  return {
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    type: String(u.type ?? "human"),
    role: String(u.role ?? "member"),
    status: String(u.status ?? "active"),
    job_title: String(data.job_title ?? u.job_title ?? ""),
    avatar: typeof data.avatar === "string" ? data.avatar : "",
    password: "",
  };
}

const HIDDEN_USER_FIELDS = new Set(["bio", "department", "department_id"]);
const USER_COLUMN_ORDER = ["status", "role", "type", "name", "email"];

export function UsersPanel({ typeFilter = "human" }: { typeFilter?: "human" | "agent" }) {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const catalogFields = useMemo(() => listingFieldsFromCatalog("user"), []);
  const fields: ListingField[] = useMemo(
    () => [
      ...catalogFields
        .filter((f) => !HIDDEN_USER_FIELDS.has(f.key))
        .map((f) => ({
          key: f.key,
          label: f.label,
          kind: f.kind,
          options: f.options,
          optionLabels: f.optionLabels,
          column: f.column,
          secret: f.secret,
        })),
      { key: "password", label: "Password", kind: "text" as const, column: false },
      { key: "avatar", label: "Profile picture", kind: "text" as const, column: false, span: 2 },
    ],
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

  const onAdd = async (draft: Record<string, string>) => {
    const created = draft.password?.trim() ?? "";
    const createdProblem = passwordProblem(created);
    if (createdProblem) {
      setNote(createdProblem);
      return false;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: draft.name,
        email: draft.email,
        type: draft.type || typeFilter,
        role: draft.role || "member",
        status: draft.status || "active",
        password: draft.password,
        data: { job_title: draft.job_title || "", avatar: draft.avatar || "" },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(json?.error?.message || "Could not create the user.");
      return false;
    }
    setUsers((prev) => [...prev, json.data]);
    setNote("User created.");
    return true;
  };

  const onUpdate = async (id: string, draft: Record<string, string>) => {
    const body: Record<string, unknown> = {
      name: draft.name,
      email: draft.email,
      type: draft.type,
      role: draft.role,
      status: draft.status,
      data: { job_title: draft.job_title || "", avatar: draft.avatar || "" },
    };
    const nextPassword = draft.password?.trim() ?? "";
    if (nextPassword) {
      const problem = passwordProblem(nextPassword);
      if (problem) {
        setNote(problem + " The current password was kept.");
        return false;
      }
      body.password = nextPassword;
    }
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(json?.error?.message || "Could not save the user.");
      return false;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...json.data } : u)));
    setNote("Saved.");
    return true;
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
