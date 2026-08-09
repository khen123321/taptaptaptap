import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { products } from "@/lib/products";

export function ProductsSection() {
  return (
    <section id="products" className="bg-[#050607] px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Popular NFC Products"
          description="Browse ready-made NFC signs or start with a blank custom sign for your own design."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
