import Image from "next/image";
import { CheckCircle2, Link2, Nfc, Settings2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

const reassurance = [
  { label: "No App Needed", icon: CheckCircle2 },
  { label: "Just Tap and Open", icon: Settings2 },
  { label: "Works with your business link", icon: Link2 },
];

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden theme-section px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8 lg:pt-32"
    >
      <div className="absolute inset-0 theme-hero-glow" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] theme-accent-bg">
            <Nfc className="h-4 w-4" aria-hidden />
            Smart NFC Solutions
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-normal theme-text sm:text-6xl lg:text-7xl">
            One <span className="theme-accent">Tap</span>.
            <br />
            Instant Connection.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 theme-text-secondary sm:text-xl">
            Let customers instantly review, follow, order, or connect with your
            business — with just one tap.
          </p>
          <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
            <Button
              href="/products"
              className="w-full min-[430px]:w-auto"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Get Your TapTapTap
            </Button>
            <Button
              href="/customize"
              variant="secondary"
              className="w-full min-[430px]:w-auto"
            >
              Create Custom Design
            </Button>
          </div>
          <div className="mt-7 flex flex-col gap-3 text-sm theme-text-secondary sm:flex-row sm:flex-wrap">
            {reassurance.map(({ label, icon: Icon }) => (
              <span key={label} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 theme-accent" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[620px]">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00A8C0]/20 bg-[#00A8C0]/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-lg border p-2 theme-media-frame">
            <div className="relative aspect-[1672/941] overflow-hidden rounded-md bg-black">
              <Image
                src="/images/hero/taptaptap-hero-phone-nfc.png"
                alt="Hand holding a smartphone near a TapTapTap NFC sign"
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-contain"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-[#00A8C0]/15" />
          </div>
        </div>
      </div>
    </section>
  );
}
