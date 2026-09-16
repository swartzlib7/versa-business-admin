import { adapter } from "@/lib/data/adapter";
import { createInstance, listInstances } from "@/lib/fixtures/record-instances";
import { PAGE_ELEMENT_SEED, PAGE_ELEMENT_TYPE } from "@/lib/public/page-elements";

/** Idempotent system seed of Element records so the Palette has drivers. */
export async function ensurePageElementRecords(): Promise<void> {
  const existing = adapter.listRecords
    ? await adapter.listRecords({ type_api_name: PAGE_ELEMENT_TYPE })
    : listInstances({ type_api_name: PAGE_ELEMENT_TYPE });
  const have = new Set(existing.map((row) => row.id));
  const haveDriver = new Set(
    existing.map((row) => (row.data?.driver || "").trim()).filter(Boolean),
  );
  for (const row of PAGE_ELEMENT_SEED) {
    if (have.has(row.id) || haveDriver.has(row.driver)) continue;
    const input = {
      id: row.id,
      type_api_name: PAGE_ELEMENT_TYPE,
      parent_kind: "environment" as const,
      parent_api_name: "knowledge",
      name: row.name,
      status: "active",
      data: {
        name: row.name,
        driver: row.driver,
        kind: row.kind,
        record_type: row.recordType ?? "",
        feature_id: row.featureId ?? "",
        description: row.description,
        preview: row.preview,
        created_by: "user-coa",
        last_modified_by: "user-coa",
      },
    };
    if (adapter.createRecord) {
      await adapter.createRecord(input, { createdBy: "user-coa" });
    } else {
      createInstance(input);
    }
  }
}
