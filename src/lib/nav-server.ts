import { notFound } from "next/navigation";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import {
  LOCKED_OPERATOR_HREFS,
  defaultNavHrefs,
  isOperatorPathEnabled,
  isPublicHrefEnabled,
  resolvePublicMenu,
  sanitizeMenuEnabled,
} from "@/lib/nav";

export function operatorMenuEnabled(): string[] {
  const settings = getSiteSettingsFixture();
  return sanitizeMenuEnabled(settings.menu_enabled, defaultNavHrefs(), LOCKED_OPERATOR_HREFS);
}

export function publicMenuEnabled(): string[] {
  const settings = getSiteSettingsFixture();
  return resolvePublicMenu({
    enabled: settings.public_menu_enabled,
    order: settings.public_menu_order,
  }).enabled;
}

export function gateOperatorPath(pathname: string): void {
  if (!isOperatorPathEnabled(pathname, operatorMenuEnabled())) notFound();
}

export function gatePublicHref(href: string): void {
  if (!isPublicHrefEnabled(href, publicMenuEnabled())) notFound();
}
