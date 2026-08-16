"use client";

import { Mail, MessageCircle, Store } from "lucide-react";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";

const email = "taptaptap.official@outlook.com";
const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";
const resellerMailto = `mailto:${email}?subject=${encodeURIComponent(
  "TapTapTap Reseller Inquiry",
)}&body=${encodeURIComponent(`Hello TapTapTap,

I'm interested in becoming a reseller.

Business name:
Location:
Contact number:

Thank you.`)}`;

type ResellerCTAProps = {
  analyticsSource?: string;
  className?: string;
};

export function ResellerCTA({
  analyticsSource = "custom-order-cta",
  className = "",
}: ResellerCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        data-analytics-event="reseller_modal_open"
        data-analytics-cta="become-a-reseller"
        data-analytics-source={analyticsSource}
        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--cta-border)] bg-[var(--cta-secondary)] px-5 text-sm font-semibold text-[var(--cta-text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
      >
        <Store className="h-4 w-4 text-[var(--accent)]" aria-hidden />
        Become a Reseller
      </button>

      {isOpen ? (
        <Modal
          titleId={titleId}
          descriptionId={descriptionId}
          closeLabel="Close reseller inquiry modal"
          onClose={() => setIsOpen(false)}
          className="max-w-3xl p-5 sm:p-7"
        >
          <div className="pr-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] theme-accent">
              Reseller Program
            </p>
            <h2 id={titleId} className="mt-3 text-2xl font-black tracking-normal theme-text sm:text-3xl">
              Become a TapTapTap Reseller
            </h2>
            <p id={descriptionId} className="mt-4 max-w-2xl text-sm leading-6 theme-text-secondary sm:text-base sm:leading-7">
              Interested in offering TapTapTap NFC products to your customers?
              Get in touch with us and we&apos;ll help you with reseller
              inquiries, pricing, and next steps.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ContactOption
              icon={<Mail className="h-5 w-5" aria-hidden />}
              title="Email Us"
              description="Send us your reseller inquiry by email."
              href={resellerMailto}
              buttonLabel="Email Us"
              analyticsEvent="reseller_email_click"
              analyticsCta="reseller-email"
            />
            <ContactOption
              icon={<MessageCircle className="h-5 w-5" aria-hidden />}
              title="Chat on Facebook"
              description="Message us directly through our Facebook Page."
              href={facebookUrl}
              buttonLabel="Chat on Facebook"
              analyticsEvent="reseller_facebook_click"
              analyticsCta="reseller-facebook"
              external
            />
          </div>
        </Modal>
      ) : null}
    </>
  );
}

type ContactOptionProps = {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  analyticsEvent: string;
  analyticsCta: string;
  external?: boolean;
};

function ContactOption({
  icon,
  title,
  description,
  href,
  buttonLabel,
  analyticsEvent,
  analyticsCta,
  external = false,
}: ContactOptionProps) {
  return (
    <div className="flex flex-col rounded-lg border p-4 theme-subtle sm:p-5">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-black theme-text">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 theme-text-secondary">
        {description}
      </p>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-label={external ? `${buttonLabel}, opens in a new tab` : undefined}
        data-analytics-event={analyticsEvent}
        data-analytics-cta={analyticsCta}
        data-analytics-source="reseller-modal"
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {buttonLabel}
      </a>
    </div>
  );
}
