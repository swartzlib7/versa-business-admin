"use client";

import { useUiTheme } from "@/components/shell/theme-provider";
import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Compass, Cloud, Maximize2, Minimize2, X, Grid3x3, Circle, Layers, Play, Pause, Move, Expand } from "lucide-react";
import {
  MissionControlScene,
  type SceneNode,
} from "@/components/r3f/mission-control-scene";
import { projects, tasks, integrations, businessGraphNodes } from "@/lib/fixtures";

export default function DashboardPage() {
  const { theme: uiTheme, cycleTheme } = useUiTheme();
  const darkMode = uiTheme !== "light";
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showAxes, setShowAxes] = useState(false); // I5.6.3 hide axes by default
  const [ringsMode, setRingsMode] = useState<'on' | '50' | '25' | '10' | 'off'>('on');
  const [showZoneColors, setShowZoneColors] = useState(true);
  const [showFloor, setShowFloor] = useState(true);
  const [animOn, setAnimOn] = useState(false); // I5.6.36 — separate anim toggle
  const [showCamTel, setShowCamTel] = useState(false); // I5.6.36 #203 — camera info toggle (default OFF)
  const animSpeed = animOn ? 5 : 0; // default speed when on
  const [ringGap, setRingGap] = useState(1);
  const [sphereScale, setSphereScale] = useState(1);

  const toggleAnim = () => setAnimOn((v) => !v);
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
  const cycleRings = () => {
    const order: ('on' | '50' | '25' | '10' | 'off')[] = ['on', '50', '25', '10', 'off'];
    const i = order.indexOf(ringsMode);
    setRingsMode(order[(i + 1) % order.length]);
  };
  const ringsVariant = ringsMode === 'on' ? 'default' : ringsMode === 'off' ? 'outline' : 'secondary';

  
  const toggleTheme = () => {
    cycleTheme();
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
      <div className="flex min-h-[600px] w-full flex-1 flex-col gap-4 lg:gap-6 lg:min-h-[750px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-muted-foreground">
              Versa AGi — Organization, Collaboration, and Environmental zones.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme} title={`Theme: ${uiTheme}`}>
            {uiTheme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : uiTheme === "architect" ? (
              <Compass className="h-5 w-5" />
            ) : uiTheme === "slate" ? (
              <Cloud className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
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
              <div className="flex max-w-full flex-wrap items-center gap-1.5">
                <Button
                  variant={animOn ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAnim}
                  title={animOn ? "Animation on — click to pause" : "Animation off — click to play"}
                  className="gap-1.5"
                >
                  {animOn ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{animOn ? "Pause" : "Play"}</span>
                </Button>
                <Button
                  variant={ringsVariant}
                  size="sm"
                  onClick={cycleRings}
                  title={'Rings: ' + (ringsMode === 'on' ? 'On' : ringsMode === '50' ? '50%' : ringsMode === '25' ? '25%' : ringsMode === '10' ? '10%' : 'Off') + ' — click to cycle'}
                  className="gap-1.5"
                >
                  <Circle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Rings {ringsMode === 'on' ? 'On' : ringsMode === '50' ? '50%' : ringsMode === '25' ? '25%' : ringsMode === '10' ? '10%' : 'Off'}</span>
                </Button>
                <Button
                  variant={showZoneColors ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowZoneColors((v) => !v)}
                  title={showZoneColors ? "Hide zone colors" : "Show zone colors"}
                  className="gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Colors</span>
                </Button>
                <Button
                  variant={showFloor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFloor((v) => !v)}
                  title={showFloor ? "Hide grid floor" : "Show grid floor"}
                  className="gap-1.5"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Floor</span>
                </Button>
                <Button
                  variant={showAxes ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAxes((v) => !v)}
                  title={showAxes ? "Hide XYZ axes" : "Show XYZ axes"}
                  className="gap-1.5"
                >
                  <Move className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Axes</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cycleGap}
                  title="Ring gap multiplier"
                  className="gap-1.5"
                >
                  <Expand className="h-3.5 w-3.5" />
                  <span>Gap {ringGap}x</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cycleSphere}
                  title="Sphere size multiplier"
                  className="gap-1.5"
                >
                  <Circle className="h-3.5 w-3.5" />
                  <span>Spheres {sphereScale}x</span>
                </Button>
                <Button
                  variant={showCamTel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCamTel((v) => !v)}
                  title={showCamTel ? "Hide camera info" : "Show camera info"}
                  className="gap-1.5"
                >
                  <span className="hidden sm:inline">Camera</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(true)}
                  title="Full screen"
                  className="gap-1.5"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Full</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
            {!expanded && (
              <MissionControlScene
                className="min-h-[400px] h-[50vh] flex-1 lg:min-h-[750px] lg:h-[min(75vh,900px)]"
                onNodeClick={handleNodeClick}
                focusedNodeId={focusedNodeId}
                expanded={false}
                showAxes={showAxes}
                ringsMode={ringsMode}
                onRingsModeChange={setRingsMode}
                showZoneColors={showZoneColors}
                onShowZoneColorsChange={setShowZoneColors}
                showFloor={showFloor}
                onShowFloorChange={setShowFloor}
                showCanvasChrome={false}
                animSpeed={animSpeed}
                showCameraTelemetry={showCamTel}
                onShowCameraTelemetryChange={setShowCamTel}
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
              <div className="flex max-w-full flex-wrap items-center gap-1.5">
                <Button
                  variant={animOn ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAnim}
                  title={animOn ? "Animation on — click to pause" : "Animation off — click to play"}
                  className="gap-1.5"
                >
                  {animOn ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{animOn ? "Pause" : "Play"}</span>
                </Button>
                <Button
                  variant={ringsVariant}
                  size="sm"
                  onClick={cycleRings}
                  title={'Rings: ' + (ringsMode === 'on' ? 'On' : ringsMode === '50' ? '50%' : ringsMode === '25' ? '25%' : ringsMode === '10' ? '10%' : 'Off') + ' — click to cycle'}
                  className="gap-1.5"
                >
                  <Circle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Rings {ringsMode === 'on' ? 'On' : ringsMode === '50' ? '50%' : ringsMode === '25' ? '25%' : ringsMode === '10' ? '10%' : 'Off'}</span>
                </Button>
                <Button
                  variant={showZoneColors ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowZoneColors((v) => !v)}
                  title={showZoneColors ? "Hide zone colors" : "Show zone colors"}
                  className="gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Colors</span>
                </Button>
                <Button
                  variant={showFloor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFloor((v) => !v)}
                  title={showFloor ? "Hide grid floor" : "Show grid floor"}
                  className="gap-1.5"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Floor</span>
                </Button>
                <Button
                  variant={showAxes ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAxes((v) => !v)}
                  title={showAxes ? "Hide XYZ axes" : "Show XYZ axes"}
                  className="gap-1.5"
                >
                  <Move className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Axes</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cycleGap}
                  title="Ring gap multiplier"
                  className="gap-1.5"
                >
                  <Expand className="h-3.5 w-3.5" />
                  <span>Gap {ringGap}x</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cycleSphere}
                  title="Sphere size multiplier"
                  className="gap-1.5"
                >
                  <Circle className="h-3.5 w-3.5" />
                  <span>Spheres {sphereScale}x</span>
                </Button>
                <Button
                  variant={showCamTel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCamTel((v) => !v)}
                  title={showCamTel ? "Hide camera info" : "Show camera info"}
                  className="gap-1.5"
                >
                  <span className="hidden sm:inline">Camera</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setExpanded(false)}
                  className="gap-1.5"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Restore</span>
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
                ringsMode={ringsMode}
                onRingsModeChange={setRingsMode}
                showZoneColors={showZoneColors}
                onShowZoneColorsChange={setShowZoneColors}
                showFloor={showFloor}
                onShowFloorChange={setShowFloor}
                showCanvasChrome={false}
                animSpeed={animSpeed}
                showCameraTelemetry={showCamTel}
                onShowCameraTelemetryChange={setShowCamTel}
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
