import Link from "next/link";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductManager } from "@/components/admin/ProductManager";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminProducts } from "@/lib/products";

export default async function AdminProductsPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }
  const products = await getAdminProducts();

  return (
    <AdminShell session={access.session}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black theme-text">Products</h1>
          <p className="mt-1 text-sm theme-text-muted">Manage storefront products and pricing.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)]"
        >
          + Add Product
        </Link>
      </div>
      <div className="mt-6">
        <ProductManager products={products} />
      </div>
    </AdminShell>
  );
}
