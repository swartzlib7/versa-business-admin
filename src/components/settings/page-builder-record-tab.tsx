"use client";

import { ZoneConfigView, type ZoneConfig, type ZoneTab } from "@/components/zones/zone-config-view";
import { theme } from "@/lib/theme";

const envAccent = theme.scene.environmentalColor ?? "#f97316";

function soft(hex: string, alpha = "22") {
  if (hex.startsWith("#") && hex.length === 7) return hex + alpha;
  return hex;
}

export type ElementsSubKind = "pairings" | "render-drivers";

const TABS: Record<
  ElementsSubKind,
  {
    api: string;
    label: string;
    summary: string;
    parentKind: "environment" | "faculty";
    parentApiName: string;
    structure: "list" | "header_lines";
  }
> = {
  pairings: {
    api: "driver_pairing",
    label: "Configuration",
    summary: "Instance on a Cell: this record × this driver recipe. Cannot delete while a Cell still points at it.",
    parentKind: "environment",
    parentApiName: "custom",
    structure: "list",
  },
  "render-drivers": {
    api: "render_driver",
    label: "Rendering Drivers",
    summary: "Header is record type + shape. Lines are recipes. Connect records on this screen.",
    parentKind: "environment",
    parentApiName: "custom",
    structure: "header_lines",
  },
};

export const ELEMENTS_SUB_TABS: { id: ElementsSubKind; label: string }[] = [
  { id: "pairings", label: "Configuration" },
  { id: "render-drivers", label: "Rendering Drivers" },
];

export function PageBuilderRecordTab({
  kind,
}: {
  kind: ElementsSubKind;
}) {
  const spec = TABS[kind];
  const tab: ZoneTab = {
    // Do not use a hub sphere id (knowledge/locations/…). That loaded the
    // Environment 3D twin on every Elements sub-tab.
    id: spec.api,
    label: spec.label,
    summary: spec.summary,
    presentation: "listing",
    structure: spec.structure,
    fields: [
      { label: "Name", placeholder: "Name" },
      { label: "Status", placeholder: "Status" },
    ],
    relations: [],
    recordTypeApiName: spec.api,
    objectApiName: spec.api,
    parentKind: spec.parentKind,
    parentApiName: spec.parentApiName,
  };
  const config: ZoneConfig = {
    id: "environment",
    title: spec.label,
    subtitle: spec.summary,
    accent: envAccent,
    accentSoft: soft(envAccent),
    tabs: [tab],
  };
  return (
    <ZoneConfigView config={config} chrome="embed" showTwin={false} />
  );
}
