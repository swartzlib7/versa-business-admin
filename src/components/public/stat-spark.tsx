"use client";

export function StatSpark({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const series = values.length ? values : [0];
  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const w = 160;
  const h = 42;
  const pts = series
    .map((v, i) => {
      const x = (i / Math.max(series.length - 1, 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className ?? "mt-3 h-10 w-full text-primary"}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}
