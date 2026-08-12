import { notFound } from "next/navigation";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminProduct } from "@/lib/products";

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]/edit">) {
  const access = await requireAdmin();
  if (access.status === "forbidden") return <AdminDenied />;

  const { id } = await params;
  const query = await searchParams;
  const product = await getAdminProduct(id);

  if (!product) notFound();

  return (
    <AdminShell session={access.session}>
      <div>
        <h1 className="text-3xl font-black theme-text">Edit Product</h1>
        <p className="mt-1 text-sm theme-text-muted">{product.name}</p>
      </div>
      <section className="mt-6 rounded-lg border p-5 theme-card">
        <ProductForm
          product={product}
          action={`/api/admin/products/${product.id}`}
          saved={query.saved === "1"}
          error={typeof query.error === "string" ? query.error : ""}
        />
      </section>
    </AdminShell>
  );
}
