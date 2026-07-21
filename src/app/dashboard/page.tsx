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
  const [showAxes, setShowAxes] = useState(false); // I5.6.3 hide axes by default
  const [showRings, setShowRings] = useState(true);
  const [showZoneColors, setShowZoneColors] = useState(true);
  const [showFloor, setShowFloor] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [ringGap, setRingGap] = useState(1);
  const [sphereScale, setSphereScale] = useState(1);

  const cycleSpeed = () => {
    const steps = [0, 1, 5, 10, 15, 20]; // I5.6.3
    const i = steps.indexOf(animSpeed);
    setAnimSpeed(steps[(i >= 0 ? i + 1 : 1) % steps.length]);
  };
  const cycleGap = () => {
    const steps = [0.75, 1, 1.25, 1.5];
    const i = steps.indexOf(ringGap);
    setRingGap(steps[(i >= 0 ? i + 1 : 1) % steps.length]);
  };
  const cycleSphere = () => {
    const steps = [0.75, 1, 1.25, 1.5];
    const i = steps.indexOf(sphereScale);
    setSphereScale(steps[(i >= 0 ? i + 1 : 1) % steps.length]);
  };

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
    ? businessGraphNodes.find((n) => n.id === focusedNodeId) ?? null
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
    <AppShell fillViewport>
      <div className="flex min-h-[750px] min-w-[800px] w-full flex-1 flex-col gap-6">
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
        <Card className={expanded ? "invisible h-0 overflow-hidden p-0 border-0 shadow-none" : "flex min-h-0 flex-1 flex-col"}>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle>Mission Control Hub</CardTitle>
              <div className="flex max-w-full flex-wrap items-center gap-2">
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
                  onClick={() => setShowRings((v) => !v)}
                >
                  {showRings ? "Hide rings" : "Show rings"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowZoneColors((v) => !v)}
                >
                  {showZoneColors ? "Hide zone colors" : "Show zone colors"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFloor((v) => !v)}
                >
                  {showFloor ? "Hide grid floor" : "Show grid floor"}
                </Button>
                <Button variant="outline" size="sm" onClick={cycleSpeed}>
                  Speed {animSpeed === 0 ? "off" : animSpeed + "x"}
                </Button>
                <Button variant="outline" size="sm" onClick={cycleGap}>
                  Gap {ringGap}x
                </Button>
                <Button variant="outline" size="sm" onClick={cycleSphere}>
                  Spheres {sphereScale}x
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
          <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
            {!expanded && (
              <MissionControlScene
                className="min-h-[750px] h-[min(75vh,900px)] flex-1"
                onNodeClick={handleNodeClick}
                focusedNodeId={focusedNodeId}
                expanded={false}
                showAxes={showAxes}
                showRings={showRings}
                onShowRingsChange={setShowRings}
                showZoneColors={showZoneColors}
                onShowZoneColorsChange={setShowZoneColors}
                showFloor={showFloor}
                onShowFloorChange={setShowFloor}
                showCanvasChrome={false}
                animSpeed={animSpeed}
                onAnimSpeedChange={setAnimSpeed}
                ringGap={ringGap}
                onRingGapChange={setRingGap}
                sphereScale={sphereScale}
                onSphereScaleChange={setSphereScale}
                onShowAxesChange={setShowAxes}
              />
            )}
          </CardContent>
        </Card>

        {/* True fullscreen shell — restore control always on top */}
        {expanded && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-background">
            <div className="flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur z-[110] sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 shrink">
                <p className="text-sm font-semibold tracking-tight">Mission Control Hub</p>
                <p className="text-xs text-muted-foreground">
                  Full screen — restore to return to the dashboard layout
                </p>
              </div>
              <div className="flex max-w-full flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAxes((v) => !v)}
                >
                  {showAxes ? "Hide XYZ axes" : "Show XYZ axes"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRings((v) => !v)}
                >
                  {showRings ? "Hide rings" : "Show rings"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowZoneColors((v) => !v)}
                >
                  {showZoneColors ? "Hide zone colors" : "Show zone colors"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFloor((v) => !v)}
                >
                  {showFloor ? "Hide grid floor" : "Show grid floor"}
                </Button>
                <Button variant="outline" size="sm" onClick={cycleSpeed}>
                  Speed {animSpeed === 0 ? "off" : animSpeed + "x"}
                </Button>
                <Button variant="outline" size="sm" onClick={cycleGap}>
                  Gap {ringGap}x
                </Button>
                <Button variant="outline" size="sm" onClick={cycleSphere}>
                  Spheres {sphereScale}x
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
                showRings={showRings}
                onShowRingsChange={setShowRings}
                showZoneColors={showZoneColors}
                onShowZoneColorsChange={setShowZoneColors}
                showFloor={showFloor}
                onShowFloorChange={setShowFloor}
                showCanvasChrome={false}
                animSpeed={animSpeed}
                onAnimSpeedChange={setAnimSpeed}
                ringGap={ringGap}
                onRingGapChange={setRingGap}
                sphereScale={sphereScale}
                onSphereScaleChange={setSphereScale}
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

      </div>
    </AppShell>
  );
}
