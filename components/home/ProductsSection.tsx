"use client";

import { useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetailsModal } from "@/components/products/ProductDetailsModal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { products } from "@/lib/products";
import type { Product } from "@/types/product";

export function ProductsSection() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <section id="products" className="theme-section-alt px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Choose your TapTapTap."
          description="Browse Standard Designs or create a Custom Branded NFC sign for your business."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={setSelectedProduct}
            />
          ))}
        </div>
      </div>

      <ProductDetailsModal
        key={selectedProduct?.id ?? "closed"}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
