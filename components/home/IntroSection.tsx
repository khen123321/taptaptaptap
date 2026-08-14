"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingCart,
  Star,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    number: "01",
    title: "Tap Your Phone",
    description: "Simply tap your phone on the TapTapTap card.",
    image: "/images/how-it-works/step-1-tap.jpg",
    alt: "Hand holding a smartphone near a TapTapTap NFC sign",
  },
  {
    number: "02",
    title: "Tap the Notification",
    description: "A notification instantly appears on your phone.",
    image: "/images/how-it-works/step-2-detect.jpg",
    alt: "Smartphone detecting an NFC tag",
  },
  {
    number: "03",
    title: "Open the Link",
    description:
      "Tap it to go directly to the business page, review page, menu, or website.",
    image: "/images/how-it-works/step-3-open.jpg",
    alt: "Smartphone displaying an opened destination link",
  },
];

const destinationRows = [
  [
    { label: "Google Review", icon: Star },
    { label: "Facebook Page", icon: FacebookIcon },
    { label: "Messenger", icon: MessageCircle },
    { label: "Instagram", icon: InstagramIcon },
    { label: "TikTok", icon: TikTokIcon },
    { label: "Digital Menu", icon: UtensilsCrossed },
    { label: "Book Appointment", icon: CalendarDays },
  ],
  [
    { label: "Order Online", icon: ShoppingCart },
    { label: "Payment", icon: CreditCard },
    { label: "Website", icon: Globe },
    { label: "Google Maps", icon: MapPin },
    { label: "Call Us", icon: Phone },
    { label: "Wi-Fi", icon: Wifi },
    { label: "Feedback Form", icon: ClipboardList },
  ],
];

export function IntroSection() {
  return (
    <section className="section-spacing theme-section px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="One tap can do more."
          description="Tap your phone, open the link, and connect instantly. No app needed."
        />

        <div className="section-content-gap mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          {steps.map((step, index) => (
            <StepWithArrow key={step.number} step={step} showArrow={index < steps.length - 1} />
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] theme-text-muted">
            One tap can open:
          </p>
          <div className="tap-open-marquee mt-5 grid gap-3 overflow-hidden">
            {destinationRows.map((destinations, index) => (
              <DestinationMarqueeRow
                key={index}
                destinations={destinations}
                direction={index === 0 ? "left" : "right"}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DestinationMarqueeRow({
  destinations,
  direction,
}: {
  destinations: (typeof destinationRows)[number];
  direction: "left" | "right";
}) {
  return (
    <div className="tap-open-marquee-viewport">
      <div
        className={`tap-open-marquee-track ${
          direction === "right" ? "tap-open-marquee-track-reverse" : ""
        }`}
        aria-label="TapTapTap NFC destinations"
      >
        <DestinationGroup destinations={destinations} />
        <DestinationGroup destinations={destinations} duplicate />
      </div>
    </div>
  );
}

function DestinationGroup({
  destinations,
  duplicate = false,
}: {
  destinations: (typeof destinationRows)[number];
  duplicate?: boolean;
}) {
  return (
    <div className="tap-open-marquee-group" aria-hidden={duplicate}>
      {destinations.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold theme-card"
        >
          <Icon className="h-4 w-4 shrink-0 theme-accent" aria-hidden />
          <span className="whitespace-nowrap">{label}</span>
        </div>
      ))}
    </div>
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

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 8.5h2V5.1c-.35-.05-1.55-.15-2.95-.15-2.9 0-4.9 1.78-4.9 5.05v2.85H5v3.8h3.15V24h3.9v-7.35h3.05l.55-3.8h-3.6v-2.47c0-1.1.3-1.88 1.95-1.88Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M15.3 2c.35 3 2.02 4.78 4.7 4.97v3.4a8.05 8.05 0 0 1-4.62-1.43v6.82c0 3.42-2.28 6.24-5.7 6.24-3.05 0-5.68-2.12-5.68-5.42 0-3.82 3.2-5.9 6.42-5.12v3.54c-1.5-.48-2.92.42-2.92 1.55 0 1.02.88 1.68 1.92 1.68 1.18 0 2.05-.72 2.05-2.42V2h3.83Z" />
    </svg>
  );
}
