import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AnalyticsTables } from "@/components/admin/AnalyticsTables";
import { MetricCard } from "@/components/admin/MetricCard";
import { parsePeriod, PeriodTabs } from "@/components/admin/PeriodTabs";
import { TrafficChart } from "@/components/admin/TrafficChart";
import { getAnalyticsDashboard } from "@/lib/analytics/admin";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminAnalyticsPage({
  searchParams,
}: PageProps<"/admin/analytics">) {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }
  const params = await searchParams;
  const period = parsePeriod(params?.period);
  const data = await getAnalyticsDashboard(period);

  return (
    <AdminShell session={access.session}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black theme-text">Analytics</h1>
          <p className="mt-2 text-sm theme-text-secondary">{data.rangeLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodTabs current={period} basePath="/admin/analytics" />
          <a
            href={`/admin/analytics?period=${period}`}
            className="rounded-md border theme-border px-3 py-2 text-sm font-semibold theme-text-secondary transition hover:border-[var(--accent)]"
          >
            Refresh
          </a>
        </div>
      </div>

      {!data.hasEvents ? (
        <section className="mt-6 rounded-lg border p-6 theme-card">
          <p className="text-lg font-black theme-text">No analytics data yet.</p>
          <p className="mt-2 text-sm theme-text-secondary">
            Traffic and interaction data will appear after visitors begin using the website.
          </p>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total Views" value={data.summary.totalViews} change={data.comparisons.totalViews} />
        <MetricCard label="Unique Visitors" value={data.summary.uniqueVisitors} change={data.comparisons.uniqueVisitors} />
        <MetricCard label="Product Views" value={data.summary.productViews} change={data.comparisons.productViews} />
        <MetricCard label="Detail Opens" value={data.summary.detailOpens} change={data.comparisons.detailOpens} />
        <MetricCard label="Customizer Opens" value={data.summary.customizerOpens} change={data.comparisons.customizerOpens} />
        <MetricCard label="CTA Clicks" value={data.summary.ctaClicks} change={data.comparisons.ctaClicks} />
      </div>

      <section className="mt-6 rounded-lg border p-5 theme-card">
        <h2 className="text-lg font-black theme-text">Website Traffic</h2>
        <div className="mt-4">
          <TrafficChart data={data.traffic} />
        </div>
      </section>

      <div className="mt-6">
        <AnalyticsTables data={data} />
      </div>
    </AdminShell>
  );
}
