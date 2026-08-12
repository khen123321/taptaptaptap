import { Boxes, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/Button";

const email = "taptaptap.official@outlook.com";

export function CustomOrderCTA() {
  return (
    <section id="custom" className="theme-section px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-[#00A8C0]/45 bg-[#00A8C0] text-black">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <h2 className="max-w-3xl text-3xl font-black tracking-normal sm:text-4xl">
              Your business deserves more than a generic NFC card.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-black/75">
              Tell us what you want your customers to open. We&apos;ll handle
              the NFC programming, branding, testing, and setup.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-[430px]:flex-row lg:flex-col">
            <Button
              href="/customize"
              className="border-black bg-black text-white hover:bg-[#11171B]"
              data-analytics-event="shop_click"
              data-analytics-cta="create-custom-nfc"
              data-analytics-source="custom-order-cta"
            >
              <Paintbrush className="h-4 w-4" aria-hidden />
              Create Custom NFC
            </Button>
            <Button
              href={`mailto:${email}`}
              variant="secondary"
              className="border-black/20 bg-white/20 text-black hover:border-black/40 hover:bg-white/35"
              data-analytics-event="email_click"
              data-analytics-cta="request-bulk-order"
              data-analytics-source="custom-order-cta"
            >
              <Boxes className="h-4 w-4" aria-hidden />
              Request Bulk Order
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
