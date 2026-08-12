import { Mail, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

const email = "taptaptap.official@outlook.com";
const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";

export function FinalCTA() {
  return (
    <section className="theme-section px-4 pb-20 pt-10 sm:px-6 sm:pb-24 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-black tracking-normal theme-text sm:text-5xl">
          Ready to make every tap count?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 theme-text-secondary">
          Connect your customers faster with TapTapTap.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 min-[430px]:flex-row">
          <Button href="/products">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Shop NFC Products
          </Button>
          <Button
            href="#contact"
            variant="secondary"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Contact Us
          </Button>
        </div>
        <div className="mx-auto mt-7 max-w-2xl rounded-lg border p-5 text-sm theme-card">
          <p className="font-semibold theme-text">Questions or custom orders?</p>
          <p className="mt-2">
            Email us at{" "}
            <a
              href={`mailto:${email}`}
              className="break-all font-semibold theme-accent transition hover:text-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              {email}
            </a>
          </p>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message TapTapTap on Facebook, opens in a new tab"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 font-semibold theme-text theme-border transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <MessageCircle className="h-4 w-4 theme-accent" aria-hidden />
            Message us on Facebook
          </a>
        </div>
      </div>
    </section>
  );
}
