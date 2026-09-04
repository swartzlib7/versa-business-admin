/**
 * Layout configuration storage for I5.6.32 Slice 3.
 * Stores form layout configurations per Record Type.
 */

import { type LayoutDefinition } from '@/lib/fixtures/catalog';

export type LayoutSection = {
  id: string;
  label: string;
  columns: 1 | 2;
  fields: LayoutField[];
};

export type LayoutField = {
  api_name: string;
  label: string;
  visible: boolean;
  span: 1 | 2;
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
 * Get a saved layout configuration for a specific object and layout type.
 */
export function getLayoutConfig(
  objectApiName: string,
  layoutType: 'detail' | 'edit' | 'list'
): LayoutConfig | undefined {
  ensureLayoutsHydrated();
  const key = getLayoutKey(objectApiName, layoutType);
  return layoutConfigMap().get(key);
}

/**
 * Get all saved layout configurations for a specific object.
 */
export function getAllLayoutConfigs(objectApiName: string): LayoutConfig[] {
  ensureLayoutsHydrated();
  const configs: LayoutConfig[] = [];
  for (const [key, config] of layoutConfigMap().entries()) {
    if (key.startsWith(`${objectApiName}:`)) {
      configs.push(config);
    }
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
