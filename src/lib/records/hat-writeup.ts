/**
 * Hat write-up shared by the Spatial Twin and the print page.
 * Contract: docs/production/state/state_hats.md § 1.6–1.8.
 */
import { parseIdList, parseTextList } from "@/lib/records/list-values";
import { parseRecordImages, type RecordImageRef } from "@/lib/records/record-image-refs";

export type HatWriteup = {
  recordId: string | null;
  name: string;
  status: string;
  holders: string[];
  purposes: string[];
  knowHow: string[];
  duties: string[];
  images: RecordImageRef[];
};

/** One column for a single image, two otherwise; rows fill left to right. */
export function imageGridFor(count: number): { rows: number; cols: number } {
  if (count <= 0) return { rows: 0, cols: 0 };
  const cols = count === 1 ? 1 : 2;
  return { rows: Math.ceil(count / cols), cols };
}

/** Build the write-up from a Hat's stored values. Unknown holder ids are skipped. */
export function hatWriteupFrom(
  record: { id?: string | null; name?: string; status?: string; data?: Record<string, string> },
  holderNames: Map<string, string>,
): HatWriteup {
  const data = record.data ?? {};
  return {
    recordId: record.id ?? null,
    name: record.name ?? data.name ?? "",
    status: record.status ?? data.status ?? "",
    holders: parseIdList(data.holder_ids)
      .map((id) => holderNames.get(id))
      .filter((name): name is string => Boolean(name)),
    purposes: parseTextList(data.purposes),
    knowHow: parseTextList(data.know_how),
    duties: parseTextList(data.duties),
    images: parseRecordImages(data.images ?? ""),
  };
}
