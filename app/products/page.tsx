import type { Metadata } from "next";
import { Palette } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products | TapTapTap",
  description:
    "Browse TapTapTap ready-made NFC table signs and customize your own NFC sign design.",
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="px-4 pb-18 pt-28 sm:px-6 sm:pb-24 lg:px-8 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#00A8C0]">
              NFC Product Catalog
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              Ready-made signs and custom NFC products.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#B7C0C7]">
              Choose a finished TapTapTap design or upload your own artwork for
              a custom NFC table sign.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <section className="mt-12 rounded-lg border border-[#00A8C0]/35 bg-[#0A0D0F] p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#00A8C0]">
                Want your own design?
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-white">
                Preview your artwork on a blank TapTapTap NFC sign.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA6AD]">
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
