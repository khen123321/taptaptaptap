"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Brush,
  ChevronRight,
  Globe2,
  Handshake,
  Mail,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

const email = "taptaptap.official@outlook.com";
const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";

type ConnectVariant = "main" | "founders";
type MainGroupKey = "contact";

type ConnectAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  external?: boolean;
  mail?: boolean;
  featured?: boolean;
};

type ConnectGroup = {
  key: MainGroupKey;
  label: string;
  description: string;
  icon: LucideIcon;
  items: ConnectAction[];
};

type Highlight = {
  label: string;
  icon: LucideIcon;
};

type ConnectContent = {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  actions?: ConnectAction[];
  groups?: ConnectGroup[];
  highlights: Highlight[];
};

const mainGroups: ConnectGroup[] = [
  {
    key: "contact",
    label: "Contact TapTapTap",
    description: "Official email and Facebook contact options.",
    icon: MessageCircle,
    items: [
      {
        href: `mailto:${email}?subject=${encodeURIComponent("TapTapTap Inquiry")}`,
        label: "Email",
        description: email,
        icon: Mail,
        mail: true,
      },
      {
        href: facebookUrl,
        label: "Facebook",
        description: "Message TapTapTap on the official Facebook page.",
        icon: MessageCircle,
        external: true,
      },
    ],
  },
];

const founderActions: ConnectAction[] = [
  {
    href: `mailto:${email}?subject=${encodeURIComponent("TapTapTap Founders Inquiry")}`,
    label: "Email the Team",
    description: "Ask about partnerships, custom work, or bulk orders.",
    icon: Mail,
    mail: true,
    featured: true,
  },
  {
    href: facebookUrl,
    label: "Message on Facebook",
    description: "Contact TapTapTap through the official page.",
    icon: MessageCircle,
    external: true,
  },
  {
    href: "/customize",
    label: "Customize Yours",
    description: "Create a custom NFC sign design.",
    icon: Brush,
  },
  {
    href: "/connect",
    label: "TapTapTap Connect",
    description: "Return to the quick access hub.",
    icon: BadgeCheck,
  },
  {
    href: "/products",
    label: "Shop Products",
    description: "View TapTapTap NFC product options.",
    icon: ShoppingBag,
  },
  {
    href: "/",
    label: "Main Website",
    description: "Open the complete TapTapTap website.",
    icon: Globe2,
  },
];

const mainHighlights: Highlight[] = [
  { label: "Google Reviews", icon: BadgeCheck },
  { label: "Facebook Follow", icon: ThumbsUp },
  { label: "Custom Links", icon: Sparkles },
  { label: "Business Profiles", icon: PackageCheck },
];

const founderHighlights: Highlight[] = [
  { label: "Bulk Orders", icon: PackageCheck },
  { label: "Reseller Inquiries", icon: Handshake },
  { label: "Custom NFC Ideas", icon: Brush },
  { label: "Business Questions", icon: MessageCircle },
];

const copy: Record<ConnectVariant, ConnectContent> = {
  main: {
    eyebrow: "Official TapTapTap NFC destination",
    title: "TapTapTap Connect",
    description:
      "Quick access to TapTapTap products, custom designs, contact details, and business links in one tap.",
    note: "Built for customers who discover TapTapTap through an NFC card or QR code.",
    groups: mainGroups,
    highlights: mainHighlights,
  },
  founders: {
    eyebrow: "TapTapTap founders",
    title: "Connect with TapTapTap",
    description:
      "For partnerships, reseller inquiries, custom NFC projects, and business questions.",
    note: "Use the official TapTapTap channels below so your inquiry reaches the right place.",
    actions: founderActions,
    highlights: founderHighlights,
  },
};

