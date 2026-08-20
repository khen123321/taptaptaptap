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
    <div className="min-h-screen theme-page">
      <Navbar />
      <main className="theme-section px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] theme-accent">
              Create Your Own
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-normal theme-text sm:text-5xl lg:text-6xl">
              See your design before you order.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 theme-text-secondary sm:mt-5 sm:text-lg sm:leading-8">
              Upload your artwork and preview how it could look on your
              TapTapTap NFC product.
            </p>
            <p className="mt-4 rounded-md border px-4 py-3 text-sm leading-6 theme-subtle theme-text-secondary">
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
