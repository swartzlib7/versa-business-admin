"use client";

import { AppShell } from "@/components/shell/app-shell";
import { ZoneConfigView } from "@/components/zones/zone-config-view";
import { environmentZone } from "@/lib/zones/zone-definitions";

export default function EnvironmentZonePage() {
  return (
    <AppShell>
      <ZoneConfigView config={environmentZone} />
    </AppShell>
  );
}
