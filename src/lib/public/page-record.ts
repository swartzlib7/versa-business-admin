import { adapter } from "@/lib/data";

/** Body HTML of one Pages record, or "" when it is missing. */
export async function pageBodyHtml(id: string | undefined): Promise<string> {
  if (!id || !adapter.getRecord) return "";
  const page = await adapter.getRecord(id).catch(() => null);
  if (!page || page.type_api_name !== "page") return "";
  const body = page.data?.body_html;
  return typeof body === "string" ? body : "";
}
