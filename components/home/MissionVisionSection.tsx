import { Globe2, Target } from "lucide-react";

const statements = [
  {
    label: "Mission",
    icon: Target,
    text: "To help businesses grow by making customer interactions faster, easier, and smarter through simple tap-to-connect solutions.",
  },
  {
    label: "Vision",
    icon: Globe2,
    text: "To make TapTapTap an everyday business tool across the Philippines, helping businesses connect with customers, improve their experience, and create more opportunities for growth.",
  },
];

export function MissionVisionSection() {
  return (
    <section className="section-spacing theme-section-alt px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] theme-accent">
            OUR PURPOSE
          </p>
          <h2 className="text-3xl font-black tracking-normal theme-text sm:text-4xl lg:text-5xl">
            Built to Make Business Connections Simpler
          </h2>
          <p className="mt-4 text-base leading-7 theme-text-secondary sm:text-lg">
            TapTapTap helps businesses create faster, easier, and more meaningful
            customer interactions through simple tap-to-connect technology.
          </p>
        </div>

        <div className="section-content-gap relative isolate mx-auto max-w-6xl">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--accent)]/45 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--accent)]/35 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_18%,rgba(0,168,192,0.12),transparent_30%),radial-gradient(circle_at_78%_82%,rgba(0,168,192,0.1),transparent_32%)]" />

          <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-8">
            {statements.map(({ label, icon: Icon, text }) => (
              <article
                key={label}
                className="group relative overflow-hidden rounded-2xl border theme-border bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] p-6 transition duration-200 hover:-translate-y-1 hover:border-[var(--accent)] sm:p-8 lg:p-10"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70" />
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--accent-soft)] blur-3xl transition duration-200 group-hover:scale-110" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--accent-soft)]">
                      <Icon className="h-6 w-6 theme-accent" aria-hidden />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--accent)]/50 to-transparent" aria-hidden />
                  </div>

                  <h3 className="mt-8 text-xs font-black uppercase tracking-[0.22em] theme-accent">
                    {label}
                  </h3>
                  <p className="mt-4 max-w-xl text-xl font-semibold leading-8 theme-text sm:text-2xl sm:leading-9">
                    {text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
