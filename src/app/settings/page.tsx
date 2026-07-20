"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { theme } from "@/lib/theme";

export default function SettingsPage() {
  const [brandName, setBrandName] = useState<string>(theme.brand.name);
  const [brandColor, setBrandColor] = useState<string>(theme.colors.brand);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Local state only — persists for session
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setBrandName(theme.brand.name);
    setBrandColor(theme.colors.brand);
  };

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
              Customize how your mission control appears. Changes are previewed
              live and saved for this session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Name</label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your brand name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Name</label>
                <Input
                  value={brandName.slice(0, 3).toUpperCase()}
                  readOnly
                  className="font-mono text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-derived from brand name
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-md border shadow-sm shrink-0"
                  style={{ backgroundColor: brandColor }}
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#6366f1"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Live Preview */}
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {brandName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{brandName}</p>
                    <p className="text-xs text-muted-foreground">
                      Sidebar badge preview
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div
                    className="h-6 rounded px-3 text-xs font-medium flex items-center text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    Active
                  </div>
                  <div
                    className="h-6 rounded px-3 text-xs font-medium flex items-center border"
                    style={{ borderColor: brandColor, color: brandColor }}
                  >
                    Outline
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                {saved ? "Saved!" : "Save Changes"}
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                Reset to Defaults
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              These are session-local previews. In production, customers will
              configure branding via environment variables or a setup wizard.
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
              <Input defaultValue="0.7.43" readOnly className="font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Glossary moved to dedicated menu page */}
        <Card>
          <CardHeader>
            <CardTitle>Glossary of Terms</CardTitle>
            <CardDescription>
              Full glossary lives on its own menu page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">
              Zone, party, and UI pattern definitions are maintained on the Glossary page
              so they stay easy to find while configuring Mission Control.
            </p>
            <a
              href="/glossary"
              className="inline-flex rounded-md px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--brand, #2563eb)" }}
            >
              Open Glossary
            </a>
          </CardContent>
        </Card>

        {/* System Information — agitop boundary */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Product boundary — Mission Control vs agitop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This application is <strong>business Mission Control</strong> — not
                Versa AGi agitop. It manages the business operating graph across three
                zones: Organization (departments), Collaboration (parties), and
                Environmental (context of work).
              </p>
              <p>
                <strong>Agents</strong> appear only as users with type{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">agent</code> or{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">human</code>.
                Agent operations, fleet management, and host system monitoring live in
                agitop — the Versa AGi internal operator console.
              </p>
              <p>
                <strong>agitop Organization</strong> may be disabled when a customer uses
                this product’s Organization model. Migrating data from agitop
                Organization into this product is a future path — not current scope.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
