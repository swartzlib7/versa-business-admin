"use client";

import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/lib/fixtures";

export default function ProjectsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Strategic work organized by game and project.
          </p>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Projects will appear here once created through Versa AGi.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
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
                    <span>Game: {project.gameName}</span>
                    <span>{project.agentCount} agents</span>
                    <span>{project.taskCount} tasks</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
