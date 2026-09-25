import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { enabledCanvases, normalizePageBuilder } from "@/lib/public/page-builder";
import { requestOrigin } from "@/lib/public/request-origin";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, origin] = await Promise.all([getPublicSiteSettings(), requestOrigin()]);
  const builder = normalizePageBuilder(site.page_builder);
  const rows: MetadataRoute.Sitemap = [];
  if (builder.home_seo?.noindex !== true) rows.push({ url: `${origin}/` });
  for (const canvas of enabledCanvases(builder)) {
    if (canvas.seo?.noindex === true) continue;
    rows.push({ url: `${origin}/p/${canvas.slug}` });
  }
  return rows;
}
