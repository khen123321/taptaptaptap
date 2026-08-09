import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    title: "Choose",
    description: "Choose the NFC product that fits your business.",
  },
  {
    title: "Customize",
    description: "Send us your business details, branding, and destination link.",
  },
  {
    title: "We Program It",
    description: "TapTapTap programs and tests your NFC product.",
  },
  {
    title: "Ready to Tap",
    description: "Place it in your business and let customers tap.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-black px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Tap. Connect. Done." />
        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="relative rounded-lg border border-white/10 bg-[#0A0D0F] p-6">
              {index < steps.length - 1 ? (
                <div className="absolute left-[calc(100%-4px)] top-10 hidden h-px w-5 bg-[#00A8C0]/60 lg:block" />
              ) : null}
              <span className="text-sm font-black text-[#00A8C0]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#9CA6AD]">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
