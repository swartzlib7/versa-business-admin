import { adapter } from "@/lib/data/adapter";
import { deleteInstance, listInstances } from "@/lib/fixtures/record-instances";
import {
  getSiteSettingsFixture,
  upsertSiteSettingsFixture,
} from "@/lib/fixtures/site-settings";
import { codeKeyFromDriverRecord, type ListedRecord } from "@/lib/public/driver-pairings";
import {
  normalizePageBuilder,
  pairingCellUsages,
  remapPairingIds,
} from "@/lib/public/page-builder";
import { listPairingRecords, pairingIdentityKey } from "@/lib/public/pairing-unique";
import { RENDER_DRIVER_TYPE } from "@/lib/public/render-driver-locks";

/** Collapse leftover duplicate Elements so one pairing remains per driver × record. */
export async function ensureUniquePairings(): Promise<void> {
  const pairings = await listPairingRecords();
  const drivers = adapter.listRecords
    ? await adapter.listRecords({ type_api_name: RENDER_DRIVER_TYPE })
    : listInstances({ type_api_name: RENDER_DRIVER_TYPE });
  const codeByDriverId = new Map(
    drivers.map((row) => [row.id, codeKeyFromDriverRecord(row)] as const),
  );

  const groups = new Map<string, ListedRecord[]>();
  for (const row of pairings) {
    const code = codeByDriverId.get(String(row.data?.driver_id ?? "")) || undefined;
    const key = pairingIdentityKey(row, code);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const remap = new Map<string, string>();
  const drop: string[] = [];
  const pb = normalizePageBuilder(getSiteSettingsFixture().page_builder);

  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    const ranked = [...rows].sort((a, b) => {
      const usage = pairingCellUsages(pb, b.id).length - pairingCellUsages(pb, a.id).length;
      if (usage !== 0) return usage;
      return String(a.data?.created_at ?? a.id).localeCompare(String(b.data?.created_at ?? b.id));
    });
    const keep = ranked[0];
    for (const extra of ranked.slice(1)) {
      remap.set(extra.id, keep.id);
      drop.push(extra.id);
    }
  }

  if (remap.size) {
    upsertSiteSettingsFixture({ page_builder: remapPairingIds(pb, remap) });
  }
  for (const id of drop) {
    if (adapter.deleteRecord) await adapter.deleteRecord(id);
    else deleteInstance(id);
  }
}
