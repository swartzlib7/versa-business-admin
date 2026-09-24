"use client";

import { useState, type ReactNode } from "react";
import { StatGraphTwinPreview } from "@/components/statistics/stat-graph-twin-preview";
import { PublicGlossaryBook, PublicOrgBoard } from "@/components/glossary/public-surfaces";
import { HtmlBlock } from "@/components/public/html-editor";
import type { CycleStep } from "@/lib/public/site-types";
import type { PublicContactCard } from "@/lib/public/resolve-contact-card";
import { paintKind, tilesFromOutputId } from "@/lib/public/render-drivers";
import type { PageRecordCard } from "@/lib/public/page-record-card";
import type {
  InspectionPaint,
  IntegrationPaint,
  ProjectPaint,
  SchedulePaint,
} from "@/lib/public/board-paint";

export type CanvasSlotStat = {
  headerId: string;
  values: Record<string, string>;
  lines: Array<{ series: number; slot: number; value: number }>;
};

/** PB-03: the Home hero strip, shared so the canvas driver paints it identically. */
export function CycleStrip({ steps }: { steps: CycleStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cycle Strip has no enabled steps. Enable steps in Public Content settings.
      </p>
    );
  }
  return (
    <div className="flex flex-nowrap gap-2 sm:gap-4">
      {steps.map((item, index) => (
        <div key={`${item.title}-${item.number}-${index}`} className="min-w-0 flex-1 text-center">
          {item.numberEnabled ? (
            <div className="text-lg font-bold text-muted-foreground/40 sm:text-2xl">
              {item.number || String(index + 1).padStart(2, "0")}
            </div>
          ) : null}
          {item.titleEnabled ? (
            <h3 className="mt-1 truncate text-xs font-semibold sm:text-sm">{item.title}</h3>
          ) : null}
          {item.descEnabled ? (
            <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground sm:text-xs">{item.desc}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * PB-03 (2026-09-13) - visitor-side paint for a bound canvas slot.
 * Same drivers the operator surfaces use: Cycle Strip reuses the hero strip
 * (CycleStrip); Glossary/Org Board reuse the public surfaces; Statistics
 * reuses StatGraphTwinPreview with server-provided values + lines so the
 * public page never calls the session-authed lines API.
 */
function StatisticsGrid({
  stat,
  renderOutput,
  compact,
  pager,
  pageNumber = 1,
}: {
  stat: CanvasSlotStat;
  renderOutput?: string;
  compact?: boolean;
  pager?: boolean;
  pageNumber?: number;
}) {
  const start = Math.max(0, pageNumber - 1);
  const [page, setPage] = useState(start);
  return (
    <StatGraphTwinPreview
      key={stat.headerId + ":" + start}
      values={stat.values}
      headerId={stat.headerId}
      lines={stat.lines}
      layout={tilesFromOutputId(renderOutput)}
      page={pager ? page : start}
      onPageChange={pager ? setPage : undefined}
      compact={compact}
      pager={pager}
    />
  );
}

function PageRecordCardView({ card }: { card?: PageRecordCard | null }) {
  if (!card) {
    return <p className="text-xs text-muted-foreground">Page — bind a Pages record.</p>;
  }
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm">
      <header className="shrink-0 border-b border-border/60 px-4 py-3">
        <h3 className="text-base font-semibold tracking-tight">{card.title}</h3>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-3 py-3">
        {card.html ? (
          <HtmlBlock
            html={card.html}
            format={card.format}
            className="page-html h-full min-h-full w-full max-w-full flex-1 whitespace-normal break-words text-sm leading-relaxed text-foreground"
          />
        ) : (
          <p className="text-sm text-muted-foreground">This page has no body yet.</p>
        )}
      </div>
    </article>
  );
}

function LocationCard({
  contact,
  withMap,
}: {
  contact?: PublicContactCard;
  withMap?: boolean;
}) {
  if (!contact) {
    return <p className="text-xs text-muted-foreground">No Location is bound yet.</p>;
  }
  const title = contact.name || contact.orgName || "Location";
  const mapQuery = contact.address || title;
  const details = [contact.address, contact.phone, contact.email].filter(Boolean);
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm">
      {withMap && mapQuery ? (
        <div className="relative min-h-0 flex-1 bg-muted/40">
          <iframe
            title={`Map of ${title}`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
          />
        </div>
      ) : null}
      <div className="shrink-0 space-y-1.5 px-4 py-3">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {contact.orgName && contact.orgName !== title ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{contact.orgName}</p>
        ) : null}
        {details.length ? (
          <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
            {contact.address ? <p className="whitespace-pre-line text-foreground/90">{contact.address}</p> : null}
            {contact.phone || contact.email ? (
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                {contact.phone ? <span>{contact.phone}</span> : null}
                {contact.email ? <span>{contact.email}</span> : null}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No address, phone, or email on this location.</p>
        )}
      </div>
    </article>
  );
}

function Glass({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="board-glass">
      <h3 className="mb-3 text-lg font-semibold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function ProjectCards({ project }: { project: ProjectPaint }) {
  const [open, setOpen] = useState<string | null>(null);
  const selected = project.rows.find((row) => row.name === open);
  return (
    <Glass title="Projects">
      <div className="grid gap-3 sm:grid-cols-2">
        {project.rows.map((row) => (
          <button
            key={row.name}
            type="button"
            className="rounded-xl border border-current/15 bg-current/5 p-3 text-left"
            onClick={() => setOpen((cur) => (cur === row.name ? null : row.name))}
          >
            <p className="font-medium">{row.name}</p>
            <p className="text-sm capitalize text-muted-foreground">
              {[row.status, row.priority].filter(Boolean).join(" · ")} · {row.taskCount} tasks
            </p>
          </button>
        ))}
      </div>
      {selected ? (
        <table className="mt-4">
          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {selected.tasks.map((task) => (
              <tr key={task.name}>
                <td>{task.name}</td>
                <td className="capitalize">{task.status.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Glass>
  );
}

export function CanvasSlotDriver({
  driver,
  cycleSteps,
  stat,
  html,
  pageCard,
  contact,
  integration,
  schedule,
  inspection,
  project,
  renderOutput,
  compact = false,
  pager = true,
  pageNumber = 1,
}: {
  driver?: string;
  cycleSteps?: CycleStep[];
  stat?: CanvasSlotStat | null;
  html?: string;
  pageCard?: PageRecordCard | null;
  contact?: PublicContactCard;
  integration?: IntegrationPaint;
  schedule?: SchedulePaint;
  inspection?: InspectionPaint;
  project?: ProjectPaint;
  renderOutput?: string;
  compact?: boolean;
  pager?: boolean;
  pageNumber?: number;
}) {
  const kind = paintKind(driver, renderOutput);
  if (kind === "cycle-strip") return <CycleStrip steps={cycleSteps ?? []} />;
  if (kind === "glossary-book") return <PublicGlossaryBook />;
  if (kind === "org-board") return <PublicOrgBoard />;
  if (kind === "stat-graph") {
    if (!stat) {
      return (
        <p className="text-sm text-muted-foreground">
          Statistic unavailable. Check the binding record id in the Inspector.
        </p>
      );
    }
    return (
      <StatisticsGrid
        stat={stat}
        renderOutput={renderOutput}
        compact={compact}
        pager={pager}
        pageNumber={pageNumber}
      />
    );
  }
  if (kind === "html-block") {
    if (html) {
      return (
        <div className="h-full min-h-0 min-w-0 max-w-full">
          <HtmlBlock
            html={html}
            className="page-html h-full min-h-full w-full max-w-full whitespace-normal break-words text-sm leading-relaxed text-foreground"
          />
        </div>
      );
    }
    return (
      <p className="text-xs text-muted-foreground">Page — bind a Pages record.</p>
    );
  }
  if (kind === "record-card") {
    return <PageRecordCardView card={pageCard} />;
  }
  if (kind === "integration-table") {
    if (!integration?.rows.length) return <p className="text-xs text-muted-foreground">Integration — bind a record.</p>;
    return (
      <Glass title="Integrations">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Integration</th>
              <th>Kind</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {integration.rows.map((row) => (
              <tr key={row.name}>
                <td>
                  <span className="inline-flex items-center gap-2">
                    {row.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- vendor seed logos
                      <img src={row.logoUrl} alt="" className="h-6 w-6 object-contain" />
                    ) : null}
                    {row.vendorName}
                  </span>
                </td>
                <td>{row.name}</td>
                <td className="capitalize">{row.kind}</td>
                <td className="capitalize">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>
    );
  }
  if (kind === "schedule-board") {
    if (!schedule) return <p className="text-xs text-muted-foreground">Schedule — bind a record.</p>;
    return (
      <Glass title="Schedules">
        <ul className="mb-3 space-y-1 text-sm">
          {schedule.rows.map((row) => (
            <li key={row.name}>
              <span className="font-medium">{row.name}</span>
              <span className="text-muted-foreground"> — {row.detail}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-4 md:grid-cols-2">
          {schedule.months.map((month) => {
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            return (
            <div key={month.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{month.label}</p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: month.days }, (_, index) => {
                  const day = index + 1;
                  const key = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const names = schedule.marks.filter((mark) => mark.date === key).map((mark) => mark.name);
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={key}
                      title={[isToday ? "Today" : "", ...names].filter(Boolean).join(", ")}
                      className={isToday ? "schedule-today" : names.length ? "schedule-block" : "py-1 text-muted-foreground"}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </Glass>
    );
  }
  if (kind === "inspection-tickets") {
    if (!inspection?.rows.length) return <p className="text-xs text-muted-foreground">Inspections — bind a record.</p>;
    return (
      <Glass title="Support Requests">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {inspection.rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td className="capitalize">{row.status.replaceAll("_", " ")}</td>
                <td>{row.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>
    );
  }
  if (kind === "project-cards") {
    if (!project?.rows.length) return <p className="text-xs text-muted-foreground">Project — bind a record.</p>;
    return <ProjectCards project={project} />;
  }
  if (kind === "project-table") {
    if (!project?.rows.length) return <p className="text-xs text-muted-foreground">Project — bind a record.</p>;
    return (
      <Glass title="Projects">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Start</th>
              <th>Target</th>
              <th>Tasks</th>
            </tr>
          </thead>
          <tbody>
            {project.rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td className="capitalize">{row.status.replaceAll("_", " ")}</td>
                <td className="capitalize">{row.priority}</td>
                <td>{row.start}</td>
                <td>{row.target}</td>
                <td>{row.taskCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>
    );
  }
  if (kind === "location-card" || kind === "contacts-cards") {
    return <LocationCard contact={contact} withMap={renderOutput === "location-map"} />;
  }
  return null;
}
