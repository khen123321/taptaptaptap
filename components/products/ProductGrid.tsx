"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { OrderContactModal, type OrderContactDetails } from "@/components/products/OrderContactModal";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetailsModal } from "@/components/products/ProductDetailsModal";
import { trackEvent } from "@/lib/analytics/client";
import type { Product } from "@/types/product";

export function ProductGrid({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderContact, setOrderContact] = useState<OrderContactDetails | null>(null);
  const shouldAutoplay = useShouldAutoplay();
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 4200,
        playOnInit: false,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }),
    [],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: products.length > 1,
      skipSnaps: false,
    },
    [autoplay],
  );

  const syncAutoplay = useCallback(() => {
    if (!emblaApi) return;

    const autoplayPlugin = emblaApi.plugins().autoplay;
    if (!autoplayPlugin) return;

    const snapCount = emblaApi.scrollSnapList().length;
    if (!shouldAutoplay || products.length < 2 || snapCount < 2) {
      autoplayPlugin.stop();
      return;
    }

    autoplayPlugin.play();
  }, [emblaApi, products.length, shouldAutoplay]);

  useEffect(() => {
    if (!emblaApi) return;

    syncAutoplay();
    emblaApi.on("reInit", syncAutoplay);

    return () => {
      emblaApi.off("reInit", syncAutoplay);
      emblaApi.plugins().autoplay?.stop();
    };
  }, [emblaApi, syncAutoplay]);

  const resetAutoplay = useCallback(() => {
    if (!emblaApi || !shouldAutoplay) return;

    const autoplayPlugin = emblaApi.plugins().autoplay;
    if (!autoplayPlugin) return;

    if (products.length < 2 || emblaApi.scrollSnapList().length < 2) return;

    autoplayPlugin.reset();
  }, [emblaApi, products.length, shouldAutoplay]);

  const openProduct = (product: Product) => {
    trackEvent("product_details_open", {
      productId: product.id,
      metadata: { productSlug: product.slug },
      dedupeKey: `product_details_open:${product.id}:${Date.now()}`,
    });
    setSelectedProduct(product);
  };

  const openOrderContact = (order: OrderContactDetails) => {
    setSelectedProduct(null);
    setOrderContact(order);
  };

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    resetAutoplay();
  }, [emblaApi, resetAutoplay]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    resetAutoplay();
  }, [emblaApi, resetAutoplay]);

  return (
    <>
      {products.length ? (
        <div className="section-content-gap">
          <div className="mb-4 flex justify-end gap-2">
            <CarouselButton label="Previous product" onClick={scrollPrev}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </CarouselButton>
            <CarouselButton label="Next product" onClick={scrollNext}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </CarouselButton>
          </div>

          <div ref={emblaRef} className="overflow-hidden" aria-label="Product carousel">
            <div className="flex gap-5">
              {products.map((product) => (
                <ProductAnalyticsSlide key={product.id} product={product}>
                  <ProductCard product={product} onViewDetails={openProduct} />
                </ProductAnalyticsSlide>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="section-content-gap rounded-lg border p-8 text-center theme-card">
          <p className="font-bold theme-text">No published products yet.</p>
        </div>
      )}

      <ProductDetailsModal
        key={selectedProduct?.id ?? "closed"}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOrder={openOrderContact}
      />
      <OrderContactModal
        order={orderContact}
        onClose={() => setOrderContact(null)}
      />
    </>
  );
}

function useShouldAutoplay() {
  const [shouldAutoplay, setShouldAutoplay] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setShouldAutoplay(!mediaQuery.matches);

    syncPreference();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, []);

  return shouldAutoplay;
}

function ProductAnalyticsSlide({
  product,
  children,
}: {
  product: Product;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5);
        if (!visible) return;

        trackEvent("product_view", {
          productId: product.id,
          metadata: { productSlug: product.slug },
          dedupeKey: `product_view:${window.location.pathname}:${product.id}`,
        });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [product.id, product.slug]);

  return (
    <div ref={ref} className="product-carousel-slide min-w-0">
      {children}
    </div>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)] theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      {children}
    </button>
  );
}
