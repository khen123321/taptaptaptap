import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminProductDashboard } from "@/lib/products";

export default async function AdminDashboardPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }
  const data = await getAdminProductDashboard();
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
