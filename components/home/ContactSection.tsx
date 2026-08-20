import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

const email = "taptaptap.official@outlook.com";
const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";

export function ContactSection() {
  return (
    <section id="contact" className="section-spacing theme-section-alt px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-lg border p-5 theme-card-elevated sm:gap-8 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-10">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] theme-accent">
            Contact TapTapTap
          </p>
          <h2 className="text-2xl font-black tracking-normal theme-text sm:text-4xl">
            Let&apos;s build something worth tapping.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 theme-text-secondary">
            Need a custom NFC product, bulk order, or have a question? Get in
            touch with TapTapTap.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-md border p-4 theme-subtle">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 theme-accent" aria-hidden />
              <p className="text-sm font-bold theme-text">Email</p>
            </div>
            <a
              href={`mailto:${email}`}
              data-analytics-event="email_click"
              data-analytics-cta="contact-email-text"
              data-analytics-source="contact-section"
              className="mt-2 block break-all text-sm theme-text-secondary transition hover:text-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              {email}
            </a>
          </div>

          <div className="rounded-md border p-4 theme-subtle">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 theme-accent" aria-hidden />
              <p className="text-sm font-bold theme-text">Facebook</p>
            </div>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message TapTapTap on Facebook, opens in a new tab"
              data-analytics-event="facebook_click"
              data-analytics-cta="contact-facebook-text"
              data-analytics-source="contact-section"
              className="mt-2 block text-sm theme-text-secondary transition hover:text-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              Message TapTapTap
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              href={`mailto:${email}`}
              data-analytics-event="email_click"
              data-analytics-cta="email-us"
              data-analytics-source="contact-section"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Email Us
            </Button>
            <Button
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message TapTapTap on Facebook, opens in a new tab"
              variant="secondary"
              data-analytics-event="facebook_click"
              data-analytics-cta="message-on-facebook"
              data-analytics-source="contact-section"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Message on Facebook
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
