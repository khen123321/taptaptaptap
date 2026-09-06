"use client";

import {
  Boxes,
  Eye,
  MousePointerClick,
  Package,
  PackageCheck,
  ReceiptText,
  TrendingUp,
  TriangleAlert,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type AdminMetricIcon =
  | "analytics"
  | "inventory"
  | "orders"
  | "package"
  | "package-check"
  | "views"
  | "clicks"
  | "low-stock"
  | "out-of-stock"
  | "sales"
  | "net";

const metricIcons = {
  analytics: TrendingUp,
  inventory: Boxes,
  orders: ReceiptText,
  package: Package,
  "package-check": PackageCheck,
  views: Eye,
  clicks: MousePointerClick,
  "low-stock": TriangleAlert,
  "out-of-stock": Boxes,
  sales: TrendingUp,
  net: WalletCards,
} satisfies Record<AdminMetricIcon, typeof Package>;

export const adminFieldClass =
  "min-h-11 rounded-lg border theme-border bg-[var(--surface-secondary)] px-3 text-sm theme-text outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25 disabled:cursor-not-allowed disabled:opacity-60";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.2em] theme-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-black tracking-normal theme-text sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 theme-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminMetricCard({
  icon,
  label,
  value,
  description,
  tone = "accent",
}: {
  icon?: AdminMetricIcon;
  label: string;
  value: string | number;
  description?: string;
  tone?: "accent" | "green" | "amber" | "red" | "neutral";
}) {
  const Icon = icon ? metricIcons[icon] : null;
  const toneClass =
    tone === "green"
      ? "text-green-300"
      : tone === "amber"
        ? "text-yellow-200"
        : tone === "red"
          ? "text-red-300"
          : tone === "neutral"
            ? "theme-text"
            : "theme-accent";

  return (
    <section className="rounded-2xl border p-5 theme-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold theme-text-secondary">{label}</p>
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border theme-border bg-[var(--surface-secondary)]">
            <Icon className={`h-4 w-4 ${toneClass}`} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className={`mt-4 text-3xl font-black ${toneClass}`}>{value}</p>
      {description ? <p className="mt-2 text-xs leading-5 theme-text-muted">{description}</p> : null}
    </section>
  );
}

export function AdminButton({
  children,
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      className={`${buttonClass(variant)} ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminLinkButton({
  href,
  children,
  variant = "secondary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant)} ${className}`}>
      {children}
    </Link>
  );
}

export function AdminModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const width =
    size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-4xl" : size === "sm" ? "max-w-md" : "max-w-2xl";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-3 py-4 sm:px-6"
      style={{ background: "var(--overlay)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-2xl border theme-card-elevated`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b theme-border bg-[var(--surface-elevated)] px-5 py-4">
          <div>
            <h2 id="admin-modal-title" className="text-xl font-black theme-text">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 theme-text-secondary">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border theme-border theme-text-secondary hover:border-[var(--accent)]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <div className="sticky bottom-0 border-t theme-border bg-[var(--surface-elevated)] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label = normalized === "completed" ? "Sold" : normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const className =
    normalized === "completed" || normalized === "published"
      ? "border-green-400/50 bg-green-500/10 text-green-300"
      : normalized === "pending" || normalized === "draft"
        ? "border-yellow-400/50 bg-yellow-500/10 text-yellow-200"
        : normalized === "cancelled" || normalized === "archived"
          ? "border-red-400/50 bg-red-500/10 text-red-300"
          : "theme-border theme-text-secondary";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border theme-border p-8 text-center">
      <p className="text-lg font-black theme-text">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 theme-text-secondary">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AdminFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border theme-border p-4">
      <h3 className="text-sm font-black theme-text">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-5 theme-text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function buttonClass(variant: ButtonVariant) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60";
  if (variant === "primary") {
    return `${base} border-[var(--accent)] bg-[var(--accent)] text-[var(--button-primary-text)] hover:bg-[var(--accent-hover)]`;
  }
  if (variant === "success") {
    return `${base} border-green-400/50 bg-green-500/15 text-green-300`;
  }
  if (variant === "danger") {
    return `${base} border-red-400/50 bg-red-500/10 text-red-300`;
  }
  if (variant === "ghost") {
    return `${base} theme-border bg-transparent theme-text-secondary hover:border-[var(--accent)] hover:text-[var(--text-primary)]`;
  }
  return `${base} theme-border bg-[var(--surface-secondary)] theme-text hover:border-[var(--accent)]`;
}
