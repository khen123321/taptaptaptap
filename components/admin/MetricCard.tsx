export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border p-4 theme-card">
      <p className="text-xs font-black uppercase tracking-[0.16em] theme-text-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black theme-text">{value}</p>
    </div>
  );
}
