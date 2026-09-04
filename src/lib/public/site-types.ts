export type CycleStep = {
  title: string;
  desc: string;
  enabled: boolean;
};

export const DEFAULT_CYCLE_STEPS: CycleStep[] = [
  { title: "Observe", desc: "See the field as it actually is.", enabled: true },
  { title: "Plan", desc: "Choose the next right move.", enabled: true },
  { title: "Communicate", desc: "Align people and agents.", enabled: true },
  { title: "Supervise", desc: "Hold the standard while work runs.", enabled: true },
  { title: "Produce", desc: "Execute with clear ownership.", enabled: true },
  { title: "Serve", desc: "Deliver and measure the outcome.", enabled: true },
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
