/**
 * Print values (1.0.27): a record as print-ready text. Lookups show the name of what they point
 * at, picklists their label, dates as "Nov 27, 2026", currency as money in the record's Currency,
 * and an organization block gets its name, address (from a Location), phone, email and logo.
 * Everything is loaded once (`loadPrintContext`), then read synchronously while laying out pages.
 */
import fs from "node:fs";
import path from "node:path";
import { adapter } from "@/lib/data/adapter";
import { listFieldDefinitions, getValueSetByApiNameLive, listValueSetItemsLive, type FieldDefinition } from "@/lib/fixtures/catalog";
import { getInstance, listInstances, type RecordInstance } from "@/lib/fixtures/record-instances";
import { getRecordType } from "@/lib/fixtures/record-types";
import { objectFor } from "@/lib/records/pipeline";
import { isPrimaryAddress } from "@/lib/records/location-primary";
import { primaryOrganization } from "@/lib/organizations/primary-org";
import { parseRecordFiles } from "@/lib/records/record-file-refs";
import { recordImageFile } from "@/lib/records/record-images";
import { recordFile } from "@/lib/records/record-files";
import type { Organization } from "@/lib/data/types";

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

export type OrgView = { name: string; lines: string[]; phone: string; email: string; logo: Buffer | null };

export type PrintContext = {
  record: RecordInstance;
  typeLabel: string;
  /** A header field (or name / status) as text. */
  value: (field: string) => string;
  /** A lines field of one line as text. */
  lineValue: (line: Record<string, string>, field: string) => string;
  label: (field: string) => string;
  isNumeric: (field: string) => boolean;
  lines: (group?: string) => Array<Record<string, string>>;
  organization: (source: string, location?: string) => OrgView | null;
  today: string;
};

const DATE = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

export function formatDate(raw: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  return DATE.format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))));
}

