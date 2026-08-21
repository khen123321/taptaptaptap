import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { requireAdmin } from "@/lib/admin-auth";
import { getInventoryDashboardData } from "@/lib/inventory";

export default async function AdminInventoryPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }

  const data = await getInventoryDashboardData();

  return (
    <AdminShell session={access.session}>
      <p className="text-xs font-black uppercase tracking-[0.22em] theme-accent">
        Product Inventory
      </p>
      <h1 className="mt-3 text-3xl font-black theme-text">Inventory</h1>
      <p className="mt-2 text-sm theme-text-secondary">
        Manage physical stock, replacement cost, and low-stock status.
      </p>

      <div className="mt-8">
        <InventoryManager data={data} />
      </div>
    </AdminShell>
  );
}
