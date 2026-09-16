import { notFound } from "next/navigation";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import {
  isOperatorPathEnabled,
  isPublicHrefEnabled,
  resolveOperatorMenu,
  resolvePublicMenu,
} from "@/lib/nav";

export function operatorMenuEnabled(): string[] {
  const settings = getSiteSettingsFixture();
  return resolveOperatorMenu({
    enabled: settings.menu_enabled,
    order: settings.menu_order,
  }).enabled;
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