export function formatMoney(raw: string, currency: string): string {
  const n = Number(raw);
  if (raw === "" || !Number.isFinite(n)) return raw;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(n);
  } catch {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function formatNumber(raw: string): string {
  const n = Number(raw);
  if (raw === "" || !Number.isFinite(n)) return raw;
  return n.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

/** Address lines of a Location: street (as typed), "City, ST 12345", country. */
export function addressLines(data: Record<string, unknown> | undefined | null): string[] {
  if (!data) return [];
  const street = text(data.address).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const cityLine = [text(data.city), [text(data.state), text(data.postal_code)].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [...street, cityLine, text(data.country)].filter(Boolean);
}

/** A logo stored on this install, as PNG or JPEG bytes (pdfkit draws only those). */
export function loadLogo(url: string): Buffer | null {
  const u = text(url);
  if (!u) return null;
  try {
    let buf: Buffer | null = null;
    const data = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(u);
    if (data) buf = Buffer.from(data[2], "base64");
    const image = /^\/api\/records\/images\/([0-9a-f-]{36})/i.exec(u);
    if (!buf && image) {
      const file = recordImageFile(image[1]);
      if (file) buf = fs.readFileSync(file.path);
    }
    const file = /^\/api\/records\/files\/([0-9a-f-]{36})/i.exec(u);
    if (!buf && file) {
      const found = recordFile(file[1]);
      if (found) buf = fs.readFileSync(found.path);
    }
    if (!buf && u.startsWith("/") && !u.startsWith("//")) {
      const publicDir = path.join(process.cwd(), "public");
      const target = path.normalize(path.join(publicDir, decodeURIComponent(u.split("?")[0])));
      if (target.startsWith(publicDir + path.sep) && fs.existsSync(target)) buf = fs.readFileSync(target);
    }
    if (!buf || buf.length > 5 * 1024 * 1024) return null;
    const png = buf[0] === 0x89 && buf[1] === 0x50;
    const jpg = buf[0] === 0xff && buf[1] === 0xd8;
    return png || jpg ? buf : null;
  } catch {
    return null;
  }
}

async function listRecords(type: string): Promise<RecordInstance[]> {
  return adapter.listRecords ? adapter.listRecords({ type_api_name: type }) : listInstances({ type_api_name: type });
}

/** Load everything a record's print needs. */
export async function loadPrintContext(record: RecordInstance): Promise<PrintContext> {
  const object = objectFor(record.type_api_name);
  const fields = listFieldDefinitions(object);
  const byName = new Map(fields.map((f) => [f.api_name, f]));
  const orgs: Organization[] = adapter.listOrganizations ? await adapter.listOrganizations() : [];
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const locations = await listRecords("location");
  const locById = new Map(locations.map((l) => [l.id, l]));
  const currency = text(record.data?.currency) || "USD";

  // Names of records the lookups point at (header and lines), one read each.
  const names = new Map<string, string>();
  const lookupIds = new Set<string>();
  for (const f of fields) {
    if ((f.data_type !== "lookup" && f.data_type !== "multi_lookup") || !f.lookup_object_api_name) continue;
    if (["organization", "record_type", "user"].includes(f.lookup_object_api_name)) continue;
    const values = f.zone_role === "list" ? (record.lines ?? []).map((l) => l.data?.[f.api_name]) : [record.data?.[f.api_name]];
    for (const v of values) for (const id of splitIds(text(v))) lookupIds.add(id);
  }
  for (const id of lookupIds) {
    if (locById.has(id)) {
      names.set(id, locById.get(id)!.name);
      continue;
    }
    const target = adapter.getRecord ? await adapter.getRecord(id) : getInstance(id) ?? null;
    if (target) names.set(id, target.name);
  }
  const userNames = new Map<string, string>();
  if (fields.some((f) => f.lookup_object_api_name === "user") && adapter.listUsers) {
    try {
      for (const u of await adapter.listUsers()) userNames.set(u.id, text((u as { name?: string }).name) || text((u as { email?: string }).email));
    } catch {
      /* users are optional on a print */
    }
  }

  const picklistLabel = (f: FieldDefinition, raw: string) => {
    if (!f.value_set_api_name) return raw;
    const vs = getValueSetByApiNameLive(f.value_set_api_name);
    if (!vs) return raw;
    const items = listValueSetItemsLive(vs.id);
    return raw
      .split(";")
      .map((part) => items.find((i) => i.api_value === part.trim())?.label ?? part.trim())
      .join(", ");
  };

  const display = (f: FieldDefinition | undefined, raw: unknown): string => {
    const v = text(raw);
    if (!f || v === "") return v;
    switch (f.data_type) {
      case "lookup":
      case "multi_lookup": {
        const ids = splitIds(v);
        return ids
          .map((id) => {
            if (f.lookup_object_api_name === "organization") return orgById.get(id)?.name ?? id;
            if (f.lookup_object_api_name === "record_type") return getRecordType(id)?.label ?? id;
            if (f.lookup_object_api_name === "user") return userNames.get(id) ?? id;
            return names.get(id) ?? id;
          })
          .join(", ");
      }
      case "picklist":
      case "multipicklist":
        return picklistLabel(f, v);
      case "date":
        return formatDate(v);
      case "currency":
        return formatMoney(v, currency);
      case "summary": {
        // A total of money (Subtotal of Line totals) prints as money; a percentage or count as a number.
        const source = f.summary?.source_field ? byName.get(f.summary.source_field) : undefined;
        return source?.data_type === "currency" && !f.summary?.percent_of ? formatMoney(v, currency) : formatNumber(v);
      }
      case "number":
      case "formula":
        return formatNumber(v);
      case "boolean":
        return /^(true|1|yes)$/i.test(v) ? "Yes" : "No";
      case "text_list":
        try {
          const list = JSON.parse(v);
          return Array.isArray(list) ? list.map((x) => text(typeof x === "object" && x ? (x as { text?: string }).text : x)).join("\n") : v;
        } catch {
          return v;
        }
      case "attachments":
        return parseRecordFiles(v).map((ref) => ref.name).join(", ");
      default:
        return v;
    }
  };

  const orgView = (org: Organization | undefined, locationId: string | undefined, own: boolean): OrgView | null => {
    if (!org && !own) return null;
    let loc: RecordInstance | undefined;
    if (locationId && locationId !== "primary") loc = locById.get(locationId);
    if (!loc && org) {
      const mine = locations.filter((l) => text(l.data?.organization_id) === org.id || (own && !text(l.data?.organization_id) && l.org_id === org.id));
      loc = mine.find((l) => isPrimaryAddress(l.data?.is_primary)) ?? (mine.length === 1 ? mine[0] : undefined);
    }
    const data = (org?.data ?? {}) as Record<string, unknown>;
    return {
      name: text(org?.name),
      lines: addressLines(loc?.data),
      phone: text(loc?.data?.phone) || text(data.phone),
      email: text(loc?.data?.email) || text(data.email),
      logo: loadLogo(text(data.logo_url)),
    };
  };
  const ownOrg = primaryOrganization(orgs);

  const lineGroups = (group?: string) =>
    (record.lines ?? [])
      .filter((l) => (group ? l.line_group === group : !l.line_group || l.line_group === "default"))
      .map((l) => l.data ?? {});

  return {
    record,
    typeLabel: getRecordType(record.type_api_name)?.label ?? record.type_api_name,
    value: (field) => {
      if (field === "name") return text(record.name);
      if (field === "status") return display(byName.get("status"), record.data?.status ?? record.status);
      return display(byName.get(field), record.data?.[field]);
    },
    lineValue: (line, field) => display(byName.get(field), line[field]),
    label: (field) => (field === "name" ? byName.get("name")?.label ?? "Name" : byName.get(field)?.label ?? field),
    isNumeric: (field) => ["number", "currency", "summary", "formula"].includes(byName.get(field)?.data_type ?? ""),
    lines: lineGroups,
    organization: (source, location) => {
      // `location` names a lookup field of the record (its value is the Location), or "primary".
      const loc = location && location !== "primary" ? text(record.data?.[location]) || undefined : undefined;
      if (source === "own") return orgView(ownOrg, loc, true);
      const id = text(record.data?.[source]);
      if (id) return orgView(orgById.get(id), loc, false);
      return loc ? orgView(undefined, loc, true) : null;
    },
    today: formatDate(new Date().toISOString().slice(0, 10)),
  };
}

function splitIds(v: string): string[] {
  if (!v) return [];
  if (v.startsWith("[")) {
    try {
      const list = JSON.parse(v);
      if (Array.isArray(list)) return list.map((x) => text(x)).filter(Boolean);
    } catch {
      /* not a list */
    }
  }
  return [v];
}
