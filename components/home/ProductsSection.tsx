import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublishedProducts } from "@/lib/products";

export async function ProductsSection() {
  const products = await getPublishedProducts();

  return (
    <section id="products" className="theme-section-alt px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Choose your TapTapTap."
          description="Browse Standard Designs or create a Custom Branded NFC sign for your business."
        />

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
