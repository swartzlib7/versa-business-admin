"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/data";

const STATUS_OPTIONS = ["active", "paused", "completed", "archived"] as const;

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "default" as const;
    case "paused": return "secondary" as const;
    case "completed": return "default" as const;
    case "archived": return "outline" as const;
    default: return "outline" as const;
  }
};

const priorityVariant = (priority: string) => {
  switch (priority) {
    case "high": return "default" as const;
    case "normal": return "secondary" as const;
    case "low": return "outline" as const;
    default: return "outline" as const;
  }
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("q", searchQuery);
    fetch(`/api/projects?${params.toString()}`)
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) {
          setProjects(json.data ?? []);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load projects.");
        setLoading(false);
      });
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Business work surfaces — track projects, owners, and progress.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Input
            placeholder="Search projects…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading projects…</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <button onClick={fetchProjects} className="mt-2 text-sm text-muted-foreground underline">Retry</button>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">No projects found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Projects ({projects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Priority</th>
                      <th className="pb-2 font-medium">Owner</th>
                      <th className="pb-2 font-medium">Tasks</th>
                      <th className="pb-2 font-medium">Target Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 pr-4">
                          <Link href={`/projects/${project.id}`} className="font-medium text-foreground hover:underline">
                            {project.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={priorityVariant(project.priority)}>{project.priority}</Badge>
                        </td>
                        <td className="py-2 pr-4">{project.ownerName}</td>
                        <td className="py-2 pr-4">{project.taskCount}</td>
                        <td className="py-2">
                          {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : "—"}
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
