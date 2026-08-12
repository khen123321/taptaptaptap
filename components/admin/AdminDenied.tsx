export function AdminDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center theme-section px-4 py-12">
      <section className="w-full max-w-md rounded-lg border p-6 text-center theme-card-elevated sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] theme-accent">
          TapTapTap Admin
        </p>
        <h1 className="mt-3 text-2xl font-black theme-text">Access denied</h1>
        <p className="mt-4 text-sm leading-6 theme-text-secondary">
          You do not have permission to access the admin dashboard.
        </p>
        <form action="/api/admin/logout" method="post" className="mt-6">
          <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-5 text-sm font-bold text-[var(--button-primary-text)]">
            Back to Login
          </button>
        </form>
      </section>
    </main>
  );
}
