"use client";

import { Check, CheckCircle2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPhp } from "@/lib/format";
import { getProductSavingsLabel } from "@/lib/product-promos";
import type { Product } from "@/types/product";

type ProductDetailsModalProps = {
  product: Product | null;
  onClose: () => void;
};

type PackageOption = "one" | "two";

const focusableSelector =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>("one");

  useEffect(() => {
    if (!product) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, product]);

  if (!product) return null;

  const savingsLabel = getProductSavingsLabel(product);
  const selectedPrice =
    selectedPackage === "one" ? product.buyOnePrice : product.buyTwoPrice;
  const packageOptions = [
    {
      id: "one" as const,
      label: "Buy 1",
      detail: "1 NFC Sign",
      price: product.buyOnePrice,
    },
    {
      id: "two" as const,
      label: "Buy 2",
      detail: "2 NFC Signs",
      price: product.buyTwoPrice,
      savings: product.buyTwoSavings,
      badge: "Best Value",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-2 py-2 sm:px-4 sm:py-5"
      style={{ background: "var(--overlay)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[calc(100dvh-1rem)] w-full max-w-6xl overflow-y-auto rounded-lg border theme-card-elevated sm:max-h-[calc(100dvh-2.5rem)]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close product details"
          onClick={onClose}
          className="sticky left-[calc(100%-3.25rem)] top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-md border theme-border bg-[var(--surface)] theme-text shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative -mt-11 min-h-[220px] border-b theme-border bg-black sm:min-h-[300px] lg:mt-0 lg:min-h-[640px] lg:border-b-0 lg:border-r">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="h-full min-h-[220px] w-full object-contain sm:min-h-[300px] lg:min-h-[640px]"
            />
          </div>

          <div className="p-4 sm:p-7 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] theme-accent">
              {product.type === "custom" ? "Custom Branded" : "Standard Design"}
            </p>
            <h2 id={titleId} className="mt-3 text-2xl font-black tracking-normal theme-text sm:text-3xl">
              {product.name}
            </h2>
            <p className="mt-3 text-sm leading-6 theme-text-secondary sm:mt-4 sm:text-base sm:leading-7">
              {product.description}
            </p>
            {savingsLabel ? (
              <div className="promo-banner mt-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
                <span className="promo-badge rounded-md px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em]">
                  Limited Time Offer
                </span>
                <span className="promo-savings-text text-sm font-bold">{savingsLabel}</span>
              </div>
            ) : null}

            <div className="mt-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] theme-text">
                Choose Package
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {packageOptions.map((option) => {
                  const isSelected = selectedPackage === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedPackage(option.id)}
                      className={`min-h-32 rounded-lg border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0] ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "theme-border bg-[var(--surface-secondary)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black theme-text">{option.label}</p>
                        {option.badge ? (
                          <span className="rounded-md border border-[var(--accent)] bg-[var(--accent)] px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[var(--button-primary-text)]">
                            {option.badge}
                          </span>
                        ) : null}
                        {isSelected ? (
                          <Check className="h-4 w-4 shrink-0 theme-accent" aria-hidden />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm theme-text-muted">{option.detail}</p>
                      <p className="mt-3 text-2xl font-black tracking-normal theme-text">
                        {formatPhp(option.price)}
                      </p>
                      {option.savings ? (
                        <p className="promo-savings-text mt-1 text-xs font-bold uppercase tracking-[0.12em]">
                          Save {formatPhp(option.savings)}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-lg border p-4 theme-subtle">
              <p className="text-sm font-bold theme-text-muted">Selected package</p>
              <p className="mt-1 text-2xl font-black tracking-normal theme-text sm:text-3xl">
                {selectedPackage === "one" ? "Buy 1" : "Buy 2"}{" "}
                <span className="theme-accent">{formatPhp(selectedPrice)}</span>
              </p>
              {selectedPackage === "two" ? (
                <p className="promo-savings-text mt-2 text-sm font-bold">
                  You save {formatPhp(product.buyTwoSavings)}
                </p>
              ) : null}
            </div>

            <div className="mt-6 border-t theme-border pt-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] theme-text">
                Included Free
              </p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {product.includedFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm leading-5 theme-text-secondary">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 theme-accent"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              href={product.ctaHref}
              className="mt-7 w-full"
              data-analytics-event="shop_click"
              data-analytics-cta={product.ctaLabel}
              data-analytics-source="product-details-modal"
            >
              {product.ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
