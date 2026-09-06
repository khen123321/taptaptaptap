import Link from "next/link";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminEmptyState, AdminPageHeader, adminFieldClass } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/admin-auth";
import { getInventoryHistory, getInventoryProducts, inventoryMovementTypes } from "@/lib/inventory";
import type { InventoryMovementType } from "@/types/database";

export default async function AdminInventoryHistoryPage({
  searchParams,
}: PageProps<"/admin/inventory/history">) {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }

  const params = await searchParams;
  const productId = single(params.product);
  const movementType = single(params.type) as InventoryMovementType | "all" | undefined;
  const query = single(params.q);
  const [products, movements] = await Promise.all([
    getInventoryProducts(),
    getInventoryHistory({ productId, movementType, query }),
  ]);

  return (
    <AdminShell session={access.session}>
      <AdminPageHeader
        eyebrow="Inventory Ledger"
        title="Inventory History"
        description="Review stock changes. Existing movements are not editable."
        action={<Link href="/admin/inventory" className="text-sm font-bold theme-accent">Back to Inventory</Link>}
      />

      <section className="mt-8 rounded-2xl border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black theme-text">Movement History</h2>
        </div>

        <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_1fr_auto]">
          <label className="grid gap-2 text-sm font-bold theme-text">
            Product
            <select name="product" defaultValue={productId ?? ""} className={fieldClass}>
              <option value="">All products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold theme-text">
            Type
            <select name="type" defaultValue={movementType ?? "all"} className={fieldClass}>
              <option value="all">All types</option>
              {inventoryMovementTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold theme-text">
            Search
            <input name="q" defaultValue={query ?? ""} placeholder="Product, SKU, notes, admin" className={fieldClass} />
          </label>
          <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] lg:self-end">
            Filter
          </button>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-[var(--surface-secondary)] text-left theme-text-muted">
              <tr>
                <th className="rounded-l-lg px-3 py-3 font-semibold">Date/Time</th>
                <th className="px-3 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Previous</th>
                <th className="px-3 py-3 font-semibold">Change</th>
                <th className="px-3 py-3 font-semibold">New</th>
                <th className="px-3 py-3 font-semibold">Reason</th>
                <th className="px-3 py-3 font-semibold">Admin</th>
                <th className="rounded-r-lg px-3 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-3 py-4 theme-text-muted">
                    {new Date(movement.created_at).toLocaleString("en-PH")}
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-bold theme-text">{movement.productName}</p>
                    <p className="mt-1 text-xs theme-text-muted">{movement.productSku || "No SKU"}</p>
                  </td>
                  <td className="px-3 py-4 theme-text">{movement.previous_quantity}</td>
                  <td className={`px-3 py-4 font-bold ${movement.quantity_change > 0 ? "text-green-300" : "text-red-300"}`}>
                    {movement.quantity_change > 0 ? "+" : ""}
                    {movement.quantity_change}
                  </td>
                  <td className="px-3 py-4 theme-text">{movement.new_quantity}</td>
                  <td className="px-3 py-4 theme-text-secondary">{movement.reason || formatMovementType(movement.movement_type)}</td>
                  <td className="px-3 py-4 theme-text-muted">{movement.actorEmail || "Unknown admin"}</td>
                  <td className="px-3 py-4 theme-text-muted">{movement.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movements.length === 0 ? (
          <div className="mt-5">
            <AdminEmptyState title="No inventory movements found" description="Try changing the filters or add stock to create the first ledger entry." />
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}

const fieldClass = adminFieldClass;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatMovementType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
