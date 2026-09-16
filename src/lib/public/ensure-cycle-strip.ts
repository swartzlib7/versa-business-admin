import { adapter } from "@/lib/data/adapter";
import { createInstance, listInstances } from "@/lib/fixtures/record-instances";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { CYCLE_STRIP_SEED, CYCLE_STRIP_TYPE } from "@/lib/public/cycle-strip";
import { DEFAULT_CYCLE_STEPS, type CycleStep } from "@/lib/public/site-types";

function stepsFromSettings(): CycleStep[] {
  const saved = getSiteSettingsFixture().cycle_steps;
  return Array.isArray(saved) && saved.length ? (saved as CycleStep[]) : DEFAULT_CYCLE_STEPS;
}

/** Idempotent seed: heading (title) becomes Name. Migrates old settings JSON when empty. */
export async function ensureCycleStripRecords(): Promise<void> {
  const existing = adapter.listRecords
    ? await adapter.listRecords({ type_api_name: CYCLE_STRIP_TYPE })
    : listInstances({ type_api_name: CYCLE_STRIP_TYPE });
  if (existing.length) return;
  const source = stepsFromSettings();
  const rows = source.length ? source : DEFAULT_CYCLE_STEPS;
  for (let i = 0; i < rows.length; i++) {
    const step = rows[i];
    const seed = CYCLE_STRIP_SEED[i];
    const name = (step.title || seed?.name || "").trim();
    if (!name) continue;
    const input = {
      id: seed?.id ?? `cs-${String(i + 1).padStart(2, "0")}`,
      type_api_name: CYCLE_STRIP_TYPE,
      parent_kind: "environment" as const,
      parent_api_name: "knowledge",
      name,
      status: step.enabled === false ? "inactive" : "active",
      data: {
        name,
        number: step.number || seed?.number || String(i + 1).padStart(2, "0"),
        number_enabled: step.numberEnabled ? "true" : "false",
        name_enabled: step.titleEnabled ? "true" : "false",
        description: step.desc || "",
        description_enabled: step.descEnabled ? "true" : "false",
        sort_order: String((i + 1) * 10),
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
