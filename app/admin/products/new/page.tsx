import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin-auth";

export default async function NewProductPage({
  searchParams,
}: PageProps<"/admin/products/new">) {
  const access = await requireAdmin();
  if (access.status === "forbidden") return <AdminDenied />;

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <AdminShell session={access.session}>
      <h1 className="text-3xl font-black theme-text">Add Product</h1>
      <p className="mt-1 text-sm theme-text-muted">Create a new TapTapTap product.</p>
      <section className="mt-6 rounded-lg border p-5 theme-card">
        <ProductForm action="/api/admin/products" error={error} />
      </section>
    </AdminShell>
  );
}
