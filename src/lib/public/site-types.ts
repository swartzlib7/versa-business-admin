export type CycleStep = {
  number: string;
  numberEnabled: boolean;
  title: string;
  titleEnabled: boolean;
  desc: string;
  descEnabled: boolean;
  enabled: boolean;
};

export const DEFAULT_CYCLE_STEPS: CycleStep[] = [
  { number: "01", numberEnabled: true, title: "Observe", titleEnabled: true, desc: "See the field as it actually is.", descEnabled: true, enabled: true },
  { number: "02", numberEnabled: true, title: "Plan", titleEnabled: true, desc: "Choose the next right move.", descEnabled: true, enabled: true },
  { number: "03", numberEnabled: true, title: "Communicate", titleEnabled: true, desc: "Align people and agents.", descEnabled: true, enabled: true },
  { number: "04", numberEnabled: true, title: "Supervise", titleEnabled: true, desc: "Hold the standard while work runs.", descEnabled: true, enabled: true },
  { number: "05", numberEnabled: true, title: "Produce", titleEnabled: true, desc: "Execute with clear ownership.", descEnabled: true, enabled: true },
  { number: "06", numberEnabled: true, title: "Serve", titleEnabled: true, desc: "Deliver and measure the outcome.", descEnabled: true, enabled: true },
];

export const STAT_SCALES = ["hour", "day", "week", "month", "year", "custom"] as const;
export type StatScale = (typeof STAT_SCALES)[number];

export type PublicStat = {
  id: string;
  label: string;
  value: string;
  unit: string;
  category: string;
  scale: StatScale;
  series: number[];
};
