import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminUI";
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
      <AdminPageHeader
        eyebrow="Product Inventory"
        title="Inventory"
        description="Manage physical stock, replacement cost, and low-stock status."
      />

      <div className="mt-8">
        <InventoryManager data={data} />
      </div>
    </AdminShell>
  );
}
