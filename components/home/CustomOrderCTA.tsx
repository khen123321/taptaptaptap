import { Boxes, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/Button";

const email = "taptaptap.official@outlook.com";

export function CustomOrderCTA() {
  return (
    <section id="custom" className="section-spacing theme-section px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-[var(--cta-border)] bg-[var(--cta-bg)] text-[var(--cta-text)] shadow-[var(--cta-shadow)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              Your Design. Your NFC.
            </p>
            <h2 className="max-w-3xl text-3xl font-black tracking-normal sm:text-4xl">
              Make every <span className="text-[var(--accent)]">tap work</span> for your business.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--cta-muted)]">
              Upload your own artwork or let us help with the design. Choose
              what customers open, and we&apos;ll set up, program, and test your
              NFC product for you.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-[430px]:flex-row lg:flex-col">
            <Button
              href="/customize"
              className="border-[var(--accent)] bg-[var(--accent)] text-[var(--button-primary-text)] hover:bg-[var(--accent-hover)]"
              data-analytics-event="shop_click"
              data-analytics-cta="create-custom-nfc"
              data-analytics-source="custom-order-cta"
            >
              <Paintbrush className="h-4 w-4" aria-hidden />
              Create My NFC
            </Button>
            <Button
              href={`mailto:${email}`}
              variant="secondary"
              className="border-[var(--cta-border)] bg-[var(--cta-secondary)] text-[var(--cta-text)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              data-analytics-event="email_click"
              data-analytics-cta="request-bulk-order"
              data-analytics-source="custom-order-cta"
            >
              <Boxes className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              Order in Bulk
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
