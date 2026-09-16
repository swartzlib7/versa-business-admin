/**
 * Layout configuration storage for I5.6.32 Slice 3.
 * Stores form layout configurations per Record Type.
 */

import { getDefaultLayout, listFieldDefinitions, type LayoutDefinition } from '@/lib/fixtures/catalog';
import { normalizeLayoutColumns, type LayoutColumnCount } from '@/lib/catalog/layout-grid';

export type LayoutSection = {
  id: string;
  label: string;
  columns: LayoutColumnCount;
  fields: LayoutField[];
};

export type LayoutField = {
  api_name: string;
  label: string;
  visible: boolean;
  span: number;
};

export type LayoutConfig = {
  objectApiName: string;
  layoutType: 'detail' | 'edit' | 'list';
  sections: LayoutSection[];
};

const LAYOUT_LIVE_KEY = "__versaLayoutConfigsLive__";

function layoutConfigMap(): Map<string, LayoutConfig> {
  const g = globalThis as Record<string, unknown>;
  const existing = g[LAYOUT_LIVE_KEY] as Map<string, LayoutConfig> | undefined;
  if (existing) return existing;
  const next = new Map<string, LayoutConfig>();
  g[LAYOUT_LIVE_KEY] = next;
  return next;
}

type LayoutHook = () => void;
type LayoutHooks = { hydrate: LayoutHook; persist: LayoutHook };
const LAYOUT_HOOKS_KEY = "__versaLayoutDurableHooks__";

export function installLayoutDurableHooks(hooks: LayoutHooks): void {
  (globalThis as Record<string, unknown>)[LAYOUT_HOOKS_KEY] = hooks;
}

function layoutHooks(): LayoutHooks | null {
  return (
    ((globalThis as Record<string, unknown>)[LAYOUT_HOOKS_KEY] as LayoutHooks | null) ??
    null
  );
}

function ensureLayoutsHydrated(): void {
  layoutHooks()?.hydrate();
}

function persistLayouts(): void {
  layoutHooks()?.persist();
}

export function exportLayoutConfigs(): LayoutConfig[] {
  return [...layoutConfigMap().values()];
}

export function applyLayoutOverlay(overlay: { layoutConfigs?: LayoutConfig[] }): void {
  layoutConfigMap().clear();
  for (const config of overlay.layoutConfigs ?? []) {
    if (!config?.objectApiName || !config.layoutType) continue;
    layoutConfigMap().set(getLayoutKey(config.objectApiName, config.layoutType), config);
  }
}

function getLayoutKey(objectApiName: string, layoutType: string): string {
  return `${objectApiName}:${layoutType}`;
}

/** Catalog seed layout (same one the zone form uses when nothing is saved). */
function catalogDefaultToConfig(
  objectApiName: string,
  layoutType: 'detail' | 'edit' | 'list',
): LayoutConfig | undefined {
  const seed = getDefaultLayout(objectApiName, layoutType);
  if (!seed) return undefined;
  const byApi = new Map(listFieldDefinitions(objectApiName).map((f) => [f.api_name, f]));
  const sections = seed.body.sections
    .map((sec) => ({
      id: sec.id,
      label: sec.label,
      columns: normalizeLayoutColumns(sec.columns),
      fields: sec.fields
        .map((api) => {
          const fd = byApi.get(api);
          if (!fd) return null;
          return {
            api_name: fd.api_name,
            label: fd.label,
            visible: true,
            span: 1,
          };
        })
        .filter((f): f is LayoutField => f != null),
    }))
    .filter((sec) => sec.fields.length > 0);
  if (!sections.length) return undefined;
  return { objectApiName, layoutType, sections };
}

/**
 * Save a layout configuration for a specific object and layout type.
 */
export function saveLayoutConfig(config: LayoutConfig): LayoutConfig {
  ensureLayoutsHydrated();
  const key = getLayoutKey(config.objectApiName, config.layoutType);
  layoutConfigMap().set(key, config);
  persistLayouts();
  return config;
}

/**
 * Saved overlay if one exists; otherwise the catalog seed used at runtime.
 */
function ensureStatScaleName(config: LayoutConfig): LayoutConfig {
  if (config.objectApiName !== "statistics") return config;
  const used = new Set(config.sections.flatMap((s) => s.fields.map((f) => f.api_name)));
  if (used.has("scale_name")) return config;
  const field: LayoutField = {
    api_name: "scale_name",
    label: "Scale Name",
    visible: true,
    span: 1,
  };
  const scale = config.sections.find(
    (s) => s.label === "Scale" || s.id.includes("scale"),
  );
  if (!scale) return config;
  return {
    ...config,
    sections: config.sections.map((s) =>
      s.id === scale.id ? { ...s, fields: [field, ...s.fields] } : s,
    ),
  };
}

export function getLayoutConfig(
  objectApiName: string,
  layoutType: 'detail' | 'edit' | 'list'
): LayoutConfig | undefined {
  ensureLayoutsHydrated();
  const key = getLayoutKey(objectApiName, layoutType);
  const raw = layoutConfigMap().get(key) ?? catalogDefaultToConfig(objectApiName, layoutType);
  return raw ? ensureStatScaleName(raw) : undefined;
}

/**
 * Saved overlays for an object, plus catalog defaults for any type not saved.
 */
export function getAllLayoutConfigs(objectApiName: string): LayoutConfig[] {
  ensureLayoutsHydrated();
  const configs: LayoutConfig[] = [];
  const have = new Set<string>();
  for (const [key, config] of layoutConfigMap().entries()) {
    if (key.startsWith(`${objectApiName}:`)) {
      configs.push(ensureStatScaleName(config));
      have.add(config.layoutType);
    }
  }
  for (const layoutType of ['detail', 'edit', 'list'] as const) {
    if (have.has(layoutType)) continue;
    const seed = catalogDefaultToConfig(objectApiName, layoutType);
    if (seed) configs.push(seed);
  }
  return configs;
}

/**
 * Delete a layout configuration.
 */
export function deleteLayoutConfig(
  objectApiName: string,
  layoutType: 'detail' | 'edit' | 'list'
): boolean {
  ensureLayoutsHydrated();
  const key = getLayoutKey(objectApiName, layoutType);
  const removed = layoutConfigMap().delete(key);
  if (removed) persistLayouts();
  return removed;
}

/**
 * Clear all layout configurations (for testing/reset).
 */
export function clearAllLayoutConfigs(): void {
  layoutConfigMap().clear();
}

/**
 * Convert a LayoutConfig to a LayoutDefinition for catalog integration.
 */
export function layoutConfigToDefinition(config: LayoutConfig): LayoutDefinition {
  const sections = config.sections.map((sec) => ({
    id: sec.id,
    label: sec.label,
    columns: sec.columns,
    fields: sec.fields.filter((f) => f.visible).map((f) => f.api_name),
  }));

  return {
    id: `lay-${config.objectApiName}-${config.layoutType}-custom`,
    object_api_name: config.objectApiName,
    api_name: `${config.objectApiName}_${config.layoutType}_custom`,
    label: `${config.objectApiName} ${config.layoutType} (custom)`,
    layout_type: config.layoutType,
    version: 1,
    body: { sections },
    is_default: false,
  };
}
