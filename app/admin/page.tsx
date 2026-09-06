import Link from "next/link";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMetricCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { getAnalyticsDashboard } from "@/lib/analytics/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { formatInventoryValue, getInventoryDashboardData } from "@/lib/inventory";
import { getAdminProductDashboard } from "@/lib/products";

export default async function AdminDashboardPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }
  const [dataResult, analyticsResult, inventoryResult] = await Promise.allSettled([
    getAdminProductDashboard(),
    getAnalyticsDashboard("7d"),
    getInventoryDashboardData(),
  ]);
  const data =
    dataResult.status === "fulfilled"
      ? dataResult.value
      : { total: "Unavailable", published: "Unavailable", draft: "Unavailable", archived: "Unavailable", recent: [] };
  const analytics = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
  const inventory = inventoryResult.status === "fulfilled" ? inventoryResult.value : null;
  const cards = [
    { label: "Total Products", value: data.total },
    { label: "Published", value: data.published },
    { label: "Drafts", value: data.draft },
    { label: "Archived", value: data.archived },
  ];

  return (
    <AdminShell session={access.session}>
      <AdminPageHeader
        eyebrow="TapTapTap Admin"
        title="Dashboard"
        description="Review the current storefront, sales, inventory, and website activity."
      />

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] theme-text-muted">Products</h2>
          <Link href="/admin/products" className="text-sm font-bold theme-accent">Manage Products</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <AdminMetricCard key={card.label} icon="package" label={card.label} value={card.value} />
        ))}
        </div>
      </section>

      <section className="mt-7 rounded-2xl border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] theme-text-muted">Website</p>
            <h2 className="mt-1 text-xl font-black theme-text">Analytics Preview</h2>
          </div>
          <Link href="/admin/analytics" className="text-sm font-bold theme-accent">
            View Analytics
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {analytics ? (
            [
              { label: "Views", value: analytics.summary.totalViews, icon: "views" as const },
              { label: "Unique Visitors", value: analytics.summary.uniqueVisitors, icon: "analytics" as const },
              { label: "Product Views", value: analytics.summary.productViews, icon: "package" as const },
              { label: "Customizer Opens", value: analytics.summary.customizerOpens, icon: "clicks" as const },
            ].map((item) => (
              <AdminMetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} description="Last 7 days" tone="neutral" />
            ))
          ) : (
            <UnavailablePanel label="Website analytics unavailable" />
          )}
        </div>
      </section>

      <section className="mt-7 rounded-2xl border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] theme-text-muted">Inventory</p>
            <h2 className="mt-1 text-xl font-black theme-text">Inventory Summary</h2>
          </div>
          <Link href="/admin/inventory" className="text-sm font-bold theme-accent">
            Manage Inventory
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {inventory ? (
            [
              { label: "Total Units", value: inventory.summary.totalUnits.toLocaleString("en-PH"), icon: "inventory" as const, tone: "accent" as const },
              { label: "Inventory Value", value: formatInventoryValue(inventory.summary.inventoryValue), icon: "net" as const, tone: "neutral" as const },
              { label: "Low Stock", value: String(inventory.summary.lowStockProducts), icon: "low-stock" as const, tone: "amber" as const },
              { label: "Out of Stock", value: String(inventory.summary.outOfStockProducts), icon: "out-of-stock" as const, tone: "red" as const },
              { label: "Sales Today", value: inventory.summary.sales ? formatInventoryValue(inventory.summary.sales.salesToday) : "Unavailable", icon: "sales" as const, tone: "green" as const },
              { label: "Orders Today", value: inventory.summary.sales ? inventory.summary.sales.ordersToday.toLocaleString("en-PH") : "Unavailable", icon: "orders" as const, tone: "neutral" as const },
              { label: "Sold Today", value: inventory.summary.sales ? inventory.summary.sales.soldToday.toLocaleString("en-PH") : "Unavailable", icon: "package" as const, tone: "neutral" as const },
              { label: "Direct Deductions", value: inventory.summary.sales ? formatInventoryValue(inventory.summary.sales.directDeductionsToday) : "Unavailable", icon: "net" as const, tone: "amber" as const },
              { label: "Net After Deductions", value: inventory.summary.sales ? formatInventoryValue(inventory.summary.sales.netAfterDirectDeductionsToday) : "Unavailable", icon: "net" as const, tone: "green" as const },
            ].map((item) => (
              <AdminMetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} tone={item.tone} />
            ))
          ) : (
            <UnavailablePanel label="Inventory data unavailable" />
          )}
        </div>
        {inventory?.salesError ? (
          <p className="mt-4 rounded-md border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-200">
            Sales data unavailable.
          </p>
        ) : null}
      </section>

      <section className="mt-7 rounded-2xl border p-5 theme-card">
        <h2 className="text-xl font-black theme-text">Recent Products</h2>
        {data.recent.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left theme-text-muted">
                <tr>
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.recent.map((product) => (
                  <tr key={product.id}>
                    <td className="py-3 font-bold theme-text">{product.name}</td>
                    <td className="py-3 theme-text-secondary">{product.status}</td>
                    <td className="py-3 theme-text-muted">
                      {new Date(product.updated_at).toLocaleDateString("en-PH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm theme-text-muted">No products yet.</p>
        )}
      </section>
    </AdminShell>
  );
}

function UnavailablePanel({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm font-semibold text-yellow-200 sm:col-span-2 xl:col-span-4">
      {label}
    </div>
  );
}
