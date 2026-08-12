import type { AnalyticsDashboardData } from "@/types/database";

export function AnalyticsTables({ data }: { data: AnalyticsDashboardData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SmallTable title="Top Pages" columns={["Page", "Views"]} rows={data.topPages.map((row) => [row.page, row.views])} />
      <SmallTable title="Top Products" columns={["Product", "Views"]} rows={data.topProducts.map((row) => [row.product, row.views])} />
      <SmallTable title="Top Actions" columns={["Action", "Count"]} rows={data.topActions.map((row) => [row.action, row.count])} />
      <SmallTable title="Traffic Sources" columns={["Source", "Count"]} rows={data.trafficSources.map((row) => [row.source, row.count])} />
    </div>
  );
}

function SmallTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: [string, string];
  rows: Array<[string, number]>;
}) {
  return (
    <section className="rounded-lg border p-4 theme-card">
      <h2 className="font-black theme-text">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm theme-text-muted">No data yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left theme-text-muted">
              <tr>
                <th className="pb-2 font-semibold">{columns[0]}</th>
                <th className="pb-2 text-right font-semibold">{columns[1]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.slice(0, 8).map(([label, value]) => (
                <tr key={label}>
                  <td className="py-2 theme-text">{label}</td>
                  <td className="py-2 text-right font-bold theme-text">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
