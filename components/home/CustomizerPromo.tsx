import { Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CustomizerPromo() {
  return (
    <section className="theme-section-alt px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-lg border p-6 theme-card-elevated sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] theme-accent">
            Your Design. Your NFC.
          </p>
          <h2 className="text-3xl font-black tracking-normal theme-text sm:text-4xl">
            Upload your own artwork and preview it before ordering.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 theme-text-secondary">
            Try a realistic TapTapTap table sign mockup before sending your
            design for production.
          </p>
        </div>
        <Button href="/customize" className="w-full lg:w-auto">
          <Palette className="h-4 w-4" aria-hidden />
          Try the Customizer
        </Button>
      </div>
    </section>
  );
}
