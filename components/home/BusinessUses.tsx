import {
  Building2,
  CalendarDays,
  Dumbbell,
  Hotel,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Store,
  Utensils,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const uses = [
  { label: "Restaurants & Cafes", icon: Utensils },
  { label: "Hotels & Resorts", icon: Hotel },
  { label: "Salons & Barbers", icon: Scissors },
  { label: "Clinics", icon: Stethoscope },
  { label: "Retail Stores", icon: Store },
  { label: "Gyms", icon: Dumbbell },
  { label: "Real Estate", icon: Building2 },
  { label: "Events", icon: CalendarDays },
  { label: "Corporate Offices", icon: ShoppingBag },
];

export function BusinessUses() {
  const loopItems = [...uses, ...uses];

  return (
    <section id="business" className="section-spacing theme-section-alt px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Made for businesses like yours." />
        <div className="business-marquee section-content-gap mx-auto max-w-7xl overflow-hidden">
          <div
            aria-label="Business types carousel"
            className="business-marquee-track flex w-max gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {loopItems.map(({ label, icon: Icon }, index) => (
              <div
                key={`${label}-${index}`}
                className="inline-flex min-h-14 w-[190px] shrink-0 items-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold theme-card sm:w-[220px] lg:w-[250px]"
                aria-hidden={index >= uses.length}
              >
                <Icon className="h-4 w-4 shrink-0 theme-accent" aria-hidden />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
