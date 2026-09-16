"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { StatGraphLine } from "@/components/statistics/stat-graph";
import type { HomeSectionContent } from "@/lib/public/demo-content";
import type { CycleStep } from "@/lib/public/site-types";

export type TwinPreview =
  | {
      kind: "stat-graph";
      values: Record<string, string>;
      headerId?: string | null;
      lines?: StatGraphLine[];
      renderOutput?: string;
      onRenderOutput?: (outputId: string) => void;
    }
  | {
      kind: "canvas-driver";
      driver: string;
      label?: string;
      note?: string;
      renderOutput?: string;
      onRenderOutput?: (outputId: string) => void;
      homeContent?: HomeSectionContent | null;
      cycleSteps?: CycleStep[];
      itemIndex?: number;
    }
  | null;

type TwinSlotState = {
  preview: TwinPreview;
  setPreview: (next: TwinPreview) => void;
  linesEpoch: number;
  bumpLines: () => void;
};

const TwinSlotContext = createContext<TwinSlotState | null>(null);

export function TwinSlotProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<TwinPreview>(null);
  const [linesEpoch, setLinesEpoch] = useState(0);
  const value = useMemo(
    () => ({
      preview,
      setPreview,
      linesEpoch,
      bumpLines: () => setLinesEpoch((n) => n + 1),
    }),
    [preview, linesEpoch],
  );
  return <TwinSlotContext.Provider value={value}>{children}</TwinSlotContext.Provider>;
}

export function useTwinSlot(): TwinSlotState {
  const ctx = useContext(TwinSlotContext);
  if (!ctx) {
    return {
      preview: null,
      setPreview: () => undefined,
      linesEpoch: 0,
      bumpLines: () => undefined,
    };
  }
  return ctx;
}
