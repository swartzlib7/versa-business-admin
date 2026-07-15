"use client";

import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tasks } from "@/lib/fixtures";

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export default function TasksPage() {
  const sorted = [...tasks].sort(
    (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Operational work queue across all projects.
          </p>
        </div>

        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">No tasks in queue</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tasks will appear here once created through Versa AGi.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">Assignee</th>
                      <th className="pb-2 font-medium">Project</th>
                      <th className="pb-2 font-medium">Priority</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((task) => (
                      <tr key={task.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{task.title}</td>
                        <td className="py-2 pr-4">{task.assignee}</td>
                        <td className="py-2 pr-4">{task.projectName}</td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant={
                              task.priority === "urgent"
                                ? "destructive"
                                : task.priority === "high"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">
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
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2">
                          {new Date(task.dueDate).toLocaleDateString()}
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
