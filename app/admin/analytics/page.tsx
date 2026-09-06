import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminUI";
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
      <AdminPageHeader
        eyebrow="Website Analytics"
        title="Analytics"
        description={data.rangeLabel}
        action={
        <div className="flex flex-wrap gap-2">
          <PeriodTabs current={period} basePath="/admin/analytics" />
          <a
            href={`/admin/analytics?period=${period}`}
            className="inline-flex min-h-11 items-center rounded-lg border theme-border px-3 text-sm font-semibold theme-text-secondary transition hover:border-[var(--accent)]"
          >
            Refresh
          </a>
        </div>
        }
      />

      {!data.hasEvents ? (
        <section className="mt-6 rounded-2xl border p-6 theme-card">
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

      <section className="mt-6 rounded-2xl border p-5 theme-card">
        <h2 className="text-xl font-black theme-text">Website Traffic</h2>
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
