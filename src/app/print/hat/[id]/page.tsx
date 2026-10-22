"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintFrame, PrintSheet } from "@/components/print/print-frame";
import {
  HatImagesSheet,
  HatWriteupSheet,
  loadHatWriteup,
  type HatWriteupPreview,
} from "@/components/zones/hat-writeup-preview";
import type { RecordInstance } from "@/lib/fixtures/record-instances";

/** Sizes fit inside both Letter and A4 with 15 mm margins. */
const SHEET_WIDTH = "180mm";
const IMAGES_HEIGHT = "245mm";
const SCREEN_MARGIN = "15mm";

/** Hat write-up, then its images on a new sheet. Contract: state_hats.md § 1.8. */
export default function HatPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [hat, setHat] = useState<HatWriteupPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/records/${encodeURIComponent(id)}`, { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then(async (json: { data?: RecordInstance | null }) => {
        const inst = json.data;
        if (!inst || inst.type_api_name !== "executive_hat") {
          setError("This hat could not be found.");
          return;
        }
        const next = await loadHatWriteup(inst);
        if (!controller.signal.aborted) setHat(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("This hat could not be loaded.");
      });
    return () => controller.abort();
  }, [id]);

  return (
    <PrintFrame
      title={hat ? `${hat.name || "Hat"} · Hat` : "Hat"}
      orientation="portrait"
      margin="15mm"
      ready={!!hat}
      error={error}
    >
      {hat ? (
        <>
          <PrintSheet width={SHEET_WIDTH} padding={SCREEN_MARGIN}>
            <HatWriteupSheet hat={hat} className="text-[11pt]" />
          </PrintSheet>
          {hat.images.length ? (
            <PrintSheet width={SHEET_WIDTH} height={IMAGES_HEIGHT} padding={SCREEN_MARGIN} breakBefore>
              <HatImagesSheet hat={hat} className="h-full text-[11pt]" />
            </PrintSheet>
          ) : null}
        </>
      ) : null}
    </PrintFrame>
  );
}
