"use client";

import { cn } from "@/lib/utils";
import {
  BOARD_CHART_ORDER,
  BOARD_DIVISIONS,
  BOARD_EXECUTIVES,
  ORGANIZING_BOARD_INTRO,
  type BoardDepartment,
  type BoardDivision,
} from "@/lib/fixtures/org-board";

function chartDivision(id: string): BoardDivision {
  const found = BOARD_DIVISIONS.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown board division: ${id}`);
  return found;
}

function divisionMeta(d: BoardDivision) {
  const match = d.division.match(/^Division\s+(\d+):\s*(.+)$/i);
  return {
    number: match?.[1] ?? "",
    name: (match?.[2] ?? `${d.label} Division`).toUpperCase(),
  };
}

function ExecBox({
  children,
  accent,
  featured = false,
}: {
  children: string;
  accent: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "border bg-card px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em]",
        featured ? "border-2" : "border-foreground/50",
      )}
      style={featured ? { borderColor: accent } : undefined}
    >
      {children}
    </div>
  );
}

function Stem({ className }: { className?: string }) {
  return <div className={cn("h-5 w-px bg-foreground/40", className)} aria-hidden />;
}

function BranchT({ columns }: { columns: number }) {
  const centers = Array.from({ length: columns }, (_, i) => ((i + 0.5) / columns) * 100);
  return (
    <div className="relative h-5 w-full" aria-hidden>
      <div
        className="absolute top-0 h-px bg-foreground/40"
        style={{ left: `${centers[0]}%`, right: `${100 - centers[centers.length - 1]}%` }}
      />
      {centers.map((left) => (
        <div
          key={left}
          className="absolute top-0 h-5 w-px bg-foreground/40"
          style={{ left: `${left}%` }}
        />
      ))}
    </div>
  );
}

function DeptCell({ dept }: { dept: BoardDepartment }) {
  return (
    <div className="flex min-h-52 flex-1 flex-col border border-foreground/25 bg-muted/55">
      <div className="border-b border-foreground/25 py-1 text-center text-[12px] font-semibold tabular-nums text-foreground/85">
        {dept.number}
      </div>
      <div className="flex flex-1 items-center justify-center px-0.5 py-3">
        <span
          className="text-[13px] font-semibold leading-tight text-foreground"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {dept.name}
        </span>
      </div>
    </div>
  );
}

function DivisionHeader({ division, accent }: { division: BoardDivision; accent: string }) {
  const meta = divisionMeta(division);
  return (
    <div
      className="h-full border border-b-0 border-foreground/50 bg-card px-2 py-2 text-center"
      style={{ boxShadow: `inset 0 2px 0 ${accent}` }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground/75">
        Division {meta.number}
      </p>
      <p className="mt-0.5 text-[13px] font-bold uppercase leading-tight tracking-wide text-foreground">
        {meta.name}
      </p>
    </div>
  );
}

function DivisionDepartments({ division }: { division: BoardDivision }) {
  return (
    <div className="flex h-full min-h-52">
      {division.departments.map((dept) => (
        <DeptCell key={dept.number} dept={dept} />
      ))}
    </div>
  );
}

function DivisionFunction({ division }: { division: BoardDivision }) {
  return (
    <div className="flex h-full border border-t-0 border-foreground/25 bg-muted/40 px-2 py-3">
      <p className="text-[13px] leading-relaxed text-foreground">{division.function}</p>
    </div>
  );
}

export function OrgBoardView({ accent }: { accent: string }) {
  const ordered = BOARD_CHART_ORDER.map(chartDivision);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="overflow-x-auto">
        <div className="min-w-[1180px] px-6 py-8">
          <header className="mb-8 flex items-start justify-between gap-10 border-b border-border pb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Sample
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">The Organizing Board</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Sample seven-division pattern.
              </p>
              <a
                href="https://wise.org/pattern-of-the-organization-2/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-medium underline underline-offset-4 hover:text-foreground"
                style={{ color: accent }}
              >
                WISE — Pattern of the Organization
              </a>
            </div>
            <p className="max-w-4xl flex-1 text-sm leading-relaxed text-muted-foreground">
              {ORGANIZING_BOARD_INTRO}
            </p>
          </header>

          <div className="flex flex-col items-center">
            <ExecBox accent={accent} featured>
              Chief Executive Officer
            </ExecBox>
            <Stem />
            <ExecBox accent={accent}>Communications Executive</ExecBox>
            <Stem />

            <div className="grid w-full grid-cols-7">
              {BOARD_EXECUTIVES.map((exec, index) => (
                <div
                  key={exec.title}
                  className={cn(
                    "relative flex flex-col items-center",
                    exec.divisionIds.length === 4 ? "col-span-4" : "col-span-3",
                  )}
                >
                  <div
                    className="absolute top-0 h-px bg-foreground/40"
                    style={
                      index === 0
                        ? { left: "50%", right: 0 }
                        : { left: 0, right: "50%" }
                    }
                    aria-hidden
                  />
                  <Stem />
                  <ExecBox accent={accent}>{exec.title}</ExecBox>
                  <Stem />
                  <BranchT columns={exec.divisionIds.length} />
                </div>
              ))}
            </div>

            <div className="grid w-full grid-cols-7 items-stretch">
              {ordered.map((division, index) => (
                <div key={`${division.id}-head`} className={index > 0 ? "-ml-px" : undefined}>
                  <DivisionHeader division={division} accent={accent} />
                </div>
              ))}
              {ordered.map((division, index) => (
                <div key={`${division.id}-depts`} className={index > 0 ? "-ml-px" : undefined}>
                  <DivisionDepartments division={division} />
                </div>
              ))}
              {ordered.map((division, index) => (
                <div key={`${division.id}-fn`} className={index > 0 ? "-ml-px" : undefined}>
                  <DivisionFunction division={division} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
