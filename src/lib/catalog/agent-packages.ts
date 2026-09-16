/**
 * D5 — agent packages: installable catalog seeds that merge into the
 * Primary Org overlay. Uninstall hides package fields; it does not delete
 * tenant record rows written while the package was active.
 *
 * No agitop host agent-fleet chrome. Package identifiers are dotted
 * (publisher.name). Catalog api names inside a package must use c_.
 */
import type { FieldDefinition, ValueSet, ValueSetItem } from "@/lib/fixtures/catalog";
import type { RecordTypeDefinition } from "@/lib/fixtures/record-types";
import { validateTenantApiName } from "@/lib/catalog/custom-namespace";
import {
  emptyOverlay,
  readOverlayFile,
  writeOverlayFile,
  writeOverlayPostgres,
  type CatalogOverlay,
  type InstalledAgentPackage,
} from "@/lib/catalog/durable";
import { isPostgresDataSource } from "@/lib/db/data-source";
import { applyCatalogOverlay } from "@/lib/fixtures/catalog";
import { applyRecordTypeOverlay } from "@/lib/fixtures/record-types";

export type AgentPackageCatalog = {
  fields?: FieldDefinition[];
  recordTypes?: RecordTypeDefinition[];
  valueSets?: ValueSet[];
  valueSetItems?: ValueSetItem[];
};

export type AgentPackageManifest = {
  id: string;
  version: string;
  label: string;
  description?: string;
  required_mc_version?: string;
  catalog?: AgentPackageCatalog;
};

const PACKAGE_ID = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

function fieldKey(f: FieldDefinition): string {
  return `${f.object_api_name}::${f.api_name}`;
}

function mergeByKey<T>(base: T[], extra: T[] | undefined, keyOf: (row: T) => string): T[] {
  if (!extra?.length) return [...base];
  const map = new Map(base.map((row) => [keyOf(row), row]));
  for (const row of extra) map.set(keyOf(row), row);
  return [...map.values()];
}

function validateManifest(
  manifest: AgentPackageManifest,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!PACKAGE_ID.test(manifest.id ?? "")) {
    return {
      ok: false,
      code: "INVALID_PACKAGE_ID",
      message: "Package id must be publisher.name (lowercase, underscore).",
    };
  }
  if (!manifest.version?.trim()) {
    return { ok: false, code: "VERSION_REQUIRED", message: "version is required." };
  }
  for (const field of manifest.catalog?.fields ?? []) {
    const check = validateTenantApiName(field.api_name);
    if (!check.ok) return check;
  }
  for (const rt of manifest.catalog?.recordTypes ?? []) {
    const check = validateTenantApiName(rt.api_name);
    if (!check.ok) return check;
  }
  return { ok: true };
}

async function persistOverlay(overlay: CatalogOverlay): Promise<CatalogOverlay> {
  const { resolveCatalogOverlayId } = await import("@/lib/catalog/overlay-scope");
  const organization_id = overlay.organization_id || (await resolveCatalogOverlayId());
  const next: CatalogOverlay = {
    ...overlay,
    organization_id,
    saved_at: new Date().toISOString(),
  };
  writeOverlayFile(next);
  if (isPostgresDataSource()) {
    await writeOverlayPostgres(next);
  }
  applyCatalogOverlay(next);
  applyRecordTypeOverlay(next);
  return next;
}

function overlayOrEmpty(): CatalogOverlay {
  return readOverlayFile() ?? emptyOverlay();
}

export function listInstalledPackages(): InstalledAgentPackage[] {
  return [...(overlayOrEmpty().installed_packages ?? [])];
}

export async function installAgentPackage(
  manifest: AgentPackageManifest,
): Promise<{ ok: true; installed: InstalledAgentPackage } | { ok: false; code: string; message: string }> {
  const valid = validateManifest(manifest);
  if (!valid.ok) return valid;
  const overlay = overlayOrEmpty();
  const catalog = manifest.catalog ?? {};
  const nextFields = mergeByKey(overlay.fields, catalog.fields, fieldKey).map((row) =>
    (catalog.fields ?? []).some((f) => fieldKey(f) === fieldKey(row))
      ? { ...row, active: true }
      : row,
  );
  const nextTypes = mergeByKey(
    overlay.recordTypes,
    catalog.recordTypes,
    (rt) => rt.api_name,
  ).map((row) =>
    (catalog.recordTypes ?? []).some((rt) => rt.api_name === row.api_name)
      ? { ...row, active: true }
      : row,
  );
  const installed: InstalledAgentPackage = {
    id: manifest.id,
    version: manifest.version,
    enabled: true,
    installed_at: new Date().toISOString(),
  };
  const packages = (overlay.installed_packages ?? []).filter((p) => p.id !== manifest.id);
  packages.push(installed);
  await persistOverlay({
    ...overlay,
    fields: nextFields,
    recordTypes: nextTypes,
    valueSets: mergeByKey(overlay.valueSets, catalog.valueSets, (v) => v.api_name),
    valueSetItems: mergeByKey(
      overlay.valueSetItems,
      catalog.valueSetItems,
      (i) => `${i.value_set_id}::${i.api_value}`,
    ),
    installed_packages: packages,
  });
  return { ok: true, installed };
}

export async function uninstallAgentPackage(
  packageId: string,
  catalog?: AgentPackageCatalog,
): Promise<{ ok: true; installed: InstalledAgentPackage | null } | { ok: false; code: string; message: string }> {
  const overlay = overlayOrEmpty();
  const current = (overlay.installed_packages ?? []).find((p) => p.id === packageId);
  if (!current) {
    return { ok: false, code: "NOT_INSTALLED", message: "That package is not installed." };
  }
  const hideFields = new Set((catalog?.fields ?? []).map(fieldKey));
  const hideTypes = new Set((catalog?.recordTypes ?? []).map((rt) => rt.api_name));
  const nextFields = overlay.fields.map((row) =>
    hideFields.has(fieldKey(row)) ? { ...row, active: false } : row,
  );
  const nextTypes = overlay.recordTypes.map((row) =>
    hideTypes.has(row.api_name) ? { ...row, active: false } : row,
  );
  const installed: InstalledAgentPackage = {
    ...current,
    enabled: false,
  };
  const packages = (overlay.installed_packages ?? []).map((p) =>
    p.id === packageId ? installed : p,
  );
  await persistOverlay({
    ...overlay,
    fields: nextFields,
    recordTypes: nextTypes,
    installed_packages: packages,
  });
  return { ok: true, installed };
}
