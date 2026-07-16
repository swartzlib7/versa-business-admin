"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MissionControlScene,
  type SceneNode,
} from "@/components/r3f/mission-control-scene";
import { agents, projects, tasks, integrations } from "@/lib/fixtures";

export default function DashboardPage() {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const handleNodeClick = useCallback((node: SceneNode) => {
    setFocusedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const focusedAgent = focusedNodeId
    ? agents.find((a) => a.id === focusedNodeId)
    : null;
  const focusedProject = focusedNodeId
    ? projects.find((p) => p.id === focusedNodeId)
    : null;
  const focusedEntity = focusedAgent || focusedProject;

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "planned"
  ).length;
  const connectedIntegrations = integrations.filter(
    (i) => i.status === "connected"
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground">
            Overview of your business operations.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Badge variant="default">{activeAgents}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeAgents}</p>
              <p className="text-xs text-muted-foreground">
                of {agents.length} total agents
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

        {/* 3D Scene */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Activity Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionControlScene
              agents={agents}
              projects={projects}
              onNodeClick={handleNodeClick}
              focusedNodeId={focusedNodeId}
            />
          </CardContent>
        </Card>

        {/* Focused Entity Detail */}
        {focusedEntity && (
          <Card className="border-brand/50 ring-1 ring-brand/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {focusedAgent ? focusedAgent.name : focusedProject?.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {focusedAgent
                    ? `Role: ${focusedAgent.role} · Model: ${focusedAgent.model}`
                    : focusedProject?.description}
                </p>
              </div>
              <Badge
                variant={
                  focusedEntity.status === "active"
                    ? "default"
                    : focusedEntity.status === "error" || focusedEntity.status === "offline"
                    ? "destructive"
                    : "secondary"
                }
              >
                {focusedEntity.status}
              </Badge>
            </CardHeader>
            <CardContent>
              {focusedAgent && (
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Active</span>
                    <span>{new Date(focusedAgent.lastActive).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-mono text-xs">{focusedAgent.model}</span>
                  </div>
                </div>
              )}
              {focusedProject && (
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Game</span>
                    <span>{focusedProject.gameName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agents</span>
                    <span>{focusedProject.agentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tasks</span>
                    <span>{focusedProject.taskCount}</span>
                  </div>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Click the same node again or select another to dismiss.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
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
              <CardTitle>Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No agents registered yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {agents.map((agent) => (
                    <li
                      key={agent.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{agent.name}</span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              agent.status === "active"
                                ? "#22c55e"
                                : agent.status === "idle"
                                ? "#eab308"
                                : agent.status === "error"
                                ? "#ef4444"
                                : "#6b7280",
                          }}
                        />
                        <span className="text-xs capitalize">{agent.status}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
