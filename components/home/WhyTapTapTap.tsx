import { BadgeCheck, Boxes, Paintbrush, RefreshCw, Settings2, Smartphone } from "lucide-react";
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
    title: "Programmed For You",
    description: "We configure and test your NFC product before delivery.",
    icon: Settings2,
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
    <section className="section-spacing theme-section px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Built to work. Simple to use." />
        <div className="section-content-gap grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-lg border p-6 theme-card">
              <Icon className="h-7 w-7 theme-accent" aria-hidden />
              <h3 className="mt-5 text-sm font-black uppercase tracking-[0.16em] theme-text">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 theme-text-secondary">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
