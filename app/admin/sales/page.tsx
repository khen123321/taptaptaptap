import Link from "next/link";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { SalesManager } from "@/components/admin/SalesManager";
import { requireAdmin } from "@/lib/admin-auth";
import { getSalesList } from "@/lib/sales";

export default async function AdminSalesPage({
  searchParams,
}: PageProps<"/admin/sales">) {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }

  const params = await searchParams;
  const query = single(params.q);
  const date = single(params.date) === "today" ? "today" : "all";
  const sortParam = single(params.sort);
  const sort =
    sortParam === "oldest" ||
    sortParam === "amount_desc" ||
    sortParam === "amount_asc"
      ? sortParam
      : "newest";
  const sales = await getSalesList({ query, date, sort });

  return (
    <AdminShell session={access.session}>
      <p className="text-xs font-black uppercase tracking-[0.22em] theme-accent">
        Physical Sales
      </p>
      <h1 className="mt-3 text-3xl font-black theme-text">Sales</h1>
      <p className="mt-2 text-sm theme-text-secondary">
        Review quick physical sales and cancel completed sales when needed.
      </p>

      <section className="mt-8 rounded-lg border p-4 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black theme-text">Sales History</h2>
          <Link href="/admin/inventory" className="text-sm font-bold theme-accent">
            Record Quick Sale
          </Link>
        </div>

        <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <label className="grid gap-2 text-sm font-bold theme-text">
            Search
            <input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Sale, product, reference, admin"
              className={fieldClass}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold theme-text">
            Date
            <select name="date" defaultValue={date} className={fieldClass}>
              <option value="today">Today</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold theme-text">
            Sort
            <select name="sort" defaultValue={sort} className={fieldClass}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount High-Low</option>
              <option value="amount_asc">Amount Low-High</option>
            </select>
          </label>
          <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] lg:self-end">
            Filter
          </button>
        </form>
      </section>

      <div className="mt-6">
        <SalesManager sales={sales} />
      </div>
    </AdminShell>
  );
}

const fieldClass =
  "min-h-11 rounded-md border theme-border bg-[var(--surface-secondary)] px-3 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25";

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
