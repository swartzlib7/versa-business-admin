import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicSection({
  id,
  nextId,
  className,
  hidden,
  fillViewport = true,
  style,
  children,
}: {
  id?: string;
  nextId?: string;
  className?: string;
  hidden?: boolean;
  /** One viewport, so the next control sits at the bottom of the screen. */
  fillViewport?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (hidden) return null;
  return (
    <section
      id={id}
      data-public-section=""
      style={style}
      className={cn(
        "relative flex flex-col overflow-hidden border-border",
        nextId ? "border-b" : "border-b-0",
        fillViewport ? "h-dvh max-h-dvh min-h-dvh justify-center pb-16" : "min-h-0",
        className,
      )}
    >
      {children}
      {nextId ? (
        <a
          href={`#${nextId}`}
          aria-label="Next section"
          className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-background/75 p-2 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
        >
          <ChevronDown className="h-5 w-5" />
        </a>
      ) : null}
    </section>
  );
}
