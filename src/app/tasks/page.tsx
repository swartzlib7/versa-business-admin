"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Task } from "@/lib/data";

const STATUS_OPTIONS = ["planned", "in_progress", "waiting", "blocked", "done"] as const;
const PRIORITY_OPTIONS = ["urgent", "high", "normal", "low"] as const;

const statusVariant = (status: string) => {
  switch (status) {
    case "done": return "default" as const;
    case "in_progress": return "secondary" as const;
    case "blocked": return "destructive" as const;
    default: return "outline" as const;
  }
};

const priorityVariant = (priority: string) => {
  switch (priority) {
    case "urgent": return "destructive" as const;
    case "high": return "default" as const;
    case "normal": return "secondary" as const;
    case "low": return "outline" as const;
    default: return "outline" as const;
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  // Fetch project list for the filter dropdown
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((json) => setProjects(json.data ?? []))
      .catch(() => {});
  }, []);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (projectFilter) params.set("projectId", projectFilter);
    fetch(`/api/tasks?${params.toString()}`)
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) {
          setTasks(json.data ?? []);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tasks.");
        setLoading(false);
      });
  }, [statusFilter, priorityFilter, projectFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Work queue across all projects.
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
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading tasks…</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <button onClick={fetchTasks} className="mt-2 text-sm text-muted-foreground underline">Retry</button>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">No tasks found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Tasks ({tasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Priority</th>
                      <th className="pb-2 font-medium">Project</th>
                      <th className="pb-2 font-medium">Assignee</th>
                      <th className="pb-2 font-medium">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 pr-4">
                          <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">{task.title}</Link>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={statusVariant(task.status)}>{task.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                        </td>
                        <td className="py-2 pr-4">{task.projectName}</td>
                        <td className="py-2 pr-4">{task.assigneeName}</td>
                        <td className="py-2">{new Date(task.dueDate).toLocaleDateString()}</td>
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
