"use client";

import { AppShell } from "@/components/shell/app-shell";
import { ZoneConfigView } from "@/components/zones/zone-config-view";
import { collaborationZone } from "@/lib/zones/zone-definitions";

export default function CollaborationZonePage() {
  return (
    <AppShell>
      <ZoneConfigView config={collaborationZone} />
    </AppShell>
  );
}
