"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FrequencyType } from "@/lib/statistics/model";
import { FREQUENCY_TYPES } from "@/lib/statistics/model";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isFrequencyType(v: string): v is FrequencyType {
  return (FREQUENCY_TYPES as readonly string[]).includes(v);
}

function monthShort(full: string): string {
  return full.slice(0, 3);
}

function formatDateParts(day: number, monthIdx: number, year: number): string {
  return `${day} ${MONTHS[monthIdx]} ${year}`;
}

function parseStoredDate(raw: string): { day: number; monthIdx: number; year: number } | null {
  const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const monthIdx = MONTHS.findIndex((n) => n.toLowerCase().startsWith(m[2].toLowerCase()));
  if (monthIdx < 0) return null;
  return { day: Number(m[1]), monthIdx, year: Number(m[3]) };
}

function toDateInput(raw: string): string {
  const p = parseStoredDate(raw);
  if (!p) return "";
  const mm = String(p.monthIdx + 1).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
}

function fromDateInput(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return formatDateParts(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function toDatetimeInput(raw: string): string {
  const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+@\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
  if (!m) return "";
  const monthIdx = MONTHS.findIndex((n) => n.toLowerCase().startsWith(m[2].toLowerCase()));
  if (monthIdx < 0) return "";
  const mm = String(monthIdx + 1).padStart(2, "0");
  const dd = String(Number(m[1])).padStart(2, "0");
  const hh = String(Number(m[4])).padStart(2, "0");
  const mi = String(Number(m[5])).padStart(2, "0");
  return `${m[3]}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeInput(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return "";
  const monthIdx = Number(m[2]) - 1;
  return `${Number(m[3])} ${MONTHS[monthIdx]} ${m[1]} @ ${m[4]}:${m[5]}:00`;
}

function parseWeek(raw: string): { day: string; month: string } {
  const m = /^W\/E\s+(\d{1,2})\s+([A-Za-z]+)$/i.exec(raw.trim());
  if (!m) return { day: "", month: "" };
  const monthIdx = MONTHS.findIndex((n) => n.toLowerCase().startsWith(m[2].toLowerCase()));
  return { day: m[1], month: monthIdx >= 0 ? MONTHS[monthIdx] : "" };
}

function parseMonthYear(raw: string): { month: string; year: string } {
  const m = /^([A-Za-z]+)\s+(\d{4})$/.exec(raw.trim());
  if (!m) return { month: "", year: "" };
  const monthIdx = MONTHS.findIndex((n) => n.toLowerCase().startsWith(m[1].toLowerCase()));
  return { month: monthIdx >= 0 ? MONTHS[monthIdx] : "", year: m[2] };
}

export function FrequencyStartField({
  label,
  frequencyType,
  value,
  onChange,
  required,
  readOnly,
  help,
}: {
  label: string;
  frequencyType: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  help?: string;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const type = isFrequencyType(frequencyType) ? frequencyType : "day";
  const mark = (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      {label}
      {required ? " *" : ""}
      {help ? (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="inline-flex rounded-sm text-muted-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={help}
          >
            <Info className="h-3 w-3" />
          </TooltipTrigger>
          <TooltipContent>{help}</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );

  if (readOnly) {
    return (
      <div className="flex flex-col gap-1.5">
        {mark}
        <input
          className={cn(base, "bg-muted text-muted-foreground")}
          value={value}
          disabled
          readOnly
        />
      </div>
    );
  }

  const input = (typeAttr: string, extra?: { min?: number; max?: number }) => (
    <input
      className={base}
      type={typeAttr}
      min={extra?.min}
      max={extra?.max}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );

  let control: ReactNode;
  switch (type) {
    case "sec":
    case "min":
      control = input("number", { min: 0, max: 59 });
      break;
    case "hour":
      control = input("number", { min: 0, max: 23 });
      break;
    case "day":
      control = (
        <select className={base} value={value} onChange={(e) => onChange?.(e.target.value)}>
          <option value="">Select weekday…</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      );
      break;
    case "week": {
      const w = parseWeek(value);
      control = (
        <div className="grid grid-cols-2 gap-2">
          <input
            className={base}
            type="number"
            min={1}
            max={31}
            placeholder="Day"
            value={w.day}
            onChange={(e) => onChange?.(`W/E ${e.target.value} ${monthShort(w.month || "June")}`)}
          />
          <select
            className={base}
            value={w.month}
            onChange={(e) => onChange?.(`W/E ${w.day || "8"} ${monthShort(e.target.value)}`)}
          >
            <option value="">Month…</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      );
      break;
    }
    case "month": {
      const my = parseMonthYear(value);
      control = (
        <div className="grid grid-cols-2 gap-2">
          <select
            className={base}
            value={my.month}
            onChange={(e) => onChange?.(`${e.target.value} ${my.year || String(new Date().getFullYear())}`)}
          >
            <option value="">Month…</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className={base}
            type="number"
            min={1000}
            max={9999}
            placeholder="Year"
            value={my.year}
            onChange={(e) => onChange?.(`${my.month || "June"} ${e.target.value}`)}
          />
        </div>
      );
      break;
    }
    case "year":
      control = input("number", { min: 1000, max: 9999 });
      break;
    case "decade":
      control = (
        <select className={base} value={value} onChange={(e) => onChange?.(e.target.value)}>
          <option value="">Select decade…</option>
          {Array.from({ length: 21 }, (_, i) => 1920 + i * 10).map((y) => (
            <option key={y} value={String(y)}>
              {y}s
            </option>
          ))}
        </select>
      );
      break;
    case "date":
      control = (
        <input
          className={base}
          type="date"
          value={toDateInput(value)}
          onChange={(e) => onChange?.(fromDateInput(e.target.value))}
        />
      );
      break;
    case "datetime":
      control = (
        <input
          className={base}
          type="datetime-local"
          value={toDatetimeInput(value)}
          onChange={(e) => onChange?.(fromDatetimeInput(e.target.value))}
        />
      );
      break;
    default:
      control = input("text");
  }

  return (
    <label className={cn("flex flex-col gap-1.5")}>
      {mark}
      {control}
    </label>
  );
}
