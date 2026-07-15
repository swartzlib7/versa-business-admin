import { AppShell } from '@/components/shell/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MissionControlScene } from '@/components/r3f/mission-control-scene';
import { agents, projects, tasks, integrations } from '@/lib/fixtures';

export default function DashboardPage() {
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const pendingTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'planned').length;
  const connectedIntegrations = integrations.filter((i) => i.status === 'connected').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground">
            Overview of your Versa AGi-powered business operations.
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
            <MissionControlScene />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{task.title}</span>
                    <Badge
                      variant={
                        task.status === 'done'
                          ? 'default'
                          : task.status === 'in_progress'
                          ? 'secondary'
                          : task.status === 'blocked'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="ml-2 shrink-0"
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {agents.map((agent) => (
                  <li key={agent.id} className="flex items-center justify-between text-sm">
                    <span>{agent.name}</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            agent.status === 'active'
                              ? '#22c55e'
                              : agent.status === 'idle'
                              ? '#eab308'
                              : agent.status === 'error'
                              ? '#ef4444'
                              : '#6b7280',
                        }}
                      />
                      {agent.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
