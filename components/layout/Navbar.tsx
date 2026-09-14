"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ResellerCTA } from "@/components/home/ResellerCTA";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/#home", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#business", label: "For Business" },
  { href: "/#faq", label: "FAQ" },
];

const mobileLinks = [...links, { href: "/#contact", label: "Contact" }];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition ${
        scrolled || open
          ? "border-b theme-header backdrop-blur-md"
          : "theme-header-idle"
      }`}
    >
      <nav
        className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          href="/#home"
          className="flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00A8C0]"
          onClick={() => setOpen(false)}
        >
          <span className="brand-logo brand-logo-theme">
            <Image
              src="/images/branding/taptaptap-logo-light.jpg"
              alt="TapTapTap"
              fill
              sizes="48px"
              priority
              className="brand-logo-image brand-logo-light"
            />
            <Image
              src="/images/branding/taptaptap-logo-dark.jpg"
              alt="TapTapTap"
              fill
              sizes="48px"
              priority
              className="brand-logo-image brand-logo-dark"
            />
          </span>
          <span className="ml-2 text-base font-bold theme-text sm:ml-3">TapTapTap</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium theme-text-secondary transition hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            href="/#contact"
            variant="ghost"
            className="min-h-11 px-4"
            data-analytics-event="contact_click"
            data-analytics-cta="navbar-contact"
            data-analytics-source="navbar"
          >
            Contact
          </Button>
          <ThemeToggle />
          <Button
            href="/products"
            className="min-h-11 px-4"
            data-analytics-event="shop_click"
            data-analytics-cta="navbar-shop-now"
            data-analytics-source="navbar"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Shop Now
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border theme-border theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open ? (
        <div
          className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t theme-border bg-[var(--surface)] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_24px_70px_rgba(0,0,0,0.18)] lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium theme-text-secondary transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between rounded-md border theme-border bg-[var(--surface-secondary)] px-3 py-3">
              <span className="text-sm font-semibold theme-text">Theme</span>
              <ThemeToggle onToggle={() => setOpen(false)} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <Button
                href="/products"
                className="hero-cta-primary w-full"
                onClick={() => setOpen(false)}
                data-analytics-event="shop_click"
                data-analytics-cta="mobile-navbar-shop-now"
                data-analytics-source="navbar"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                Get Your TapTapTap
              </Button>
              <ResellerCTA
                analyticsSource="navbar"
                className="hero-cta-tertiary w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
