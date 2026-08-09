import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

const includedFeatures = [
  "Free nationwide shipping",
  "Facebook Page integration",
  "Google Review integration",
  "NFC programming",
  "Business profile setup",
  "Setup assistance",
  "No monthly subscription",
];

const bundles = [
  {
    name: "1 TapTapTap NFC Sign",
    price: "₱899",
    cta: "Order 1 Sign",
    href: "/customize",
    featured: false,
  },
  {
    name: "2 TapTapTap NFC Signs",
    price: "₱1,499",
    savings: "Save ₱299",
    cta: "Get 2 Signs",
    href: "/customize",
    featured: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-black px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Simple pricing. Ready to tap."
          description="Choose the package that fits your business. Every TapTapTap NFC sign comes programmed, tested, and ready to use."
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2">
          {bundles.map((bundle) => (
            <article
              key={bundle.name}
              className={`relative rounded-lg border bg-[#0A0D0F] p-6 transition sm:p-8 ${
                bundle.featured
                  ? "border-[#00A8C0]/65 shadow-[0_0_32px_rgba(0,168,192,0.12)]"
                  : "border-white/10"
              }`}
            >
              {bundle.featured ? (
                <div className="absolute right-5 top-5 rounded-md border border-[#00A8C0]/45 bg-[#00A8C0] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-black">
                  Best Value
                </div>
              ) : null}

              <div className="pr-28 sm:pr-32">
                <h3 className="text-2xl font-black tracking-normal text-white">
                  {bundle.name}
                </h3>
                {bundle.savings ? (
                  <p className="mt-3 inline-flex rounded-md border border-[#00A8C0]/30 bg-[#00A8C0]/10 px-3 py-1 text-sm font-bold text-[#00A8C0]">
                    {bundle.savings}
                  </p>
                ) : null}
              </div>

              <p className="mt-7 text-5xl font-black tracking-normal text-white">
                {bundle.price}
              </p>

              <ul className="mt-7 space-y-3">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-[#D4D9DD]">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#00A8C0]"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                href={bundle.href}
                className="mt-8 w-full"
                variant={bundle.featured ? "primary" : "secondary"}
              >
                {bundle.cta}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
