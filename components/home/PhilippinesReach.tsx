import { MapPin } from "lucide-react";
import { getPublicMapMarkers } from "@/lib/map-locations";
import { PhilippinesMap } from "@/components/home/PhilippinesMap";

export async function PhilippinesReach() {
  const markers = await getPublicMapMarkers();
  const totalCities = markers.length;
  const totalLocations = markers.reduce((sum, marker) => sum + marker.count, 0);

  return (
    <section className="section-spacing theme-section px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] theme-accent">
              OUR REACH
            </p>
            <h2 className="text-3xl font-black tracking-normal theme-text sm:text-4xl">
              TapTapTap Across the Philippines
            </h2>
            <p className="mt-4 text-base leading-7 theme-text-secondary sm:text-lg">
              See the cities where TapTapTap is already making connections.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-md">
              <ReachMetric label="Cities Reached" value={String(totalCities)} />
              <ReachMetric label="Total Locations" value={String(totalLocations)} />
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 theme-text-muted">
              <MapPin className="mt-1 h-4 w-4 shrink-0 theme-accent" aria-hidden />
              Locations are displayed by city or municipality only. Exact customer addresses are never shown.
            </p>
          </div>
          <div className="lg:justify-self-center">
            <PhilippinesMap markers={markers} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ReachMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border theme-card p-4">
      <p className="text-2xl font-black theme-text">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] theme-text-muted">{label}</p>
    </div>
  );
}
