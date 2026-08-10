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
  return (
    <section id="business" className="theme-section-alt px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Made for businesses like yours." />
        <div className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-3">
          {uses.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold theme-card"
            >
              <Icon className="h-4 w-4 theme-accent" aria-hidden />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
