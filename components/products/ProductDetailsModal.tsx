"use client";

import { Check, CheckCircle2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPhp } from "@/lib/format";
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
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-5"
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
        className="relative max-h-[calc(100vh-2.5rem)] w-full max-w-6xl overflow-y-auto rounded-lg border theme-card-elevated"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close product details"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)] theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[280px] border-b theme-border bg-black lg:min-h-[640px] lg:border-b-0 lg:border-r">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="h-full min-h-[280px] w-full object-contain lg:min-h-[640px]"
            />
          </div>

          <div className="p-5 sm:p-7 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] theme-accent">
              {product.type === "custom" ? "Custom Branded" : "Standard Design"}
            </p>
            <h2 id={titleId} className="mt-3 text-3xl font-black tracking-normal theme-text">
              {product.name}
            </h2>
            <p className="mt-4 text-base leading-7 theme-text-secondary">
              {product.description}
            </p>

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
                      className={`rounded-lg border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0] ${
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
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] theme-accent">
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
              <p className="mt-1 text-3xl font-black tracking-normal theme-text">
                {selectedPackage === "one" ? "Buy 1" : "Buy 2"}{" "}
                <span className="theme-accent">{formatPhp(selectedPrice)}</span>
              </p>
              {selectedPackage === "two" ? (
                <p className="mt-2 text-sm font-bold theme-accent">
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
