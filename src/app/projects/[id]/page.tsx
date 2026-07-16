"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project, Task } from "@/lib/data";

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "default" as const;
    case "paused": return "secondary" as const;
    case "completed": return "default" as const;
    case "archived": return "outline" as const;
    default: return "outline" as const;
  }
};

const taskStatusVariant = (status: string) => {
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

interface ProjectDetail extends Project {
  tasks: Task[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        if (r.status === 404) {
          setError("Project not found.");
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) {
          setProject(json.data);
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load project.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading project…</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (error || !project) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Link href="/projects" className="text-sm text-muted-foreground hover:underline">&larr; Back to projects</Link>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-destructive">{error ?? "Project not found."}</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link href="/projects" className="text-sm text-muted-foreground hover:underline">&larr; Back to projects</Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
            <Badge variant={priorityVariant(project.priority)}>{project.priority} priority</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="mt-1 text-sm text-muted-foreground">{project.ownerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Target Date</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks ({project.tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {project.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks linked to this project.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Priority</th>
                      <th className="pb-2 font-medium">Assignee</th>
                      <th className="pb-2 font-medium">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.tasks.map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 pr-4">
                          <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">{task.title}</Link>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={taskStatusVariant(task.status)}>{task.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                        </td>
                        <td className="py-2 pr-4">{task.assigneeName}</td>
                        <td className="py-2">{new Date(task.dueDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
