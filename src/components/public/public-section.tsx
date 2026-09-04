import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicSection({
  id,
  nextId,
  className,
  children,
}: {
  id?: string;
  nextId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-public-section=""
      className={cn(
        "relative flex min-h-[max(100dvh,768px)] flex-col justify-center overflow-hidden border-b border-border pb-16",
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
