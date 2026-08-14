"use client";

import { Check, Nfc, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function LiveDemo() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(false), 2400);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <section className="section-spacing theme-section-alt px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="See how simple it is."
          description="A tap can move a customer from your counter to the exact digital action you want."
        />
        <div className="section-content-gap mx-auto max-w-4xl rounded-lg border p-5 theme-card-elevated sm:p-8">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex justify-center">
              <div
                className={`relative h-64 w-36 rounded-[28px] border border-white/15 bg-black p-3 shadow-2xl ${
                  active ? "tap-demo-active" : ""
                }`}
              >
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
                <div className="h-full rounded-[20px] border border-white/10 bg-[#11171B] p-3">
                  <Smartphone className="mx-auto mt-12 h-9 w-9 text-[#00A8C0]" aria-hidden />
                  <p className="mt-4 text-center text-xs font-semibold text-white/80">
                    NFC-ready phone
                  </p>
                  {active ? (
                    <div className="absolute left-2 right-2 top-16 rounded-md border border-[#00A8C0]/40 bg-black/95 p-3 shadow-xl">
                      <p className="text-xs font-bold text-white">Open Google Reviews?</p>
                      <p className="mt-1 text-[11px] text-[#9CA6AD]">TapTapTap Review Stand</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="text-center text-[#00A8C0]">
              <Nfc className="mx-auto h-10 w-10 nfc-pulse" aria-hidden />
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em]">Tap</p>
            </div>

            <div className="flex justify-center">
              <div className="relative h-56 w-44 rounded-lg border border-[#00A8C0]/60 bg-black p-5">
                <Nfc className="mx-auto h-10 w-10 text-[#00A8C0]" aria-hidden />
                <p className="mt-5 text-center text-sm font-black uppercase tracking-[0.18em] text-white">
                  Tap Here
                </p>
                <div className="mt-5 rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-center text-xs text-[#9CA6AD]">Google Reviews</p>
                  <div className="mt-2 flex justify-center gap-1 text-[#00A8C0]">
                    {"★★★★★".split("").map((star, index) => (
                      <span key={`${star}-${index}`}>{star}</span>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 h-6 w-52 -translate-x-1/2 rounded-b-lg border border-t-0 border-white/15 bg-[#11171B]" />
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t theme-border pt-6 sm:flex-row">
            <p className="text-sm theme-text-secondary">
              This visual demo simulates the customer experience.
            </p>
            <button
              type="button"
              onClick={() => setActive(true)}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[#00A8C0] bg-[#00A8C0] px-5 text-sm font-bold text-black transition hover:bg-[#26c3d8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0] sm:w-auto"
            >
              <Check className="h-4 w-4" aria-hidden />
              Try the Tap
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
