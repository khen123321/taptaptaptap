import Link from "next/link";
import type { AnalyticsPeriod } from "@/types/database";

const periods: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

export function PeriodTabs({
  current,
  basePath,
}: {
  current: AnalyticsPeriod;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Link
          key={period.value}
          href={`${basePath}?period=${period.value}`}
          className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
            current === period.value
              ? "border-[var(--accent)] bg-[var(--accent-soft)] theme-accent"
              : "theme-border theme-text-secondary hover:border-[var(--accent)]"
          }`}
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}

export function parsePeriod(value: unknown): AnalyticsPeriod {
  return value === "today" || value === "30d" || value === "all" ? value : "7d";
}
