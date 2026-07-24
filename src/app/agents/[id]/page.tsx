"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCw } from "lucide-react";
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

const NEXT_STATUS: Record<string, string> = {
  active: "idle",
  idle: "error",
  error: "offline",
  offline: "active",
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);

  const fetchAgent = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/users/${id}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setError(json.error?.message ?? "Agent not found.");
          setAgent(null);
        } else {
          setAgent(json.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load agent.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const cycleStatus = async () => {
    if (!agent) return;
    const next = NEXT_STATUS[agent.status] ?? "active";
    setPatching(true);
    try {
      const r = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await r.json();
      if (r.ok) {
        setAgent(json.data);
      }
    } catch {
      // silently ignore
    } finally {
      setPatching(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/agents")} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Agents
        </Button>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading agent…</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The agent you are looking for does not exist or has been removed.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/agents")}>
                View all agents
              </Button>
            </CardContent>
          </Card>
        ) : agent ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
                <p className="text-muted-foreground">{agent.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[agent.status] ?? "#6b7280" }}
                  />
                  <Badge variant={STATUS_BADGE_VARIANT[agent.status] ?? "outline"} className="capitalize">
                    {agent.status}
                  </Badge>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cycleStatus}
                  disabled={patching}
                  title="Cycle status (experimental PATCH)"
                >
                  <RefreshCw className={`mr-1 h-3.5 w-3.5 ${patching ? "animate-spin" : ""}`} />
                  Cycle
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Agent ID</span>
                    <p className="text-sm font-mono">{agent.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Model</span>
                    <p className="text-sm">{agent.model}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Last Active</span>
                    <p className="text-sm">{new Date(agent.lastActive).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status Control (Experimental)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    The <strong>Cycle</strong> button sends a PATCH request to advance the agent's status
                    through the lifecycle: active → idle → error → offline → active.
                    Changes persist in memory for the dev server lifetime.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current status: <Badge variant={STATUS_BADGE_VARIANT[agent.status] ?? "outline"} className="capitalize ml-1">{agent.status}</Badge>
                    → Next: <Badge variant="outline" className="capitalize ml-1">{NEXT_STATUS[agent.status] ?? "active"}</Badge>
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
