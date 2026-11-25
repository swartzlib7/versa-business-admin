/**
 * Answering a pull (1.0.20, state_integrations.md §3.8). The called side returns the
 * records of one type that pass BOTH its own line's filter and the caller's filter,
 * changed on or after `since`, oldest change first, with their graph lines and the
 * deletes recorded since; 100 items a page. `marker` is this side's clock at the start,
 * less the overlap, so the two machines' clocks never need to agree.
 */
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { parsePairingFilter, recordMatchesFilter, type PairingFilterCondition } from "@/lib/public/pairing-filter";
import { lineFor, type IntegrationLine } from "@/lib/integrations/token-auth";
import { lastVersions, listDeleteRowsSince, patchRow, writeRow } from "@/lib/integrations/exchange-store";
import { itemLabel, neverSent, recordItem, statLineItem, statZoneOf, type ExchangeItem } from "@/lib/integrations/items";
import { MAX_ITEMS, PULL_OVERLAP_MS } from "@/lib/integrations/rules";

/** `as_of`: this side's clock when the pull started; `marker`: as_of less the overlap (the caller's next "since"). */
export type PullAnswer = { items: ExchangeItem[]; next_cursor: string | null; marker: string; as_of: string };

/** When a record last changed: the database's own time, which every write moves. */
function changedAt(record: RecordInstance): string {
  return String(record.updated_at ?? record.data?.updated_at ?? record.data?.created_at ?? "");
}

function changedSince(record: RecordInstance, since: Date | null): boolean {
  if (!since) return true;
  const at = Date.parse(changedAt(record));
  return Number.isNaN(at) || at >= since.getTime();
}

export async function servePull(args: {
  integration: RecordInstance;
  line: IntegrationLine;
  type: string;
  since: Date | null;
  filter: PairingFilterCondition[];
  cursor: number;
  marker?: string;
}): Promise<PullAnswer> {
  const marker = args.marker ?? new Date(Date.now() - PULL_OVERLAP_MS).toISOString();
  const asOf = new Date(Date.parse(marker) + PULL_OVERLAP_MS).toISOString();
  const { adapter } = await import("@/lib/data/adapter");
  const own = parsePairingFilter(args.line.data.flow_filter);
  const rows = adapter.listRecords ? await adapter.listRecords({ type_api_name: args.type }) : [];
  const matching = rows.filter((r) => !neverSent(r) && recordMatchesFilter(r, own) && recordMatchesFilter(r, args.filter));
  const changed = matching
    .filter((r) => changedSince(r, args.since))
    .sort((a, b) => changedAt(a).localeCompare(changedAt(b)) || a.id.localeCompare(b.id));

  const items: ExchangeItem[] = changed.map((r) => recordItem(r, "upsert"));
  if (args.type === "statistics" && String(args.line.data.flow_include_lines ?? "true") !== "false") {
    const { listStatLinesChangedSince } = await import("@/lib/db/stat-lines-store");
    for (const header of matching) {
      for (const ln of await listStatLinesChangedSince(header.id, args.since)) {
        // An empty slot VBA filled in (never given a value) is not a change; a value cleared later is.
        const cleared = Date.parse(ln.updated_at ?? "") - Date.parse(ln.created_at ?? "") > 1000;
        if (String(ln.value ?? "").trim() === "" && !cleared) continue;
        items.push(statLineItem(header.id, ln, "upsert", statZoneOf(header)));
      }
    }
  }
  const deletes = (await listDeleteRowsSince(args.integration.id, args.since)).filter((row) => {
    try {
      const item = JSON.parse(row.data.payload ?? "{}") as ExchangeItem;
      return item.table === "stat_line" ? args.type === "statistics" : item.type === args.type;
    } catch {
      return false;
    }
  });
  for (const row of deletes) items.push(JSON.parse(row.data.payload) as ExchangeItem);

  // A full pull (no `since`) re-applies everything, repairing copies changed on the other side.
  if (!args.since) for (const item of items) item.force = true;
  const page = items.slice(args.cursor, args.cursor + MAX_ITEMS);
  const next = args.cursor + MAX_ITEMS < items.length ? String(args.cursor + MAX_ITEMS) : null;

  // The called side's log: what left, once per version (a repeat inside the overlap is not logged again).
  const served = await lastVersions(args.integration.id, "outbound");
  for (const item of page) {
    if (item.action === "delete") continue;
    if (served.get(`${item.table}:${item.id}`) === item.updated_at) continue;
    await writeRow({
      name: itemLabel(item),
      origin: "outbound",
      status: "ok",
      action: item.action,
      integration_id: args.integration.id,
      source_table: item.table,
      source_id: item.id,
      source_version: item.updated_at,
      payload: JSON.stringify(item),
      error_message: "",
    });
  }
  for (const row of deletes) {
    if (row.data.status !== "ok" && page.some((i) => i.id === row.data.source_id && i.action === "delete")) {
      await patchRow(row, { status: "ok" });
    }
  }
  return { items: page, next_cursor: next, marker, as_of: asOf };
}

export { lineFor };
