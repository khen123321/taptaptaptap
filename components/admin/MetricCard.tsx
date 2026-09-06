export function MetricCard({
  label,
  value,
  change,
}: {
  label: string;
  value: number | string;
  change?: string | null;
}) {
  return (
    <div className="rounded-2xl border p-5 theme-card">
      <p className="text-sm font-bold theme-text-secondary">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black theme-text">{value}</p>
      {change ? <p className="mt-2 text-xs font-bold theme-accent">{change}</p> : null}
    </div>
  );
}
