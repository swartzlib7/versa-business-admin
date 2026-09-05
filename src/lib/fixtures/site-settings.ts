/**
 * #252 Settings functionality slice - fixture-mode site settings.
 * Beta :3200 runs DATA_SOURCE=fixture; branding must survive restart (file
 * persist under .data/site-settings.json) and stay shared across Next.js
 * bundle copies via globalThis.
 */

import fs from "fs";
import path from "path";
import { theme } from "@/lib/theme";
import type { CycleStep } from "@/lib/public/site-types";

export type { CycleStep };

export interface FixtureSiteSettings {
  brand_name: string;
  brand_color: string;
  brand_logo_url?: string | null;
  brand_logo_opacity?: number;
  brand_logo_glow?: number;
  constellation_variant?: "classic" | "realistic";
  demo_mode?: boolean;
  maintenance_mode?: boolean;
  hero_headline?: string;
  hero_subhead?: string;
  cycle_enabled?: boolean;
  cycle_steps?: CycleStep[];
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  menu_order?: string[];
  public_login_enabled?: boolean;
  glossary_in_menu?: boolean;
  org_board_enabled?: boolean;
}

const GLOBAL_KEY = "__versaSiteSettingsFixture__";
const FILE_PATH = path.join(process.cwd(), ".data", "site-settings.json");

function readStore(): FixtureSiteSettings | null {
  return (
    ((globalThis as Record<string, unknown>)[GLOBAL_KEY] as
      | FixtureSiteSettings
      | null) ?? null
  );
}

function writeStore(value: FixtureSiteSettings): void {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = value;
}

function readFile(): FixtureSiteSettings | null {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<FixtureSiteSettings>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      brand_name:
        typeof parsed.brand_name === "string" && parsed.brand_name.trim()
          ? parsed.brand_name
          : theme.brand.name,
      brand_color:
        typeof parsed.brand_color === "string" && parsed.brand_color.trim()
          ? parsed.brand_color
          : theme.colors.brand,
      brand_logo_url:
        typeof parsed.brand_logo_url === "string" && parsed.brand_logo_url
          ? parsed.brand_logo_url
          : null,
      brand_logo_opacity:
        typeof parsed.brand_logo_opacity === "number"
          ? parsed.brand_logo_opacity
          : undefined,
      brand_logo_glow:
        typeof parsed.brand_logo_glow === "number"
          ? parsed.brand_logo_glow
          : undefined,
      constellation_variant:
        parsed.constellation_variant === "realistic" || parsed.constellation_variant === "classic"
          ? parsed.constellation_variant
          : undefined,
      demo_mode: parsed.demo_mode !== false,
      maintenance_mode: parsed.maintenance_mode === true,
      hero_headline: typeof parsed.hero_headline === "string" ? parsed.hero_headline : undefined,
      hero_subhead: typeof parsed.hero_subhead === "string" ? parsed.hero_subhead : undefined,
      cycle_enabled: parsed.cycle_enabled,
      cycle_steps: Array.isArray(parsed.cycle_steps) ? parsed.cycle_steps : undefined,
      contact_email: typeof parsed.contact_email === "string" ? parsed.contact_email : undefined,
      contact_phone: typeof parsed.contact_phone === "string" ? parsed.contact_phone : undefined,
      contact_address: typeof parsed.contact_address === "string" ? parsed.contact_address : undefined,
      menu_order: Array.isArray(parsed.menu_order)
        ? parsed.menu_order.filter((href): href is string => typeof href === "string")
        : undefined,
      public_login_enabled: parsed.public_login_enabled !== false,
      glossary_in_menu: parsed.glossary_in_menu !== false,
      org_board_enabled: parsed.org_board_enabled !== false,
    };
  } catch {
    return null;
  }
}

function writeFile(value: FixtureSiteSettings): void {
  try {
    fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(value, null, 2));
  } catch (err) {
    console.error("Failed to persist site settings:", err);
  }
}

function defaults(): FixtureSiteSettings {
  return {
    brand_name: theme.brand.name,
    brand_color: theme.colors.brand,
    brand_logo_url: null,
    brand_logo_opacity: 1,
    brand_logo_glow: 0,
    constellation_variant: "classic",
    demo_mode: true,
    maintenance_mode: false,
    public_login_enabled: true,
    glossary_in_menu: true,
    org_board_enabled: true,
  };
}

export function getSiteSettingsFixture(): FixtureSiteSettings {
  const memory = readStore();
  if (memory) return { ...memory };
  const fromFile = readFile();
  if (fromFile) {
    writeStore(fromFile);
    return { ...fromFile };
  }
  const seeded = defaults();
  writeStore(seeded);
  return { ...seeded };
}

export function upsertSiteSettingsFixture(
  input: Partial<FixtureSiteSettings>,
): FixtureSiteSettings {
  const current = getSiteSettingsFixture();
  const next: FixtureSiteSettings = {
    brand_name: input.brand_name ?? current.brand_name,
    brand_color: input.brand_color ?? current.brand_color,
    brand_logo_url:
      input.brand_logo_url !== undefined
        ? input.brand_logo_url
        : current.brand_logo_url ?? null,
    brand_logo_opacity:
      input.brand_logo_opacity !== undefined
        ? input.brand_logo_opacity
        : current.brand_logo_opacity ?? 1,
    brand_logo_glow:
      input.brand_logo_glow !== undefined
        ? input.brand_logo_glow
        : current.brand_logo_glow ?? 0,
    constellation_variant:
      input.constellation_variant !== undefined
        ? input.constellation_variant
        : current.constellation_variant ?? "classic",
    demo_mode:
      input.demo_mode !== undefined
        ? input.demo_mode
        : current.demo_mode !== false,
    maintenance_mode:
      input.maintenance_mode !== undefined
        ? input.maintenance_mode
        : current.maintenance_mode === true,
    hero_headline:
      input.hero_headline !== undefined ? input.hero_headline : current.hero_headline,
    hero_subhead:
      input.hero_subhead !== undefined ? input.hero_subhead : current.hero_subhead,
    cycle_enabled:
      input.cycle_enabled !== undefined ? input.cycle_enabled : current.cycle_enabled,
    cycle_steps:
      input.cycle_steps !== undefined ? input.cycle_steps : current.cycle_steps,
    contact_email:
      input.contact_email !== undefined ? input.contact_email : current.contact_email,
    contact_phone:
      input.contact_phone !== undefined ? input.contact_phone : current.contact_phone,
    contact_address:
      input.contact_address !== undefined ? input.contact_address : current.contact_address,
    menu_order:
      input.menu_order !== undefined ? input.menu_order : current.menu_order,
    public_login_enabled:
      input.public_login_enabled !== undefined
        ? input.public_login_enabled
        : current.public_login_enabled !== false,
    glossary_in_menu:
      input.glossary_in_menu !== undefined
        ? input.glossary_in_menu
        : current.glossary_in_menu !== false,
    org_board_enabled:
      input.org_board_enabled !== undefined
        ? input.org_board_enabled
        : current.org_board_enabled !== false,
  };
  writeStore(next);
  writeFile(next);
  return { ...next };
}

/** Logo sidecar for postgres mode (name/color stay in the DB). */
export function getBrandLogoOverlay(): string | null {
  const fromMemory = readStore()?.brand_logo_url;
  if (fromMemory) return fromMemory;
  return readFile()?.brand_logo_url ?? null;
}

export function upsertBrandLogoFile(url: string | null): void {
  const current = readFile() ?? defaults();
  const next = { ...current, brand_logo_url: url };
  writeStore(next);
  writeFile(next);
}
