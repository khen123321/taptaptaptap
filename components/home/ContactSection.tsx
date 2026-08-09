import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

const email = "taptaptap.official@outlook.com";
const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";

export function ContactSection() {
  return (
    <section id="contact" className="bg-[#050607] px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-white/10 bg-[#0A0D0F] p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-10">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#00A8C0]">
            Contact TapTapTap
          </p>
          <h2 className="text-3xl font-black tracking-normal text-white sm:text-4xl">
            Let&apos;s build something worth tapping.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA6AD]">
            Need a custom NFC product, bulk order, or have a question? Get in
            touch with TapTapTap.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-md border border-white/10 bg-black/35 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#00A8C0]" aria-hidden />
              <p className="text-sm font-bold text-white">Email</p>
            </div>
            <a
              href={`mailto:${email}`}
              className="mt-2 block break-all text-sm text-[#9CA6AD] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00A8C0]"
            >
              {email}
            </a>
          </div>

          <div className="rounded-md border border-white/10 bg-black/35 p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-[#00A8C0]" aria-hidden />
              <p className="text-sm font-bold text-white">Facebook</p>
            </div>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message TapTapTap on Facebook, opens in a new tab"
              className="mt-2 block text-sm text-[#9CA6AD] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00A8C0]"
            >
              Message TapTapTap
            </a>
          </div>

          <div className="grid gap-3 min-[430px]:grid-cols-2">
            <Button href={`mailto:${email}`}>
              <Mail className="h-4 w-4" aria-hidden />
              Email Us
            </Button>
            <Button
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message TapTapTap on Facebook, opens in a new tab"
              variant="secondary"
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
