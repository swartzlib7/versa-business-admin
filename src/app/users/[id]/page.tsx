"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDrivenForm } from "@/components/catalog/layout-driven-form";
import { useSavedRuntimeLayouts } from "@/lib/catalog/use-saved-runtime-layouts";
import { theme } from "@/lib/theme";
import type { User } from "@/lib/data";
import { ProfilePictureField } from "@/components/users/profile-picture-field";
import { PasswordField } from "@/components/users/password-field";
import { passwordProblem } from "@/lib/password-policy";

const RETIRED = new Set(["bio", "department", "department_id"]);

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
    job_title: String(data.job_title ?? u.job_title ?? ""),
    avatar: typeof data.avatar === "string" ? data.avatar : "",
    password: "",
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
  const runtimeSections = useSavedRuntimeLayouts("user");


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

  const save = async () => {
    if (!user) return;
    const body: Record<string, unknown> = {
      name: draft.name || user.name,
      email: draft.email || user.email,
      type: draft.type || user.type,
      role: draft.role || user.role,
      status: draft.status || user.status,
      data: {
        ...(typeof user.data === "object" && user.data ? user.data : {}),
        job_title: draft.job_title ?? "",
        avatar: draft.avatar ?? "",
      },
    };
    const nextPassword = draft.password?.trim() ?? "";
    if (nextPassword) {
      const problem = passwordProblem(nextPassword);
      if (problem) {
        setNote(problem + " The current password was kept.");
        return;
      }
      body.password = nextPassword;
    }
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(json?.error?.message || "Could not save the user.");
      return;
    }
    const saved = (json.data ?? user) as LocalUser;
    setUser(saved);
    setDraft({ ...toValues(saved), password: "" });
    setEditing(false);
    setNote("Saved.");
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
              Runtime saved-layout User pilot — {editing ? "edit" : "detail"} uses a saved layout when available, otherwise the catalog default.
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
                  onClick={() => void save()}
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
          <>
          <LayoutDrivenForm
            sections={(editing ? runtimeSections.edit : runtimeSections.detail)
              .map((section) => ({
                ...section,
                fields: section.fields.filter((field) => !RETIRED.has(field.key)),
              }))
              .filter((section) => section.fields.length > 0)}
            values={editing ? draft : toValues(user)}
            onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
            readOnly={!editing}
            accent={theme.colors.brand}
          />
          <div className="space-y-4 rounded-lg border border-border p-4">
            <ProfilePictureField
              label="Profile picture"
              value={(editing ? draft.avatar : toValues(user).avatar) ?? ""}
              onChange={editing ? (next) => setDraft((d) => ({ ...d, avatar: next })) : undefined}
              readOnly={!editing}
            />
            {editing ? (
              <PasswordField
                label="Password"
                value={draft.password ?? ""}
                onChange={(next) => setDraft((d) => ({ ...d, password: next }))}
              />
            ) : null}
          </div>
          </>
        ) : null}

        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </AppShell>
  );
}
