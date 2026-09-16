import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { composeHomeContent } from "@/lib/public/demo-content";

export const dynamic = "force-dynamic";

/** PB-17 / DM-01: composed homepage section data for the visitor page and builder miniatures. */
export async function GET() {
  const site = await getPublicSiteSettings();
  const data = await composeHomeContent(site);
  return NextResponse.json({ data });
}
