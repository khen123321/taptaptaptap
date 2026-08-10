import { BadgeCheck, Boxes, Paintbrush, Settings2, Smartphone } from "lucide-react";

const items = [
  { label: "Ready to Use", icon: BadgeCheck },
  { label: "No App Required", icon: Smartphone },
  { label: "Custom Branding", icon: Paintbrush },
  { label: "Programmed For You", icon: Settings2 },
  { label: "Bulk Orders", icon: Boxes },
];

export function TrustBar() {
  return (
    <section className="border-y theme-border theme-section-alt px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-semibold theme-card"
          >
            <Icon className="h-4 w-4 shrink-0 theme-accent" aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
