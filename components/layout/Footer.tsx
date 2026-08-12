import Image from "next/image";
import Link from "next/link";

const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";
const email = "taptaptap.official@outlook.com";

const columns = [
  {
    title: "Products",
    links: [
      { label: "Review Stands", href: "/products" },
      { label: "Social NFC", href: "/products" },
      { label: "Smart Cards", href: "/products" },
      { label: "Custom NFC", href: "/customize" },
    ],
  },
  {
    title: "Business",
    links: [
      { label: "Bulk Orders", href: "/#custom" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "About", href: "/#home" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Shipping", href: "/#contact" },
      { label: "Returns", href: "/#contact" },
      { label: "Privacy", href: "/#contact" },
      { label: "Admin", href: "/admin/login" },
    ],
  },
  {
    title: "Social",
    links: [
      {
        label: "Facebook",
        href: facebookUrl,
        external: true,
        ariaLabel: "Visit TapTapTap on Facebook, opens in a new tab",
      },
      { label: "Instagram", href: "/#contact" },
      { label: "TikTok", href: "/#contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t theme-footer px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="brand-logo brand-logo-footer">
                <Image
                  src="/images/branding/taptaptap-logo-dark.png"
                  alt="TapTapTap"
                  fill
                  sizes="48px"
                  className="brand-logo-image brand-logo-dark"
                />
              </span>
              <span className="text-lg font-bold text-white">TapTapTap</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 theme-footer-muted">
              Smart NFC products made simple.
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-4 inline-block break-all text-sm font-medium text-[#00A8C0] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00A8C0]"
            >
              {email}
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={link.ariaLabel}
                          className="text-sm theme-footer-muted transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00A8C0]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          aria-label={link.ariaLabel}
                          className="text-sm theme-footer-muted transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00A8C0]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm theme-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TapTapTap. All rights reserved.</p>
          <p>Made in the Philippines.</p>
        </div>
      </div>
    </footer>
  );
}
