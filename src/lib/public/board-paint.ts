import { pointsInMonth, scheduleDetail } from "@/lib/public/schedule-times";

export type IntegrationRow = {
  name: string;
  kind: string;
  status: string;
  vendorName: string;
  logoUrl: string;
};

export type IntegrationPaint = { rows: IntegrationRow[] };

export type ScheduleMark = { date: string; name: string };

export type ScheduleMonth = { label: string; year: number; month: number; days: number };

export type SchedulePaint = {
  months: ScheduleMonth[];
  marks: ScheduleMark[];
  rows: { name: string; detail: string }[];
};

export type InspectionRow = {
  name: string;
  status: string;
  summary: string;
};

export type InspectionPaint = {
  rows: InspectionRow[];
};

export type ProjectTask = { name: string; status: string };

export type ProjectRow = {
  name: string;
  status: string;
  priority: string;
  start: string;
  target: string;
  taskCount: number;
  tasks: ProjectTask[];
};

export type ProjectPaint = { rows: ProjectRow[] };

export function integrationPaint(
  records: Array<{ name?: string; data?: Record<string, string> }>,
  vendorById: Map<string, { name: string; logoUrl: string }>,
): IntegrationPaint {
  return {
    rows: records.map((rec) => {
      const vendor = vendorById.get(String(rec.data?.organization_id ?? ""));
      return {
        name: rec.data?.name || rec.name || "Integration",
        kind: rec.data?.kind || "",
        status: rec.data?.status || "",
        vendorName: vendor?.name || "",
        logoUrl: vendor?.logoUrl || "",
      };
    }),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function scheduleBoard(
  records: Array<{ name?: string; data?: Record<string, string> }>,
  now = new Date(),
): SchedulePaint {
  const rows = records.map((rec) => ({
    name: rec.data?.name || rec.name || "Schedule",
    detail: scheduleDetail(rec.data ?? {}),
    data: rec.data ?? {},
  }));
  const months = new Map<string, ScheduleMonth>();
  const addMonth = (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (months.has(key)) return;
    months.set(key, {
      label: `${MONTHS[month]} ${year}`,
      year,
      month,
      days: new Date(year, month + 1, 0).getDate(),
    });
  };
  addMonth(now.getFullYear(), now.getMonth());
  const marks: ScheduleMark[] = [];
  for (const row of rows) {
    const custom = String(row.data.custom_slots ?? "");
    const once = String(row.data.occurs_at ?? "");
    for (const raw of [once, ...custom.match(/\d{4}-\d{2}-\d{2}/g) ?? []]) {
      const match = /^(\d{4})-(\d{2})/.exec(raw);
      if (match) addMonth(Number(match[1]), Number(match[2]) - 1);
    }
  }
  const nowKey = `${now.getFullYear()}-${now.getMonth()}`;
  for (const month of months.values()) {
    const isCurrent = `${month.year}-${month.month}` === nowKey;
    for (const row of rows) {
      const kind = String(row.data.kind ?? "");
      if (!isCurrent && kind !== "custom" && kind !== "one-time") continue;
      for (const date of pointsInMonth(row.data, month.year, month.month)) {
        marks.push({ date, name: row.name });
      }
    }
  }
  return {
    months: [...months.values()],
    marks,
    rows: rows.map(({ name, detail }) => ({ name, detail })),
  };
}

export function inspectionPaint(
  records: Array<{ name?: string; status?: string; data?: Record<string, string> }>,
): InspectionPaint {
  return {
    rows: records.map((rec) => ({
      name: rec.data?.name || rec.name || "Inspection",
      status: rec.data?.status || rec.status || "",
      summary: rec.data?.summary || "",
    })),
  };
}

export function projectPaint(
  projects: Array<{ id: string; name?: string; status?: string; data?: Record<string, string> }>,
  tasks: Array<{ name?: string; status?: string; data?: Record<string, string> }>,
): ProjectPaint {
  return {
    rows: projects.map((project) => {
      const mine = tasks.filter((task) => task.data?.project_id === project.id);
      return {
        name: project.data?.name || project.name || "Project",
        status: project.data?.status || project.status || "",
        priority: project.data?.priority || "",
        start: project.data?.start_date || "",
        target: project.data?.target_date || "",
        taskCount: mine.length,
        tasks: mine.map((task) => ({
          name: task.data?.name || task.name || "Task",
          status: task.data?.status || task.status || "",
        })),
      };
    }),
  };
}
