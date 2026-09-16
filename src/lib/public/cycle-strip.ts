import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { DEFAULT_CYCLE_STEPS, type CycleStep } from "@/lib/public/site-types";

export const CYCLE_STRIP_TYPE = "cycle_strip";

export type CycleStripSeed = {
  id: string;
  name: string;
  number: string;
  numberEnabled: boolean;
  nameEnabled: boolean;
  description: string;
  descriptionEnabled: boolean;
  sortOrder: number;
};

export const CYCLE_STRIP_SEED: CycleStripSeed[] = DEFAULT_CYCLE_STEPS.map((step, i) => ({
  id: `cs-${String(i + 1).padStart(2, "0")}`,
  name: step.title,
  number: step.number,
  numberEnabled: step.numberEnabled,
  nameEnabled: step.titleEnabled,
  description: step.desc,
  descriptionEnabled: step.descEnabled,
  sortOrder: (i + 1) * 10,
}));

export function cycleRecordToStep(row: RecordInstance): CycleStep {
  const numberEnabled = row.data.number_enabled === "true";
  const nameEnabled = row.data.name_enabled !== "false";
  const descEnabled = row.data.description_enabled === "true";
  return {
    number: row.data.number || "",
    numberEnabled,
    title: row.name,
    titleEnabled: nameEnabled,
    desc: row.data.description || "",
    descEnabled: descEnabled,
    enabled: row.status !== "inactive" && (numberEnabled || nameEnabled || descEnabled),
  };
}

export function sortCycleStripRecords(rows: RecordInstance[]): RecordInstance[] {
  return rows.slice().sort((a, b) => {
    const an = Number.parseInt(a.data.sort_order || "", 10);
    const bn = Number.parseInt(b.data.sort_order || "", 10);
    const av = Number.isFinite(an) ? an : 0;
    const bv = Number.isFinite(bn) ? bn : 0;
    return av - bv || a.name.localeCompare(b.name);
  });
}
