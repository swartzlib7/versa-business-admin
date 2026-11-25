"use client";

import { useSyncExternalStore } from "react";
import { timeZoneNames } from "@/lib/statistics/time-zone";

/**
 * Time zone picker (1.0.21): every zone the browser knows, grouped by region.
 * A select, not a datalist: a datalist only offers names that match what is already typed,
 * so a field holding a zone showed an empty list.
 *
 * The list comes from the browser after hydration (the server's Intl list can differ);
 * until then only the current value is offered.
 */
const noop = () => () => {};
let cached: Array<[string, string[]]> | null = null;

function grouped(): Array<[string, string[]]> {
  if (cached) return cached;
  const groups = new Map<string, string[]>();
  for (const zone of timeZoneNames()) {
    const region = zone.includes("/") ? zone.slice(0, zone.indexOf("/")) : "";
    const list = groups.get(region) ?? [];
    list.push(zone);
    groups.set(region, list);
  }
  cached = [...groups.entries()];
  return cached;
}

export function TimeZoneSelect({
  value,
  onChange,
  className,
  ariaLabel,
  allowEmpty = false,
}: {
  value: string;
  onChange: (zone: string) => void;
  className?: string;
  ariaLabel?: string;
  /** A new statistic may leave it empty: the install zone is filled in on save. */
  allowEmpty?: boolean;
}) {
  const groups = useSyncExternalStore(noop, grouped, () => null);
  const known = groups?.some(([, zones]) => zones.includes(value)) ?? false;
  return (
    <select className={className} aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty ? <option value="">Install time zone</option> : null}
      {value && !known ? <option value={value}>{value}</option> : null}
      {(groups ?? []).map(([region, zones]) =>
        region ? (
          <optgroup key={region} label={region}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </optgroup>
        ) : (
          zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))
        ),
      )}
    </select>
  );
}
