"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useId } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatPhp } from "@/lib/format";

const email = "taptaptap.official@outlook.com";
const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";

export type OrderContactDetails = {
  productId: string;
  productName: string;
  productType: string;
  packageLabel: "Buy 1" | "Buy 2";
  quantity: number;
  price: number;
};

type OrderContactModalProps = {
  order: OrderContactDetails | null;
  onClose: () => void;
};

export function OrderContactModal({ order, onClose }: OrderContactModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!order) return null;

  const subject = `TapTapTap Order Inquiry — ${order.productName}`;
  const body = `Hi TapTapTap,

I'm interested in ordering:

Product: ${order.productName}
Package: ${order.packageLabel}
Quantity: ${order.quantity}
Price: ${formatPhp(order.price)}

Name:
Business Name:
Contact Number:

Thank you.`;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Modal
      titleId={titleId}
      descriptionId={descriptionId}
      closeLabel="Close order contact modal"
      onClose={onClose}
      className="max-w-2xl p-5 sm:p-7"
    >
      <div className="-mt-6 pr-10 sm:mt-0">
        <p className="text-xs font-bold uppercase tracking-[0.2em] theme-accent">
          Order Inquiry
        </p>
        <h2 id={titleId} className="mt-3 text-2xl font-black tracking-normal theme-text sm:text-3xl">
          Ready to Order?
        </h2>
        <p id={descriptionId} className="mt-4 text-sm leading-6 theme-text-secondary sm:text-base sm:leading-7">
          Choose how you&apos;d like to contact TapTapTap to complete your order.
        </p>
      </div>

      <div className="mt-6 rounded-lg border p-4 theme-subtle">
        <p className="text-xs font-black uppercase tracking-[0.14em] theme-text-muted">
          Order Summary
        </p>
        <h3 className="mt-3 text-xl font-black theme-text">{order.productName}</h3>
        <p className="mt-2 text-sm theme-text-secondary">
          {order.packageLabel} • {formatPhp(order.price)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={mailto}
          data-analytics-event="email_click"
          data-analytics-cta="order-email"
          data-analytics-source="order-contact-modal"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Email Us
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message TapTapTap on Facebook, opens in a new tab"
          data-analytics-event="facebook_click"
          data-analytics-cta="order-facebook"
          data-analytics-source="order-contact-modal"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border theme-border bg-[var(--surface)] px-4 text-sm font-bold theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <MessageCircle className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          Message on Facebook
        </a>
      </div>

      <p className="mt-4 text-sm leading-6 theme-text-muted">
        We&apos;ll help confirm your order details, customization, payment, and delivery.
      </p>
    </Modal>
  );
}
