import { AppShell } from '@/components/shell/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { integrations } from '@/lib/fixtures';

export default function IntegrationsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connected systems and services managed through Versa AGi.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
                <Badge
                  variant={
                    integration.status === 'connected'
                      ? 'default'
                      : integration.status === 'error'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {integration.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Type: {integration.type} &middot; Last sync: {new Date(integration.lastSync).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
