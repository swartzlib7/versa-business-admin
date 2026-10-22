"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintFrame, PrintSheet } from "@/components/print/print-frame";
import {
  ProjectGanttPreviewView,
  projectGanttPreview,
  type ProjectGanttPreview,
} from "@/components/zones/project-gantt-preview";
import { projectTaskLines } from "@/lib/records/project-task-lines";
import type { RecordInstance } from "@/lib/fixtures/record-instances";

/** Fits inside both Letter and A4 landscape with 10 mm margins. */
const SHEET_WIDTH = "255mm";
const SCREEN_MARGIN = "10mm";

/** Project summary and Gantt, landscape. Contract: state_zone_erd.md "1.0.10 Project Gantt print". */
export default function ProjectPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [gantt, setGantt] = useState<ProjectGanttPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/records/${encodeURIComponent(id)}`, { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json: { data?: RecordInstance | null }) => {
        const inst = json.data;
        if (!inst || inst.type_api_name !== "executive_project") {
          setError("This project could not be found.");
          return;
        }
        setGantt(projectGanttPreview(inst, projectTaskLines(inst)));
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("This project could not be loaded.");
      });
    return () => controller.abort();
  }, [id]);

  return (
    <PrintFrame
      title={gantt ? `${gantt.name || "Project"} · Gantt` : "Project Gantt"}
      orientation="landscape"
      margin="10mm"
      ready={!!gantt}
      error={error}
    >
      {gantt ? (
        <PrintSheet width={SHEET_WIDTH} padding={SCREEN_MARGIN}>
          <ProjectGanttPreviewView preview={gantt} />
        </PrintSheet>
      ) : null}
    </PrintFrame>
  );
}
