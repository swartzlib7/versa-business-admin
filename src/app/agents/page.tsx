"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/lib/data";

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  idle: "#eab308",
  error: "#ef4444",
  offline: "#6b7280",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  idle: "secondary",
  error: "destructive",
  offline: "outline",
};

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();

    fetch(`/api/agents${qs ? "?" + qs : ""}`)
      .then((r) => r.json())
      .then((json) => {
        setAgents(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
            <p className="text-muted-foreground">
              AI agents available to your business — status, roles, and activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border-input bg-background text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="error">Error</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading agents…</p>
            </CardContent>
          </Card>
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">No agents found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusFilter
                  ? `No agents match the "${statusFilter}" filter.`
                  : "Assistants will appear here once provisioned."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Role</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Model</th>
                      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Last Active</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/agents/${agent.id}`)}
                        tabIndex={0}
                        role="link"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/agents/${agent.id}`);
                          }
                        }}
                      >
                        <td className="px-4 py-3 font-medium">{agent.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{agent.role}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: STATUS_COLORS[agent.status] ?? "#6b7280" }}
                            />
                            <Badge variant={STATUS_BADGE_VARIANT[agent.status] ?? "outline"} className="capitalize">
                              {agent.status}
                            </Badge>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{agent.model}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {new Date(agent.lastActive).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/agents/${agent.id}`); }}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
