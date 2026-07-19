"use client";

import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Maximize2, Minimize2, X } from "lucide-react";
import {
  MissionControlScene,
  type SceneNode,
} from "@/components/r3f/mission-control-scene";
import { projects, tasks, integrations, businessGraphNodes } from "@/lib/fixtures";

export default function DashboardPage() {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showAxes, setShowAxes] = useState(true);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleNodeClick = useCallback((node: SceneNode) => {
    setFocusedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const focusedNode = focusedNodeId
    ? focusedNodeId === "executive"
      ? {
          id: "executive",
          label: "Executive",
          type: "organization" as const,
          ring: 1,
          description:
            "Business executive function — collective name for the organization zone. Parent path for Projects and Tasks.",
          status: "active" as const,
          axis: "origin" as const,
          position: [0, 0, 0] as [number, number, number],
        }
      : businessGraphNodes.find((n) => n.id === focusedNodeId)
    : null;

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "planned"
  ).length;
  const connectedIntegrations = integrations.filter(
    (i) => i.status === "connected"
  ).length;
  const orgDepartments = businessGraphNodes.filter(
    (n) => n.type === "organization"
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-muted-foreground">
              Versa AGi — Organization, Collaboration, and Environmental zones.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Badge variant="default">{orgDepartments}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orgDepartments}</p>
              <p className="text-xs text-muted-foreground">
                Organization zones
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Badge variant="default">{activeProjects}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeProjects}</p>
              <p className="text-xs text-muted-foreground">
                of {projects.length} total projects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Badge variant="secondary">{pendingTasks}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingTasks}</p>
              <p className="text-xs text-muted-foreground">
                of {tasks.length} total tasks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Integrations</CardTitle>
              <Badge variant="default">{connectedIntegrations}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{connectedIntegrations}</p>
              <p className="text-xs text-muted-foreground">
                of {integrations.length} connected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 3D Scene — inline (hidden chrome when fullscreen so one canvas owns the view) */}
        <Card className={expanded ? "invisible h-0 overflow-hidden p-0 border-0 shadow-none" : undefined}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Mission Control Hub</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAxes((v) => !v)}
                  title="Toggle XYZ axis guides"
                >
                  {showAxes ? "Hide axes" : "Show axes"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(true)}
                >
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full screen
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!expanded && (
              <MissionControlScene
                onNodeClick={handleNodeClick}
                focusedNodeId={focusedNodeId}
                expanded={false}
                showAxes={showAxes}
                onShowAxesChange={setShowAxes}
              />
            )}
          </CardContent>
        </Card>

        {/* True fullscreen shell — restore control always on top */}
        {expanded && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-background">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur z-[110]">
              <div>
                <p className="text-sm font-semibold tracking-tight">Mission Control Hub</p>
                <p className="text-xs text-muted-foreground">
                  Full screen — restore to return to the dashboard layout
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAxes((v) => !v)}
                >
                  {showAxes ? "Hide XYZ axes" : "Show XYZ axes"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setExpanded(false)}
                  className="gap-1"
                >
                  <Minimize2 className="h-4 w-4" />
                  Restore
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setExpanded(false)}
                  aria-label="Close full screen"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1">
              <MissionControlScene
                onNodeClick={handleNodeClick}
                focusedNodeId={focusedNodeId}
                expanded={true}
                showAxes={showAxes}
                onShowAxesChange={setShowAxes}
              />
            </div>
          </div>
        )}

        {/* Focused Node Detail */}
        {focusedNode && (
          <Card className="border-primary/50 ring-1 ring-primary/20">
            <CardHeader>
              <CardTitle>{focusedNode.label}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {focusedNode.type} — {focusedNode.status}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{focusedNode.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Tasks + System Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No tasks yet. Create one to get started.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{task.title}</span>
                      <Badge
                        variant={
                          task.status === "done"
                            ? "default"
                            : task.status === "in_progress"
                            ? "secondary"
                            : task.status === "blocked"
                            ? "destructive"
                            : "outline"
                        }
                        className="ml-2 shrink-0"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This is <strong>business Mission Control</strong> — not Versa AGi agitop.
                  It manages the business operating graph: Organization, Collaboration,
                  and Environmental zones.
                </p>
                <p>
                  <strong>Agents</strong> appear only as users with type{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">agent</code>.
                  Agent operations, fleet management, and host system monitoring live in
                  agitop — the Versa AGi internal operator console.
                </p>
                <p>
                  <strong>agitop Organization</strong> may be disabled when using this
                  product&apos;s Organization model. Migrating data from agitop Organization
                  into this product is a future path — not current scope.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
