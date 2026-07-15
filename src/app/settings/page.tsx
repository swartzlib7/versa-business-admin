import { AppShell } from '@/components/shell/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/lib/theme';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            White-label configuration and system preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize how your mission control appears. These tokens are used throughout the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Name</label>
                <Input defaultValue={theme.brand.name} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Name</label>
                <Input defaultValue={theme.brand.shortName} readOnly />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Color</label>
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-md border"
                  style={{ backgroundColor: theme.colors.brand }}
                />
                <Input defaultValue={theme.colors.brand} readOnly className="font-mono" />
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              These are placeholder tokens. In production, customers will configure their own branding
              via environment variables or a setup wizard.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
            <CardDescription>System-level configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Base URL</label>
              <Input defaultValue="/api" readOnly className="font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Version</label>
              <Input defaultValue="0.1.0" readOnly className="font-mono" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
