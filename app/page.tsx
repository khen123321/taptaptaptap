import { BusinessUses } from "@/components/home/BusinessUses";
import { ContactSection } from "@/components/home/ContactSection";
import { CustomOrderCTA } from "@/components/home/CustomOrderCTA";
import { FAQ } from "@/components/home/FAQ";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { IntroSection } from "@/components/home/IntroSection";
import { LiveDemo } from "@/components/home/LiveDemo";
import { ProductsSection } from "@/components/home/ProductsSection";
import { TrustBar } from "@/components/home/TrustBar";
import { WhyTapTapTap } from "@/components/home/WhyTapTapTap";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <IntroSection />
        <ProductsSection />
        <HowItWorks />
        <LiveDemo />
        <WhyTapTapTap />
        <BusinessUses />
        <CustomOrderCTA />
        <FAQ />
        <FinalCTA />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
