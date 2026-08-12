import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Login | TapTapTap",
};

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="flex min-h-screen items-center justify-center theme-section px-4 py-12">
      <section className="w-full max-w-md rounded-lg border p-6 theme-card-elevated sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] theme-accent">
          TapTapTap Admin
        </p>
        <h1 className="mt-3 text-3xl font-black theme-text">Sign in</h1>
        <p className="mt-3 text-sm leading-6 theme-text-secondary">
          Admin accounts are created manually in Supabase.
        </p>

        {error ? (
          <p className="mt-5 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <form action="/api/admin/login" method="post" className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold theme-text">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="min-h-12 rounded-md border theme-border bg-[var(--surface-secondary)] px-4 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold theme-text">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="min-h-12 rounded-md border theme-border bg-[var(--surface-secondary)] px-4 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25"
            />
          </label>
          <button className="inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-5 text-sm font-bold text-[var(--button-primary-text)] transition hover:bg-[var(--accent-hover)]">
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
