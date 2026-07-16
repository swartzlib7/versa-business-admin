"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/data";

const GAME_COLORS: Record<string, string> = {
  "Growth": "#3b82f6",
  "Operations": "#f59e0b",
  "Customer": "#8b5cf6",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((json) => {
        setProjects(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group projects by game
  const grouped = projects.reduce<Record<string, Project[]>>((acc, p) => {
    const key = p.gameName || "Ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Strategic work organized by game and project.
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading projects…</p>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Projects will appear here once created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([gameName, gameProjects]) => (
              <div key={gameName}>
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: GAME_COLORS[gameName] ?? "#6b7280" }}
                  />
                  <h2 className="text-lg font-semibold">{gameName}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {gameProjects.length} project{gameProjects.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gameProjects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
                        <Badge
                          variant={
                            project.status === "active"
                              ? "default"
                              : project.status === "paused"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {project.status}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                          <span>{project.agentCount} agents</span>
                          <span>{project.taskCount} tasks</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
