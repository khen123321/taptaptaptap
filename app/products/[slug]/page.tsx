import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Palette, ShoppingBag } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import {
  formatProductPrice,
  getPublishedProductBySlug,
  getPublishedProducts,
} from "@/lib/products";

type ProductPageProps = PageProps<"/products/[slug]">;

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | TapTapTap",
    };
  }

  return {
    title: `${product.name} | TapTapTap`,
    description: product.description,
    openGraph: {
      title: `${product.name} | TapTapTap`,
      description: product.description,
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const isCustom = product.type === "custom";

  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <main className="theme-section px-4 pb-18 pt-28 sm:px-6 sm:pb-24 lg:px-8 lg:pt-32">
        <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1fr] lg:items-center">
          <div className="relative aspect-square overflow-hidden rounded-lg border theme-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] theme-accent">
              {isCustom ? "Custom NFC Product" : "Ready-Made NFC Product"}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal theme-text sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-5 text-lg leading-8 theme-text-secondary">
              {product.description}
            </p>
            {isCustom ? (
              <p className="mt-4 rounded-md border px-4 py-3 text-sm leading-6 theme-subtle theme-text-secondary">
                Start with the blank NFC sign mockup, upload your own artwork,
                and preview how it could look before ordering. Can include an
                optional QR-code backup.
              </p>
            ) : (
              <p className="mt-4 rounded-md border px-4 py-3 text-sm leading-6 theme-subtle theme-text-secondary">
                This ready-made design can be programmed to your business
                destination link before delivery.
              </p>
            )}
            <p className="mt-6 text-3xl font-black theme-text">
              {formatProductPrice(product)}
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
              <Button href="/customize" className="w-full min-[430px]:w-auto">
                <Palette className="h-4 w-4" aria-hidden />
                Customize This Product
              </Button>
              <Button href="/products" variant="secondary" className="w-full min-[430px]:w-auto">
                <ShoppingBag className="h-4 w-4" aria-hidden />
                View All Products
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
