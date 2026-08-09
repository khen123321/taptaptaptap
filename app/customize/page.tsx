import type { Metadata } from "next";
import { CustomizerLayout } from "@/components/customize/CustomizerLayout";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Customize NFC Product | TapTapTap",
  description:
    "Upload your artwork and preview how it could look on a custom TapTapTap NFC table sign.",
};

export default function CustomizePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="px-4 pb-18 pt-28 sm:px-6 sm:pb-24 lg:px-8 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#00A8C0]">
              Create Your Own
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              See your design before you order.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#B7C0C7]">
              Upload your artwork and preview how it could look on your
              TapTapTap NFC product.
            </p>
            <p className="mt-4 rounded-md border border-white/10 bg-[#0A0D0F] px-4 py-3 text-sm leading-6 text-[#9CA6AD]">
              Preview is for visualization purposes. Final print placement may
              be adjusted before production.
            </p>
          </div>

          <div className="mt-10">
            <CustomizerLayout />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
