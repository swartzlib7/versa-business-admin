"use client";

/**
 * 1.0.16 visitor paints: Gantt, Job and money, Asset card, Organization board
 * (state_demo_content.md §4.1). Data comes from `board-resolve.ts`.
 */
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { ProjectGanttPreviewView, type ProjectGanttPreview } from "@/components/zones/project-gantt-preview";
import type { AssetPaint, JobMoneyPaint, OrgBoardPaint } from "@/lib/public/board-paint";

const subscribeNever = () => () => {};

/** True after hydration: the Gantt reads today's date and the browser's locale. */
function useMounted(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

function Empty({ children }: { children: string }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function TableScroll({ children }: { children: React.ReactNode }) {
  return <div className="-mx-1 max-w-full overflow-x-auto px-1">{children}</div>;
}

export function GanttBoard({ gantt }: { gantt?: ProjectGanttPreview[] }) {
  const mounted = useMounted();
  if (!gantt?.length) return <Empty>Project — bind a record.</Empty>;
  return (
    <section className="board-glass space-y-4">
      {gantt.map((preview) => (
        <div key={preview.recordId ?? preview.name} className="min-h-[220px]">
          {mounted ? (
            <ProjectGanttPreviewView preview={preview} />
          ) : (
            <p className="p-3 text-sm font-semibold">{preview.name}</p>
          )}
        </div>
      ))}
    </section>
  );
}

export function OrgRecordsBoard({ board }: { board?: OrgBoardPaint }) {
  if (!board) return <Empty>Organization board — bind the Organization board driver.</Empty>;
  return (
    <section className="board-glass">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight">Organization board</h3>
        <span className="text-xs text-muted-foreground">
          {board.divisions.length} divisions · {board.hatCount} {board.hatCount === 1 ? "hat" : "hats"} · {board.recordCount} records
        </span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[56rem] grid-cols-7 gap-2">
          {board.divisions.map((division) => (
            <div key={division.key} className="flex min-w-0 flex-col rounded-lg border border-current/15 bg-current/5">
              <p className="border-b border-current/15 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {division.label}
              </p>
              <ul className="flex flex-col gap-1.5 p-2">
                {division.items.length ? (
                  division.items.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className={cn(
                        "rounded-md border bg-background/40 px-2 py-1.5 text-xs leading-snug",
                        item.hat ? "border-teal-500/60" : "border-current/15",
                      )}
                    >
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-[10.5px] text-muted-foreground">
                        {[item.kind, item.detail].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="rounded-md border border-dashed border-current/20 px-2 py-1.5 text-xs text-muted-foreground">
                    No records yet
                  </li>
                )}
                {division.more ? <li className="px-1 text-[10.5px] text-muted-foreground">+{division.more} more</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function JobMoneyBoard({ job }: { job?: JobMoneyPaint | null }) {
  if (!job) return <Empty>Transaction — bind an estimate or an invoice.</Empty>;
  return (
    <section className="board-glass space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {job.docs.map((doc) => (
          <div
            key={doc.id}
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-xl border p-3",
              doc.current ? "border-teal-500/60 bg-teal-500/10" : "border-current/15 bg-current/5",
            )}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <span>{doc.kind}</span>
              {doc.remaining !== undefined ? (
                <span className="rounded-full border border-amber-500/70 px-2 normal-case tracking-normal text-amber-600 dark:text-amber-400">
                  {doc.remaining} left
                </span>
              ) : doc.status ? (
                <span className="rounded-full border border-current/25 px-2 normal-case tracking-normal capitalize">{doc.status}</span>
              ) : null}
            </div>
            <p className="truncate text-sm font-semibold">{doc.name}</p>
            <p className="text-xl font-bold tabular-nums">{doc.amount}</p>
            {doc.allocatedPct !== undefined ? (
              <div className="h-2 overflow-hidden rounded-full border border-current/15 bg-current/5" aria-label={`${doc.allocatedPct}% matched`}>
                <div className="h-full bg-teal-500" style={{ width: `${doc.allocatedPct}%` }} />
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">{doc.note}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-current/15">
        <div className="flex flex-wrap justify-between gap-2 border-b border-current/15 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{job.title} · lines</span>
          {job.billNames.length ? <span>bill: {job.billNames.join(", ")}</span> : null}
        </div>
        <TableScroll>
          <table className="tabular-nums">
            <thead>
              <tr>
                <th>Item</th>
                <th className="!text-right">Qty</th>
                <th className="!text-right">Unit cost</th>
                <th className="!text-right">Markup</th>
                <th className="!text-right">Unit price</th>
                <th className="!text-right">Line total</th>
                <th className="!text-right">Actual cost</th>
                <th className="!text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {job.lines.map((line, index) => (
                <tr key={`${line.description}-${index}`}>
                  <td className="whitespace-nowrap">{line.description}</td>
                  <td className="!text-right">{line.quantity}</td>
                  <td className="!text-right">{line.unitCost}</td>
                  <td className="!text-right">{line.markup || "—"}</td>
                  <td className={cn("!text-right", line.priceTyped ? "font-bold" : "text-teal-600 dark:text-teal-400")}>{line.unitPrice}</td>
                  <td className="!text-right text-teal-600 dark:text-teal-400">{line.lineTotal}</td>
                  <td className="!text-right">{line.actualCost}</td>
                  <td className="!text-right text-teal-600 dark:text-teal-400">{line.variance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-[11px] text-muted-foreground">
          <span>
            <span className="text-teal-600 dark:text-teal-400">Teal</span> = worked out by VBA
          </span>
          <span>
            <b className="text-foreground">Bold</b> = typed over the worked-out price
          </span>
        </p>
        <div className="grid grid-cols-2 border-t border-current/15 sm:grid-cols-4">
          {[
            ["Subtotal", job.totals.subtotal],
            ["Cost", job.totals.cost],
            ["Margin", job.totals.margin],
            ["Margin %", job.totals.marginPct],
          ].map(([label, value], index) => (
            <div key={label} className={cn("px-3 py-2.5", index % 2 === 0 && "border-r border-current/15", index === 1 && "sm:border-r", index < 2 && "max-sm:border-b")}>
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
              <p className={cn("text-lg font-bold tabular-nums", index >= 2 && job.totals.good && "text-teal-600 dark:text-teal-400")}>{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseRing({ pct }: { pct: number | null }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <svg viewBox="0 0 88 88" className="h-20 w-20 shrink-0" aria-hidden>
      <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={10} />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="#14b8a6"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" fontSize="16" fontWeight={800} fill="currentColor">
        {pct === null ? "—" : `${Math.round(value)}%`}
      </text>
    </svg>
  );
}

export function AssetBoard({ assets }: { assets?: AssetPaint[] }) {
  if (!assets?.length) return <Empty>Asset — bind a record.</Empty>;
  return (
    <div className="space-y-4">
      {assets.map((asset) => (
        <section key={asset.name} className="board-glass grid gap-0 !p-0 md:grid-cols-2">
          <div className="min-w-0">
            <div className="flex flex-wrap justify-between gap-2 border-b border-current/15 px-4 py-2.5">
              <h3 className="font-semibold">{asset.name}</h3>
              <span className="text-xs capitalize text-muted-foreground">{asset.category}</span>
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 px-4 py-3 text-sm">
              {asset.fields.map((field) => (
                <div key={field.label} className="contents">
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className={cn("tabular-nums", field.tone === "due" && "text-amber-600 dark:text-amber-400")}>{field.value}</dd>
                </div>
              ))}
            </dl>
            {asset.documents.length ? (
              <ul className="flex flex-wrap gap-1.5 px-4 pb-4" aria-label="Documents">
                {asset.documents.map((doc) => (
                  <li key={doc.name} className="inline-flex items-center gap-1.5 rounded-md border border-current/15 bg-current/5 px-2 py-1 text-xs">
                    <span className={cn("rounded px-1 text-[9.5px] font-bold text-white", doc.ext === "PDF" ? "bg-rose-600" : "bg-sky-600")}>{doc.ext}</span>
                    {doc.name}
                    <span className="text-muted-foreground">{doc.size}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="min-w-0 border-t border-current/15 md:border-l md:border-t-0">
            {asset.mileage ? (
              <>
                <div className="flex flex-wrap justify-between gap-2 border-b border-current/15 px-4 py-2.5">
                  <h3 className="font-semibold">{asset.mileage.name}</h3>
                  <span className="text-xs text-muted-foreground">{asset.mileage.trips.length} latest trips</span>
                </div>
                <div className="flex items-center gap-4 px-4 py-3">
                  <UseRing pct={asset.mileage.pct} />
                  <ul className="space-y-0.5 text-sm tabular-nums">
                    <li><b>{asset.mileage.total}</b> <span className="text-muted-foreground">total miles</span></li>
                    <li><b>{asset.mileage.business}</b> <span className="text-muted-foreground">business miles</span></li>
                    <li><b>{asset.mileage.personal}</b> <span className="text-muted-foreground">personal miles</span></li>
                  </ul>
                </div>
                <TableScroll>
                  <table className="tabular-nums">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Trip</th>
                        <th className="!text-right">Miles</th>
                        <th className="!text-right">Business</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.mileage.trips.map((trip, index) => (
                        <tr key={`${trip.date}-${index}`}>
                          <td className="whitespace-nowrap">{trip.date}</td>
                          <td>{trip.purpose}</td>
                          <td className="!text-right">{trip.miles}</td>
                          <td className="!text-right">{trip.business ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </>
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">No mileage log for this asset yet.</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
