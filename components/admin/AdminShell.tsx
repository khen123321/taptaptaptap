"use client";

import Link from "next/link";
import { BarChart3, Boxes, ExternalLink, LayoutDashboard, LogOut, Package, ReceiptText } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AdminSession } from "@/lib/admin-auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/sales", label: "Sales", icon: ReceiptText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminShell({
  children,
  session,
}: {
  children: ReactNode;
  session: AdminSession;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen theme-page">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r theme-border bg-[var(--surface)] p-5 lg:flex lg:flex-col">
        <div className="rounded-2xl border theme-border bg-[var(--surface-secondary)] p-4">
          <p className="text-base font-black theme-text">TapTapTap Admin</p>
          <p className="mt-1 truncate text-xs font-medium theme-text-muted">{session.email}</p>
        </div>

        <nav className="mt-7 grid gap-1.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                isActive(href)
                  ? "bg-[var(--accent-soft)] theme-text"
                  : "theme-text-secondary hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive(href) ? "theme-accent" : "theme-text-muted"}`} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto grid gap-1.5 border-t theme-border pt-5">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold theme-text-secondary transition hover:bg-[var(--surface-secondary)]"
          >
            <ExternalLink className="h-4 w-4 theme-accent" aria-hidden />
            View Website
          </Link>
          <form action="/api/admin/logout" method="post">
            <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold theme-text-secondary transition hover:bg-[var(--surface-secondary)]">
              <LogOut className="h-4 w-4 theme-accent" aria-hidden />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b theme-header px-4 py-3 backdrop-blur lg:hidden">
          <div>
            <p className="font-black theme-text">TapTapTap Admin</p>
            <p className="mt-0.5 truncate text-xs theme-text-muted">{session.email}</p>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  isActive(href)
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] theme-accent"
                    : "theme-border theme-text-secondary"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
