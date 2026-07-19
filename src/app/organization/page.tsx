"use client";

import { AppShell } from "@/components/shell/app-shell";
import { ZoneConfigView } from "@/components/zones/zone-config-view";
import { organizationZone } from "@/lib/zones/zone-definitions";

export default function OrganizationZonePage() {
  return (
    <AppShell>
      <ZoneConfigView config={organizationZone} />
    </AppShell>
  );
}
