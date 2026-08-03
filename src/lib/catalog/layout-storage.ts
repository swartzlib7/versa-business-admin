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

// In-memory storage for layout configs (session-local until Phase 2+ persistence)
const layoutConfigs = new Map<string, LayoutConfig>();

function getLayoutKey(objectApiName: string, layoutType: string): string {
  return `${objectApiName}:${layoutType}`;
}

/**
 * Save a layout configuration for a specific object and layout type.
 */
export function saveLayoutConfig(config: LayoutConfig): LayoutConfig {
  const key = getLayoutKey(config.objectApiName, config.layoutType);
  layoutConfigs.set(key, config);
  return config;
}

/**
 * Get a saved layout configuration for a specific object and layout type.
 */
export function getLayoutConfig(
  objectApiName: string,
  layoutType: 'detail' | 'edit' | 'list'
): LayoutConfig | undefined {
  const key = getLayoutKey(objectApiName, layoutType);
  return layoutConfigs.get(key);
}

/**
 * Get all saved layout configurations for a specific object.
 */
export function getAllLayoutConfigs(objectApiName: string): LayoutConfig[] {
  const configs: LayoutConfig[] = [];
  for (const [key, config] of layoutConfigs.entries()) {
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
  const key = getLayoutKey(objectApiName, layoutType);
  return layoutConfigs.delete(key);
}

/**
 * Clear all layout configurations (for testing/reset).
 */
export function clearAllLayoutConfigs(): void {
  layoutConfigs.clear();
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
