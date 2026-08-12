import type { Metadata } from "next";
import { Palette } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/Button";
import { getPublishedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products | TapTapTap",
  description:
    "Browse TapTapTap ready-made NFC table signs and customize your own NFC sign design.",
};

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <main className="theme-section px-4 pb-18 pt-28 sm:px-6 sm:pb-24 lg:px-8 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] theme-accent">
              NFC Product Catalog
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-normal theme-text sm:text-5xl lg:text-6xl">
              Ready-made signs and custom NFC products.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 theme-text-secondary">
              Choose a finished TapTapTap design or upload your own artwork for
              a custom NFC table sign.
            </p>
          </div>

          <ProductGrid products={products} />

          <section className="mt-12 rounded-lg border p-6 theme-card-elevated sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] theme-accent">
                Want your own design?
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-normal theme-text">
                Preview your artwork on a blank TapTapTap NFC sign.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 theme-text-secondary">
                Upload your artwork and preview it on a blank TapTapTap NFC sign
                before ordering.
              </p>
            </div>
            <Button href="/customize" className="mt-6 w-full lg:mt-0 lg:w-auto">
              <Palette className="h-4 w-4" aria-hidden />
              Try the Customizer
            </Button>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
