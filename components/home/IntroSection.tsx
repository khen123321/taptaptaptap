"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  Globe,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    number: "01",
    title: "Tap your phone",
    description: "Hold an NFC-enabled smartphone near the TapTapTap sign.",
    image: "/images/how-it-works/step-1-tap.jpg",
    alt: "Hand holding a smartphone near a TapTapTap NFC sign",
  },
  {
    number: "02",
    title: "NFC is detected",
    description:
      "Your phone recognizes the NFC chip automatically - no scanning or app required.",
    image: "/images/how-it-works/step-2-detect.jpg",
    alt: "Smartphone detecting an NFC tag",
  },
  {
    number: "03",
    title: "Your link opens",
    description:
      "Customers are taken directly to your review page, social profile, menu, website, or chosen link.",
    image: "/images/how-it-works/step-3-open.jpg",
    alt: "Smartphone displaying an opened destination link",
  },
];

const destinations = [
  { label: "Google Review", icon: Star },
  { label: "Instagram", icon: InstagramIcon },
  { label: "Menu", icon: UtensilsCrossed },
  { label: "Website", icon: Globe },
];

export function IntroSection() {
  return (
    <section className="theme-section px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="One tap can do more."
          description="Tap your phone, open the link, and connect instantly. No app needed."
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          {steps.map((step, index) => (
            <StepWithArrow key={step.number} step={step} showArrow={index < steps.length - 1} />
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] theme-text-muted">
            One tap can open:
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {destinations.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold theme-card transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                <Icon className="h-4 w-4 theme-accent" aria-hidden />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepWithArrow({
  step,
  showArrow,
}: {
  step: (typeof steps)[number];
  showArrow: boolean;
}) {
  return (
    <>
      <StepCard step={step} />
      {showArrow ? (
        <>
          <div className="hidden items-center justify-center lg:flex" aria-hidden>
            <ArrowRight className="h-5 w-5 theme-accent" />
          </div>
          <div className="flex items-center justify-center py-1 lg:hidden" aria-hidden>
            <ArrowDown className="h-5 w-5 theme-accent" />
          </div>
        </>
      ) : null}
    </>
  );
}

function StepCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <article className="h-full rounded-lg border p-3 theme-card">
      <StepImage src={step.image} alt={step.alt} />
      <div className="px-2 pb-3 pt-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] theme-accent">
          {step.number}
        </p>
        <h3 className="mt-2 text-xl font-black tracking-normal theme-text">
          {step.title}
        </h3>
        <p className="mt-3 text-sm leading-6 theme-text-secondary">
          {step.description}
        </p>
      </div>
    </article>
  );
}

function StepImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-md border theme-border bg-[var(--surface-secondary)]">
      {hasError ? (
        <div className="flex h-full flex-col items-center justify-center px-5 text-center">
          <p className="text-sm font-bold theme-text">Step image coming soon</p>
          <p className="mt-2 break-all text-xs leading-5 theme-text-muted">{src}</p>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M16.8 7.2h.01" />
    </svg>
  );
}
