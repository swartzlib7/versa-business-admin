"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDrivenForm } from "@/components/catalog/layout-driven-form";
import {
  detailSectionsFromCatalog,
  editFieldsFromCatalog,
} from "@/lib/catalog/layout-to-fields";
import { theme } from "@/lib/theme";
import type { User } from "@/lib/data";

type LocalUser = User & {
  department_id?: string;
  data?: Record<string, unknown>;
  job_title?: string;
} & Record<string, unknown>;

function toValues(u: LocalUser): Record<string, string> {
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

export default function UserDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const detail = useMemo(() => detailSectionsFromCatalog("user"), []);
  const edit = useMemo(() => editFieldsFromCatalog("user"), []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "User not found" : "Not authorized");
        return r.json();
      })
      .then((json) => {
        const u = (json.data ?? json) as LocalUser;
        setUser(u);
        setDraft(toValues(u));
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const startEdit = () => {
    if (user) setDraft(toValues(user));
    setEditing(true);
    setNote("");
  };

  const cancel = () => {
    if (user) setDraft(toValues(user));
    setEditing(false);
  };

  const save = () => {
    if (!user) return;
    const next: LocalUser = {
      ...user,
      name: draft.name || user.name,
      email: draft.email || user.email,
      type: (draft.type as User["type"]) || user.type,
      role: (draft.role as User["role"]) || user.role,
      status: (draft.status as User["status"]) || user.status,
      department: draft.department_id || user.department,
      department_id: draft.department_id,
      bio: draft.bio,
      data: {
        ...(typeof user.data === "object" && user.data ? user.data : {}),
        job_title: draft.job_title ?? "",
        bio: draft.bio,
      },
    };
    setUser(next);
    setEditing(false);
    setNote(
      "Saved in this session (mock). Catalog layout sections applied; API write not wired yet.",
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              <Link href="/users" className="hover:underline">
                Users
              </Link>
              {" / "}
              {id}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {user?.name ?? "User"}
            </h1>
            <p className="text-sm text-muted-foreground">
              ERD-C pilot — sections from default User{" "}
              {editing ? "edit" : "detail"} layout_definition
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: theme.colors.brand }}
                disabled={!user}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: theme.colors.brand }}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Link href="/users" className="mt-2 inline-block text-sm underline">
                Back to users
              </Link>
            </CardContent>
          </Card>
        ) : user ? (
          <LayoutDrivenForm
            sections={editing ? edit.sections : detail.sections}
            values={editing ? draft : toValues(user)}
            onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
            readOnly={!editing}
            accent={theme.colors.brand}
          />
        ) : null}

        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </AppShell>
  );
}
