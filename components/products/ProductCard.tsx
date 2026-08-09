import Image from "next/image";
import { ArrowRight, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatProductPrice } from "@/lib/products";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const isCustom = product.type === "custom";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0A0D0F] transition hover:-translate-y-1 hover:border-[#00A8C0]/55">
      <div className="relative aspect-square overflow-hidden bg-black">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-[1.025]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00A8C0]">
          {isCustom ? "Custom Product" : "Ready-Made Design"}
        </p>
        <h3 className="mt-3 text-xl font-bold text-white">{product.name}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[#9CA6AD]">
          {product.description}
        </p>
        <p className="mt-5 text-lg font-black text-white">
          {formatProductPrice(product)}
        </p>
        <div className="mt-5 grid gap-3 min-[430px]:grid-cols-2">
          {isCustom ? (
            <>
              <Button href="/customize" className="px-3">
                <Palette className="h-4 w-4" aria-hidden />
                Customize Now
              </Button>
              <Button href={`/products/${product.slug}`} variant="secondary" className="px-3">
                View Mockup
              </Button>
            </>
          ) : (
            <>
              <Button href={`/products/${product.slug}`} variant="secondary" className="px-3">
                View Product
              </Button>
              <Button href="/customize" className="px-3">
                Customize Yours
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
