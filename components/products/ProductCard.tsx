"use client";

import { ArrowRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { getProductSavingsLabel } from "@/lib/product-promos";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  onViewDetails?: (product: Product) => void;
};

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const image = product.cardImage ?? product.image;
  const savingsLabel = getProductSavingsLabel(product);

  const openDetails = () => {
    onViewDetails?.(product);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onViewDetails) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails();
    }
  };

  return (
    <article
      role={onViewDetails ? "button" : undefined}
      tabIndex={onViewDetails ? 0 : undefined}
      onClick={onViewDetails ? openDetails : undefined}
      onKeyDown={handleKeyDown}
      className={`group flex h-full flex-col overflow-hidden rounded-lg border theme-card transition hover:-translate-y-1 hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        onViewDetails ? "cursor-pointer" : ""
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-black">
        {savingsLabel ? (
          <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
            <span className="promo-badge rounded-md px-2.5 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.1em] sm:px-3 sm:text-[0.68rem] sm:tracking-[0.12em]">
              Limited Time Offer
            </span>
            <span className="promo-savings-badge rounded-md border px-2.5 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.1em] backdrop-blur sm:px-3 sm:text-[0.68rem] sm:tracking-[0.12em]">
              {savingsLabel}
            </span>
          </div>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] theme-accent">
          {product.type === "custom" ? "Custom Branded" : "Standard Design"}
        </p>
        <h3 className="mt-2 text-lg font-bold theme-text sm:mt-3 sm:text-xl">{product.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 theme-text-secondary sm:mt-3">
          {product.description}
        </p>

        {onViewDetails ? (
          <span className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border theme-border bg-[var(--surface-secondary)] px-5 text-sm font-semibold theme-text transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)] sm:mt-6">
            View Details
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        ) : (
          <Button href={`/products/${product.slug}`} variant="secondary" className="mt-6 w-full">
            View Details
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </article>
  );
}