export function ConnectHub({ variant }: { variant: ConnectVariant }) {
  const content = copy[variant];
  const [activeGroupKey, setActiveGroupKey] = useState<MainGroupKey | null>(null);
  const activeGroup =
    variant === "main"
      ? content.groups?.find((group) => group.key === activeGroupKey) ?? null
      : null;

  useEffect(() => {
    if (!activeGroup) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveGroupKey(null);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeGroup]);

  return (
    <main className="theme-page relative min-h-dvh overflow-hidden px-4 py-3 sm:px-6 sm:py-5">
      <div className="connect-ambient" aria-hidden>
        <span className="connect-ambient-layer connect-ambient-layer-one" />
        <span className="connect-ambient-layer connect-ambient-layer-two" />
        <span className="connect-ambient-layer connect-ambient-layer-three" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between gap-3 py-1">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            aria-label="Go to TapTapTap homepage"
          >
            <span className="brand-logo brand-logo-theme h-11 w-11 sm:h-12 sm:w-12">
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
            <span className="text-base font-bold theme-text">TapTapTap</span>
          </Link>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] theme-text-secondary">
            Connect
          </span>
        </header>

        <section className="mt-2 rounded-[1.75rem] border theme-border bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:mt-3 sm:p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-18 w-18 overflow-hidden rounded-2xl border theme-border bg-white shadow-[0_18px_42px_rgba(0,168,192,0.16)] sm:h-20 sm:w-20">
              <Image
                src="/images/branding/taptaptap-logo-light.jpg"
                alt=""
                fill
                sizes="80px"
                priority
                className="object-contain p-2"
              />
            </div>
            <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.24em] theme-accent">
              {content.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight theme-text sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 theme-text-secondary sm:text-base">
              {content.description}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {content.highlights.map((highlight) => (
              <div
                key={highlight.label}
                className="flex min-h-12 items-center gap-2 rounded-2xl border theme-border bg-[var(--surface-secondary)] px-3 py-2"
              >
                <highlight.icon
                  className="h-4 w-4 shrink-0 text-[var(--accent)]"
                  aria-hidden
                />
                <span className="text-xs font-bold leading-4 theme-text">
                  {highlight.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-4 grid gap-3" aria-label="TapTapTap Connect actions">
          {variant === "main" ? (
            <>
              <MainActionLink
                href="/"
                label="Website & Services"
                description="Open the main TapTapTap website."
                icon={Globe2}
              />
              {content.groups?.map((group) => (
                <GroupButton
                  key={group.key}
                  group={group}
                  onClick={() => setActiveGroupKey(group.key)}
                />
              ))}
              <ActionLink
                action={{
                  href: "/connect/team",
                  label: "Meet the Team",
                  description: "Meet the people helping build TapTapTap.",
                  icon: Users,
                  featured: true,
                }}
              />
            </>
          ) : (
            content.actions?.map((action) => (
              <ActionLink key={action.label} action={action} />
            ))
          )}
        </nav>

        <p className="mx-auto mt-5 max-w-sm text-center text-xs leading-5 theme-text-muted">
          {content.note}
        </p>

        <footer className="mt-auto pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-8 text-center text-xs theme-text-muted">
          <p>Official TapTapTap public connect page.</p>
        </footer>
      </div>

      {activeGroup ? (
        <GroupSheet group={activeGroup} onClose={() => setActiveGroupKey(null)} />
      ) : null}
    </main>
  );
}

function MainActionLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition theme-border bg-[var(--surface)] theme-text hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 theme-text-secondary">
          {description}
        </span>
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-[var(--accent)] transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

function GroupButton({
  group,
  onClick,
}: {
  group: ConnectGroup;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition theme-border bg-[var(--surface)] theme-text hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <group.icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{group.label}</span>
        <span className="mt-0.5 block text-xs leading-5 theme-text-secondary">
          {group.description}
        </span>
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-[var(--accent)] transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}

function GroupSheet({
  group,
  onClose,
}: {
  group: ConnectGroup;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-3 pb-3 pt-16 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-group-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-[1.75rem] border theme-border bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] theme-accent">
              TapTapTap Connect
            </p>
            <h2
              id="connect-group-title"
              className="mt-2 text-xl font-black tracking-tight theme-text"
            >
              {group.label}
            </h2>
            <p className="mt-1 text-sm leading-6 theme-text-secondary">
              {group.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border theme-border bg-[var(--surface-secondary)] theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label={`Close ${group.label}`}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {group.items.map((action) => (
            <ActionLink key={action.label} action={action} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionLink({
  action,
  compact = false,
}: {
  action: ConnectAction;
  compact?: boolean;
}) {
  const className = `group flex ${
    compact ? "min-h-[60px]" : "min-h-[68px]"
  } items-center gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
    action.featured
      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--button-primary-text)] shadow-[0_18px_35px_rgba(0,168,192,0.22)] hover:bg-[var(--accent-hover)]"
      : "theme-border bg-[var(--surface)] theme-text hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
  }`;

  const content = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          action.featured
            ? "bg-white/20 text-[var(--button-primary-text)]"
            : "bg-[var(--accent-soft)] text-[var(--accent)]"
        }`}
      >
        <action.icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{action.label}</span>
        <span
          className={`mt-0.5 block text-xs leading-5 ${
            action.featured ? "text-black/70" : "theme-text-secondary"
          }`}
        >
          {action.description}
        </span>
      </span>
      <ArrowUpRight
        className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
          action.featured ? "text-[var(--button-primary-text)]" : "text-[var(--accent)]"
        }`}
        aria-hidden
      />
    </>
  );

  if (action.external) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={`${action.label}, opens Facebook in a new tab`}
      >
        {content}
      </a>
    );
  }

  if (action.mail) {
    return (
      <a href={action.href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={action.href} className={className}>
      {content}
    </Link>
  );
}
