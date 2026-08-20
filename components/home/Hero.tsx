import Image from "next/image";
import { CheckCircle2, Link2, Nfc, Settings2, ShoppingBag } from "lucide-react";
import { ResellerCTA } from "@/components/home/ResellerCTA";
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
      className="relative overflow-hidden theme-section px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 lg:pt-32"
    >
      <div className="absolute inset-0 theme-hero-glow" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[1fr_0.92fr] lg:gap-12">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] theme-accent-bg sm:mb-5 sm:text-xs sm:tracking-[0.22em]">
            <Nfc className="h-4 w-4" aria-hidden />
            Smart NFC Solutions
          </p>
          <h1 className="max-w-3xl text-[clamp(3rem,14vw,3.625rem)] font-black leading-[1.02] tracking-normal theme-text sm:text-6xl lg:text-7xl">
            One <span className="theme-accent">Tap</span>.
            <br />
            Instant Connection.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 theme-text-secondary sm:mt-6 sm:text-xl sm:leading-8">
            Let customers instantly review, follow, order, or connect with your
            business — with just one tap.
          </p>
          <div className="mt-7 flex max-w-xl flex-col gap-3 sm:mt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                href="/products"
                className="hero-cta-primary w-full sm:w-auto"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                Get Your TapTapTap
              </Button>
              <Button
                href="/customize"
                variant="secondary"
                className="custom-design-cta w-full sm:w-auto"
              >
                Create Custom Design
              </Button>
            </div>
            <ResellerCTA analyticsSource="hero" className="hero-cta-tertiary w-full sm:w-auto sm:self-start" />
          </div>
          <div className="mt-6 grid gap-2 text-sm theme-text-secondary min-[430px]:grid-cols-2 sm:mt-7 sm:flex sm:flex-wrap sm:gap-3">
            {reassurance.map(({ label, icon: Icon }) => (
              <span key={label} className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 theme-border bg-[var(--surface-secondary)] sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                <Icon className="h-4 w-4 theme-accent" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:max-w-[620px]">
          <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00A8C0]/20 bg-[#00A8C0]/10 blur-3xl sm:h-72 sm:w-72" />
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
