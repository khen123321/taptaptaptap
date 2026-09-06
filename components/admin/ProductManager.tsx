"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminEmptyState, AdminStatusBadge, adminFieldClass } from "@/components/admin/AdminUI";
import { ProductStatusActions } from "@/components/admin/ProductStatusActions";
import { formatPhp } from "@/lib/format";
import { getInventoryStatus, getInventoryStatusClass, getInventoryStatusLabel } from "@/lib/inventory-status";
import type { ProductRow, ProductStatus } from "@/types/database";

type SortValue = "newest" | "oldest" | "az" | "za" | "display";

export function ProductManager({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [sort, setSort] = useState<SortValue>("display");

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesStatus = status === "all" || product.status === status;
        const matchesQuery = `${product.name} ${product.slug}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        if (sort === "oldest") return a.updated_at.localeCompare(b.updated_at);
        if (sort === "az") return a.name.localeCompare(b.name);
        if (sort === "za") return b.name.localeCompare(a.name);
        if (sort === "display") return a.display_order - b.display_order || a.name.localeCompare(b.name);
        return b.updated_at.localeCompare(a.updated_at);
      });
  }, [products, query, sort, status]);

  return (
    <section className="rounded-2xl border p-5 theme-card">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or slug"
          className={`${adminFieldClass} px-4`}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProductStatus | "all")}
          className={adminFieldClass}
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortValue)}
          className={adminFieldClass}
        >
          <option value="display">Display Order</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">Name A-Z</option>
          <option value="za">Name Z-A</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            title="No products found"
            description="Adjust the filters or create a new storefront product."
            action={<Link href="/admin/products/new" className="font-bold theme-accent">Add Product</Link>}
          />
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm">
            <thead className="bg-[var(--surface-secondary)] text-left theme-text-muted">
              <tr>
                <th className="rounded-l-lg px-3 py-3 font-semibold">Image</th>
                <th className="px-3 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Inventory</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="rounded-r-lg px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredProducts.map((product) => {
                const image = product.card_image_url || product.detail_image_url;
                const inventoryStatus = getInventoryStatus(product);

                return (
                  <tr key={product.id}>
                    <td className="px-3 py-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-md bg-black">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={product.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-bold theme-text">{product.name}</p>
                      <p className="mt-1 text-xs theme-text-muted">{product.slug} · {product.sku || "No SKU"}</p>
                    </td>
                    <td className="px-3 py-4 capitalize theme-text-secondary">
                      {product.product_type === "custom" ? "Custom Branded" : "Standard"}
                    </td>
                    <td className="px-3 py-4">
                      <div className="grid gap-1">
                        <span className="font-bold theme-text">{formatPhp(Number(product.price_single))}</span>
                        <span className="text-xs theme-text-muted">Buy 2 {formatPhp(Number(product.price_bundle ?? 0))}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <AdminStatusBadge status={product.status} />
                    </td>
                    <td className="px-3 py-4">
                      <div className="grid gap-1">
                        <span className="font-bold theme-text">{product.current_stock ?? 0}</span>
                        <span className={`w-fit rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getInventoryStatusClass(inventoryStatus)}`}>
                          {getInventoryStatusLabel(inventoryStatus)}
                        </span>
                        <span className="text-xs theme-text-muted">Cost {formatPhp(Number(product.current_unit_cost ?? 0))}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 theme-text-muted">
                      {new Date(product.updated_at).toLocaleDateString("en-PH")}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-bold theme-accent"
                        >
                          Edit
                        </Link>
                        <ProductStatusActions productId={product.id} status={product.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
