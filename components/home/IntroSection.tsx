import { ArrowDown, MousePointer2, Nfc, Smartphone } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const destinations = ["Google Review", "Instagram", "Menu", "Website"];

export function IntroSection() {
  return (
    <section className="theme-section px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="One tap can do more."
          description="TapTapTap creates simple NFC products that connect physical spaces to digital experiences."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <ProcessCard icon={MousePointer2} title="TAP" />
          <ArrowDown className="mx-auto h-5 w-5 theme-accent lg:rotate-[-90deg]" aria-hidden />
          <ProcessCard icon={Nfc} title="Phone detects NFC" />
          <ArrowDown className="mx-auto h-5 w-5 theme-accent lg:rotate-[-90deg]" aria-hidden />
          <ProcessCard icon={Smartphone} title="Destination opens" />
        </div>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          {destinations.map((destination) => (
            <span
              key={destination}
              className="rounded-md border px-4 py-2 text-sm font-medium theme-accent-bg"
            >
              {destination}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessCard({
  icon: Icon,
  title,
}: {
  icon: typeof MousePointer2;
  title: string;
}) {
  return (
    <div className="rounded-lg border p-6 text-center theme-card">
      <Icon className="mx-auto h-8 w-8 theme-accent" aria-hidden />
      <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] theme-text">
        {title}
      </p>
    </div>
  );
}
