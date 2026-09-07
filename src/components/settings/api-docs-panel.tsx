"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ApiAuth, ApiResource } from "@/lib/api/inventory";

type IndexPayload = {
  name?: string;
  version?: string;
  docs?: { operator?: string; contract?: string; ops_manual?: string };
  conventions?: {
    protocol?: string;
    list_envelope?: string;
    error_shape?: string;
  };
  resources?: ApiResource[];
};

const AUTH_LABEL: Record<ApiAuth, string> = {
  open: "Open",
  session: "Session",
  admin: "Admin",
  "admin-or-self": "Admin or self",
  "admin-or-assignee": "Admin or assignee",
};

function methodClass(method: string): string {
  if (method === "GET") return "bg-emerald-600 text-white";
  if (method === "POST") return "bg-sky-600 text-white";
  if (method === "PUT" || method === "PATCH") return "bg-amber-600 text-white";
  return "bg-rose-600 text-white";
}

export function ApiDocsPanel() {
  const [payload, setPayload] = useState<IndexPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("index unavailable"))))
      .then((json: IndexPayload) => setPayload(json))
      .catch(() => setError("Could not load the API catalog."));
  }, []);

  const groups = useMemo(() => {
    const rows = payload?.resources ?? [];
    const order: string[] = [];
    const map = new Map<string, ApiResource[]>();
    for (const row of rows) {
      if (!map.has(row.group)) {
        map.set(row.group, []);
        order.push(row.group);
      }
      map.get(row.group)!.push(row);
    }
    return order.map((name) => ({ name, rows: map.get(name)! }));
  }, [payload]);

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }
  if (!payload) {
    return <p className="text-sm text-muted-foreground">Loading API catalog…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {payload.name ?? "Mission Control API"}{" "}
            <span className="font-normal text-muted-foreground">
              v{payload.version}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Same catalog agents read from GET /api. This version’s feature set
            is listed below.
          </p>
        </div>
        <a
          href="/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open JSON index
        </a>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <p>
          <span className="font-medium text-foreground">Protocol. </span>
          {payload.conventions?.protocol ?? "HTTP JSON"}
        </p>
        <p>
          <span className="font-medium text-foreground">List envelope. </span>
          <code>{payload.conventions?.list_envelope}</code>
        </p>
        <p>
          <span className="font-medium text-foreground">Errors. </span>
          <code>{payload.conventions?.error_shape}</code>
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Repo docs: {payload.docs?.contract} · {payload.docs?.ops_manual}
      </p>
      {groups.map((group) => (
        <section key={group.name} className="space-y-2">
          <h3 className="text-sm font-semibold tracking-tight">{group.name}</h3>
          <ul className="divide-y divide-border rounded-md border">
            {group.rows.map((row) => (
              <li
                key={`${row.method} ${row.path}`}
                className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-start sm:gap-3"
              >
                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                  <Badge className={`border-0 ${methodClass(row.method)}`}>
                    {row.method}
                  </Badge>
                  {row.deprecated ? (
                    <Badge variant="outline" className="text-[10px]">
                      Deprecated
                    </Badge>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs break-all">{row.path}</p>
                  <p className="text-xs text-muted-foreground">
                    {AUTH_LABEL[row.auth]} — {row.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
