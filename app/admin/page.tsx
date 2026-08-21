import Link from "next/link";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAnalyticsDashboard } from "@/lib/analytics/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { formatInventoryValue, getInventoryDashboardData } from "@/lib/inventory";
import { getAdminProductDashboard } from "@/lib/products";

export default async function AdminDashboardPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }
  const [data, analytics, inventory] = await Promise.all([
    getAdminProductDashboard(),
    getAnalyticsDashboard("7d"),
    getInventoryDashboardData(),
  ]);
  const cards = [
    { label: "Total Products", value: data.total },
    { label: "Published", value: data.published },
    { label: "Drafts", value: data.draft },
    { label: "Archived", value: data.archived },
  ];

  return (
    <AdminShell session={access.session}>
      <p className="text-xs font-black uppercase tracking-[0.22em] theme-accent">
        TapTapTap Admin
      </p>
      <h1 className="mt-3 text-3xl font-black theme-text">Dashboard</h1>
      <p className="mt-2 text-sm theme-text-secondary">Welcome back.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <section key={card.label} className="rounded-lg border p-5 theme-card">
            <p className="text-sm font-bold theme-text">{card.label}</p>
            <p className="mt-4 text-3xl font-black theme-accent">{card.value}</p>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-lg border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black theme-text">Analytics Preview</h2>
          <Link href="/admin/analytics" className="text-sm font-bold theme-accent">
            View Analytics
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Views - last 7 days", value: analytics.summary.totalViews },
            { label: "Unique Visitors - last 7 days", value: analytics.summary.uniqueVisitors },
            { label: "Product Views - last 7 days", value: analytics.summary.productViews },
            { label: "Customizer Opens - last 7 days", value: analytics.summary.customizerOpens },
          ].map((item) => (
            <div key={item.label} className="rounded-md border p-4 theme-subtle">
              <p className="text-xs font-bold uppercase tracking-[0.14em] theme-text-muted">{item.label}</p>
              <p className="mt-3 text-2xl font-black theme-text">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black theme-text">Inventory Summary</h2>
          <Link href="/admin/inventory" className="text-sm font-bold theme-accent">
            Manage Inventory
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Units In Stock", value: inventory.summary.totalUnits.toLocaleString("en-PH") },
            { label: "Inventory Value", value: formatInventoryValue(inventory.summary.inventoryValue) },
            { label: "Low Stock Items", value: String(inventory.summary.lowStockProducts) },
            { label: "Out of Stock", value: String(inventory.summary.outOfStockProducts) },
          ].map((item) => (
            <div key={item.label} className="rounded-md border p-4 theme-subtle">
              <p className="text-xs font-bold uppercase tracking-[0.14em] theme-text-muted">{item.label}</p>
              <p className="mt-3 text-2xl font-black theme-text">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border p-5 theme-card">
        <h2 className="text-lg font-black theme-text">Recent Products</h2>
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
