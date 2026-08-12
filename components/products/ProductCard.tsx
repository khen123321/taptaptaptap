"use client";

import { ArrowRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  onViewDetails?: (product: Product) => void;
};

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const image = product.cardImage ?? product.image;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] theme-accent">
          {product.type === "custom" ? "Custom Branded" : "Standard Design"}
        </p>
        <h3 className="mt-3 text-xl font-bold theme-text">{product.name}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 theme-text-secondary">
          {product.description}
        </p>

        {onViewDetails ? (
          <span className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border theme-border bg-[var(--surface-secondary)] px-5 text-sm font-semibold theme-text transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)]">
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
