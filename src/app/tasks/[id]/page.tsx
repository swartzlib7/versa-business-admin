"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/data";

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

export default function TaskDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        if (r.status === 404) {
          setError("Task not found.");
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) {
          setTask(json.data);
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load task.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading task…</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (error || !task) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Link href="/tasks" className="text-sm text-muted-foreground hover:underline">&larr; Back to tasks</Link>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-destructive">{error ?? "Task not found."}</p>
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
          <Link href="/tasks" className="text-sm text-muted-foreground hover:underline">&larr; Back to tasks</Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(task.status)}>{task.status.replace("_", " ")}</Badge>
            <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Project</p>
                <Link href={`/projects/${task.projectId}`} className="mt-1 block text-sm text-foreground hover:underline">
                  {task.projectName}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium">Assignee</p>
                <p className="mt-1 text-sm text-muted-foreground">{task.assigneeName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="mt-1 text-sm text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="mt-1 text-sm text-muted-foreground">{new Date(task.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Updated</p>
                <p className="mt-1 text-sm text-muted-foreground">{new Date(task.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
