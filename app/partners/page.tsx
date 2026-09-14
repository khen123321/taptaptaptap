import type { Metadata } from "next";
import { PartnersLogoShowcase } from "@/components/partners/PartnersLogoShowcase";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getPublicBusinessLogos } from "@/lib/business-logos";

export const metadata: Metadata = {
  title: "Partners | TapTapTap",
  description: "Businesses using TapTapTap NFC products.",
};

export default async function PartnersPage() {
  const logos = await getPublicBusinessLogos();

  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <main className="theme-section px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] theme-accent">
              Partners
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-normal theme-text sm:text-5xl lg:text-6xl">
              Trusted by Businesses
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 theme-text-secondary sm:mt-5 sm:text-lg sm:leading-8">
              Businesses using TapTapTap
            </p>
          </div>

          <div className="mt-10 sm:mt-12">
            <PartnersLogoShowcase logos={logos} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
