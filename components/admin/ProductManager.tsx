"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductStatusActions } from "@/components/admin/ProductStatusActions";
import { formatPhp } from "@/lib/format";
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
    <section className="rounded-lg border p-4 theme-card">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or slug"
          className="min-h-11 rounded-md border theme-border bg-[var(--surface-secondary)] px-4 text-sm theme-text"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProductStatus | "all")}
          className="min-h-11 rounded-md border theme-border bg-[var(--surface-secondary)] px-3 text-sm theme-text"
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortValue)}
          className="min-h-11 rounded-md border theme-border bg-[var(--surface-secondary)] px-3 text-sm theme-text"
        >
          <option value="display">Display Order</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">Name A-Z</option>
          <option value="za">Name Z-A</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="mt-6 rounded-lg border theme-border p-8 text-center">
          <p className="font-bold theme-text">No products yet.</p>
          <Link href="/admin/products/new" className="mt-4 inline-flex font-bold theme-accent">
            Add Product
          </Link>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="text-left theme-text-muted">
              <tr>
                <th className="pb-3 font-semibold">Image</th>
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Buy 1</th>
                <th className="pb-3 font-semibold">Buy 2</th>
                <th className="pb-3 font-semibold">Updated</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredProducts.map((product) => {
                const image = product.card_image_url || product.detail_image_url;

                return (
                  <tr key={product.id}>
                    <td className="py-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-md bg-black">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={product.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="font-bold theme-text">{product.name}</p>
                      <p className="mt-1 text-xs theme-text-muted">{product.slug}</p>
                    </td>
                    <td className="py-3 capitalize theme-text-secondary">
                      {product.product_type === "custom" ? "Custom Branded" : "Standard"}
                    </td>
                    <td className="py-3">
                      <span className="rounded-md border px-2 py-1 text-xs font-bold theme-accent-bg">
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 theme-text">{formatPhp(Number(product.price_single))}</td>
                    <td className="py-3 theme-text">{formatPhp(Number(product.price_bundle ?? 0))}</td>
                    <td className="py-3 theme-text-muted">
                      {new Date(product.updated_at).toLocaleDateString("en-PH")}
                    </td>
                    <td className="py-3">
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
