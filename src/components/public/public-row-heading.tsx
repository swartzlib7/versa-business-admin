import type { RowHeading } from "@/lib/public/page-builder";

/** 1.0.16: a row's optional heading above its cells (kicker, headline, lead line, note). */
export function PublicRowHeading({ heading }: { heading?: RowHeading }) {
  if (!heading) return null;
  return (
    <header className="mb-5 max-w-3xl space-y-2">
      {heading.kicker || heading.note ? (
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {heading.kicker ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
              {heading.kicker}
            </span>
          ) : null}
          {heading.note ? <span className="text-xs text-muted-foreground">{heading.note}</span> : null}
        </p>
      ) : null}
      {heading.title ? (
        <h2 className="text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{heading.title}</h2>
      ) : null}
      {heading.lede ? <p className="max-w-[64ch] text-sm leading-relaxed text-muted-foreground">{heading.lede}</p> : null}
    </header>
  );
}
