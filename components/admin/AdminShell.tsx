import Link from "next/link";
import { BarChart3, ExternalLink, LayoutDashboard, LogOut, Package } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminSession } from "@/lib/admin-auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminShell({
  children,
  session,
}: {
  children: ReactNode;
  session: AdminSession;
}) {
  return (
    <div className="min-h-screen theme-page">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r theme-border bg-[var(--surface)] p-5 lg:flex lg:flex-col">
        <div>
          <p className="text-lg font-black theme-text">TapTapTap Admin</p>
          <p className="mt-1 truncate text-xs theme-text-muted">{session.email}</p>
        </div>

        <nav className="mt-8 grid gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold theme-text-secondary transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
            >
              <Icon className="h-4 w-4 theme-accent" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto grid gap-2">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold theme-text-secondary transition hover:bg-[var(--accent-soft)]"
          >
            <ExternalLink className="h-4 w-4 theme-accent" aria-hidden />
            View Website
          </Link>
          <form action="/api/admin/logout" method="post">
            <button className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold theme-text-secondary transition hover:bg-[var(--accent-soft)]">
              <LogOut className="h-4 w-4 theme-accent" aria-hidden />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b theme-header px-4 py-3 backdrop-blur lg:hidden">
          <p className="font-black theme-text">TapTapTap Admin</p>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-md border theme-border px-3 py-2 text-sm font-semibold theme-text-secondary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
