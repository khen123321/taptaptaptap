import Link from "next/link";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLinkButton, AdminMetricCard, AdminPageHeader, adminFieldClass } from "@/components/admin/AdminUI";
import { SalesManager } from "@/components/admin/SalesManager";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPhp } from "@/lib/format";
import { getInventoryProducts } from "@/lib/inventory";
import { getSalesList, getSalesMetrics } from "@/lib/sales";

export default async function AdminSalesPage({
  searchParams,
}: PageProps<"/admin/sales">) {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }

  const params = await searchParams;
  const query = single(params.q);
  const date = single(params.date) === "today" ? "today" : "all";
  const sortParam = single(params.sort);
  const sort =
    sortParam === "oldest" ||
    sortParam === "amount_desc" ||
    sortParam === "amount_asc"
      ? sortParam
      : "newest";
  const [salesResult, products, metricsResult] = await Promise.all([
    getSalesList({ query, date, sort }).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const, value: [] }),
    ),
    getInventoryProducts(),
    getSalesMetrics().then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const, value: null }),
    ),
  ]);
  const summary = metricsResult.ok ? metricsResult.value.today : null;
  const overall = metricsResult.ok ? metricsResult.value.overall : null;

  return (
    <AdminShell session={access.session}>
      <AdminPageHeader
        eyebrow="Physical Sales"
        title="Sales"
        description="Review and manage physical transactions."
        action={<AdminLinkButton href="/admin/inventory" variant="primary">+ Record Quick Sale</AdminLinkButton>}
      />

      <section className="mt-8 rounded-2xl border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black theme-text">Sales History</h2>
          <Link href="/admin/inventory" className="text-sm font-bold theme-accent">
            Record Quick Sale
          </Link>
        </div>

        <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <label className="grid gap-2 text-sm font-bold theme-text">
            Search
            <input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Sale, product, reference, admin"
              className={fieldClass}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold theme-text">
            Date
            <select name="date" defaultValue={date} className={fieldClass}>
              <option value="today">Today</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold theme-text">
            Sort
            <select name="sort" defaultValue={sort} className={fieldClass}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount High-Low</option>
              <option value="amount_asc">Amount Low-High</option>
            </select>
          </label>
          <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] lg:self-end">
            Filter
          </button>
        </form>
      </section>

      {summary ? (
        <section className="mt-6">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] theme-text-muted">Today</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Sold Today", value: summary.soldToday.toLocaleString("en-PH") },
            { label: "Sales Today", value: formatPhp(summary.salesToday) },
            { label: "Orders Today", value: summary.ordersToday.toLocaleString("en-PH") },
            { label: "Direct Deductions Today", value: formatPhp(summary.directDeductionsToday) },
            { label: "Net After Deductions Today", value: formatPhp(summary.netAfterDirectDeductionsToday) },
          ].map((item) => (
            <AdminMetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              tone={item.label.includes("Sales") || item.label.includes("Net") ? "green" : "neutral"}
            />
          ))}
          </div>
        </section>
      ) : null}

      {overall ? (
        <section className="mt-6">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] theme-text-muted">All-Time Totals</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Total Sold",
                value: overall.totalSold.toLocaleString("en-PH"),
                description: "All completed units sold",
              },
              {
                label: "Total Orders",
                value: overall.totalOrders.toLocaleString("en-PH"),
                description: "All completed orders",
              },
              {
                label: "Total Sales",
                value: formatPhp(overall.totalSales),
                description: "All completed sales",
              },
              {
                label: "Total Deductions",
                value: formatPhp(overall.totalDeductions),
                description: "All completed-sale deductions",
              },
              {
                label: "Total Net After Deductions",
                value: formatPhp(overall.totalNetAfterDeductions),
                description: "Sales minus direct deductions",
              },
            ].map((item) => (
              <AdminMetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                description={item.description}
                tone={item.label.includes("Sales") || item.label.includes("Net") ? "green" : "neutral"}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        {salesResult.ok ? (
          <SalesManager sales={salesResult.value} products={products} />
        ) : (
          <section className="rounded-lg border border-yellow-400/40 bg-yellow-500/10 p-5">
            <h2 className="text-lg font-black text-yellow-200">Sales data could not be loaded.</h2>
            <p className="mt-2 text-sm leading-6 text-yellow-100/90">
              The sales page is available, but the sales query failed. Check the server logs for the exact Supabase error.
            </p>
          </section>
        )}
      </div>
    </AdminShell>
  );
}

const fieldClass = adminFieldClass;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
