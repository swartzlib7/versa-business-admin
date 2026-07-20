"use client";

import { theme } from "@/lib/theme";

export type ZoneHubId = "organization" | "collaboration" | "environment";

const ZONES: {
  id: ZoneHubId;
  label: string;
  color: string;
  /** outer radius of ring (viewBox 0..100) */
  r: number;
}[] = [
  {
    id: "organization",
    label: "Organization",
    color: theme.scene.executiveColor,
    r: 22,
  },
  {
    id: "collaboration",
    label: "Collaboration",
    color: theme.scene.collaborationColor,
    r: 34,
  },
  {
    id: "environment",
    label: "Environment",
    color: theme.scene.environmentalColor,
    r: 46,
  },
];

/**
 * I5.6.13 — compact ring glyph for zone pages.
 * Concentric rings (org / collab / env); active zone filled + stronger stroke.
 * Sits above the "3D hub" control in the zone header.
 */
export function ZoneHubPreview({
  active,
  className = "",
}: {
  active: ZoneHubId;
  className?: string;
}) {
  const activeMeta = ZONES.find((z) => z.id === active)!;

  return (
    <div
      className={`flex flex-col items-center gap-1 ${className}`}
      title={`${activeMeta.label} zone — spatial twin on the 3D hub`}
    >
      <svg
        viewBox="0 0 100 100"
        width={72}
        height={72}
        className="shrink-0"
        role="img"
        aria-label={`${activeMeta.label} zone rings preview`}
      >
        {/* faint fill for active band between previous and this ring */}
        {ZONES.map((z, i) => {
          const inner = i === 0 ? 0 : ZONES[i - 1].r;
          const isActive = z.id === active;
          if (!isActive) return null;
          // donut path via two circles (evenodd)
          return (
            <path
              key={`fill-${z.id}`}
              fill={z.color}
              fillOpacity={0.22}
              fillRule="evenodd"
              d={
                i === 0
                  ? `M 50 ${50 - z.r} a ${z.r} ${z.r} 0 1 0 0.01 0 Z`
                  : [
                      `M 50 ${50 - z.r} a ${z.r} ${z.r} 0 1 0 0.01 0 Z`,
                      `M 50 ${50 - inner} a ${inner} ${inner} 0 1 1 0.01 0 Z`,
                    ].join(" ")
              }
            />
          );
        })}

        {/* hub nucleus */}
        <circle
          cx={50}
          cy={50}
          r={6}
          fill={theme.scene.hubColor ?? theme.colors.brand}
          opacity={0.9}
        />

        {ZONES.map((z) => {
          const isActive = z.id === active;
          return (
            <circle
              key={z.id}
              cx={50}
              cy={50}
              r={z.r}
              fill="none"
              stroke={z.color}
              strokeWidth={isActive ? 3.2 : 1.4}
              strokeOpacity={isActive ? 1 : 0.35}
              strokeDasharray={isActive ? undefined : "2 3"}
            />
          );
        })}
      </svg>
      <span
        className="text-[10px] font-medium uppercase tracking-wide"
        style={{ color: activeMeta.color }}
      >
        {activeMeta.label}
      </span>
    </div>
  );
}
