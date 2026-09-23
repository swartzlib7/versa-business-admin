/** Title + body for the HTML Page “Record card” render option. */
export type PageRecordCard = {
  title: string;
  html: string;
  format?: string;
};

export function pageRecordCardFrom(
  rec: { name?: string; data?: Record<string, string | undefined> } | null | undefined,
): PageRecordCard | null {
  if (!rec) return null;
  const data = rec.data ?? {};
  const title = String(data.name || rec.name || "").trim() || "Page";
  const htmlRaw = [data.body_html, data.body, data.html].find(
    (value) => typeof value === "string" && value.trim(),
  );
  return {
    title,
    html: typeof htmlRaw === "string" ? htmlRaw : "",
    format: typeof data.body_format === "string" ? data.body_format : undefined,
  };
}
