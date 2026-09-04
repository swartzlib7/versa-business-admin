import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Kind / Dynamic Record pills — readable on Light, Dusk, Slate, Dark, and Architect. */
export function KindBadge({
  isSystem,
  className,
}: {
  isSystem: boolean;
  className?: string;
}) {
  if (isSystem) {
    return (
      <Badge
        className={cn(
          "border-0 bg-amber-500/30 text-[10px] font-medium text-amber-950 dark:text-amber-100 architect:text-amber-100 slate:text-amber-100 dusk:text-amber-950",
          className,
        )}
      >
        Standard / DB Core
      </Badge>
    );
  }
  return (
    <Badge
      className={cn(
        "border-0 bg-sky-500/30 text-[10px] font-medium text-sky-950 dark:text-sky-100 architect:text-sky-100 slate:text-sky-100 dusk:text-sky-950",
        className,
      )}
    >
      Custom
    </Badge>
  );
}

export function ListingBadge({
  label,
  accent,
  className,
}: {
  label: string;
  accent: string;
  className?: string;
}) {
  const isDynamic = label === "Dynamic Record";
  return (
    <Badge
      className={cn(
        "shrink-0 text-[11px] font-medium",
        isDynamic
          ? "border text-foreground"
          : "border-0 text-white",
        className,
      )}
      style={
        isDynamic
          ? {
              backgroundColor: `color-mix(in oklab, ${accent} 28%, transparent)`,
              borderColor: accent,
              color: "var(--foreground)",
            }
          : { backgroundColor: accent }
      }
    >
      {label}
    </Badge>
  );
}
