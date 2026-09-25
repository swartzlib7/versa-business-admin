import type { MetadataRoute } from "next";
import { requestOrigin } from "@/lib/public/request-origin";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${await requestOrigin()}/sitemap.xml`,
  };
}
