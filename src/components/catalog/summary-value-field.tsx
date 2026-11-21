/** Summary field (1.0.14): read-only total of the lines, worked out on save. */
export function SummaryValueField({
  label,
  value,
  percent,
  help,
}: {
  label: string;
  value: string;
  percent?: boolean;
  help?: string;
}) {
  const shown = value.trim() === "" ? "—" : percent ? `${value}%` : value;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-[11px] leading-snug text-muted-foreground/80">
        {help ?? "Worked out from the lines when the record is saved"}
      </span>
      <p className="text-sm font-semibold tabular-nums">{shown}</p>
    </div>
  );
}
