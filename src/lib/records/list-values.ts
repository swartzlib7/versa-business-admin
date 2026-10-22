/**
 * Stored values for the `text_list` and `multi_lookup` catalog data types.
 * Both are JSON arrays in the record's `data`. Contract: state_hats.md § 1.4.
 */

export const TEXT_LIST_MAX = 50;

/** Entries of a text list. A non-array value opens as one entry (older plain text). */
export function parseTextList(raw: string | null | undefined): string[] {
  const text = (raw ?? "").trim();
  if (!text) return [];
  if (!text.startsWith("[")) return [text];
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [text];
    return parsed
      .map((item) => (typeof item === "string" ? item : item == null ? "" : String(item)))
      .filter((item) => item.trim() !== "")
      .slice(0, TEXT_LIST_MAX);
  } catch {
    return [text];
  }
}

/** Blank entries are dropped. An empty list writes an empty string. */
export function serializeTextList(entries: string[]): string {
  const kept = entries.filter((entry) => entry.trim() !== "").slice(0, TEXT_LIST_MAX);
  return kept.length ? JSON.stringify(kept) : "";
}

/** Record ids of a multi-lookup, de-duplicated, in stored order. */
export function parseIdList(raw: string | null | undefined): string[] {
  const text = (raw ?? "").trim();
  if (!text) return [];
  let items: unknown[];
  try {
    const parsed: unknown = JSON.parse(text);
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    items = text.split(",");
  }
  const ids: string[] = [];
  for (const item of items) {
    const id = String(item ?? "").trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function serializeIdList(ids: string[]): string {
  const kept = [...new Set(ids.filter(Boolean))];
  return kept.length ? JSON.stringify(kept) : "";
}

/** Move one item to another index. Out-of-range moves return the same order. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) return items;
  const target = Math.max(0, Math.min(items.length - 1, to));
  if (target === from) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}
