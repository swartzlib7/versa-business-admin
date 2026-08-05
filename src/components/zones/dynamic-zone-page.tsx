"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { ZoneConfigView, type ZoneConfig } from "@/components/zones/zone-config-view";
import { applyRecordTypesToZoneTabs, type ZoneRecordType } from "@/lib/zones/record-type-tabs";

type ParentKind = "faculty" | "collaboration" | "environment";
type Props = { config: ZoneConfig; parentKind: ParentKind };

/** Fetches runtime record types so editor-created tabs survive client navigation and refresh. */
export function DynamicZonePage({ config, parentKind }: Props) {
  const [recordTypes, setRecordTypes] = useState<ZoneRecordType[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ parent_kind: parentKind });
    void fetch(`/api/catalog/record-types?${params}`, { credentials: "include", signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : Promise.reject(new Error("Failed to load record types"))))
      .then((payload: { data?: ZoneRecordType[] }) => setRecordTypes(payload.data ?? []))
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") setRecordTypes([]); });
    return () => controller.abort();
  }, [parentKind]);

  return <AppShell><ZoneConfigView config={{ ...config, tabs: applyRecordTypesToZoneTabs(config.tabs, parentKind, recordTypes) }} /></AppShell>;
}
