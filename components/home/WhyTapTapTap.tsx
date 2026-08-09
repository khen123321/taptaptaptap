import { BadgeCheck, Boxes, Paintbrush, QrCode, RefreshCw, Smartphone } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  {
    title: "Ready to Use",
    description: "We program and test your product before delivery.",
    icon: BadgeCheck,
  },
  {
    title: "No App Required",
    description: "Customers simply tap using a compatible NFC-enabled smartphone.",
    icon: Smartphone,
  },
  {
    title: "QR Backup",
    description: "Add a QR code so customers can still connect without NFC.",
    icon: QrCode,
  },
  {
    title: "Custom Designs",
    description: "Add your logo, colors, messaging, and business branding.",
    icon: Paintbrush,
  },
  {
    title: "Reprogrammable Options",
    description: "Compatible NFC products can be rewritten when your destination changes.",
    icon: RefreshCw,
  },
  {
    title: "Bulk Orders",
    description: "Available for branches, companies, events, and resellers.",
    icon: Boxes,
  },
];

export function WhyTapTapTap() {
  return (
    <section className="bg-black px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Built to work. Simple to use." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-lg border border-white/10 bg-[#0A0D0F] p-6">
              <Icon className="h-7 w-7 text-[#00A8C0]" aria-hidden />
              <h3 className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-white">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#9CA6AD]">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
