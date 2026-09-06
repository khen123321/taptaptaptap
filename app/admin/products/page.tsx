import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLinkButton, AdminPageHeader } from "@/components/admin/AdminUI";
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
      <AdminPageHeader
        eyebrow="Storefront Catalog"
        title="Products"
        description="Manage storefront products, pricing, images, and inventory settings."
        action={<AdminLinkButton href="/admin/products/new" variant="primary">+ Add Product</AdminLinkButton>}
      />
      <div className="mt-6">
        <ProductManager products={products} />
      </div>
    </AdminShell>
  );
}
