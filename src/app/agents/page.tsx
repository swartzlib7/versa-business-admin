import { AppShell } from '@/components/shell/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { agents } from '@/lib/fixtures';

export default function AgentsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            AI agents available to your business — status, roles, and activity.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
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
                  <span className="text-xs capitalize">{agent.status}</span>
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{agent.role}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Model: {agent.model}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last active: {new Date(agent.lastActive).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
