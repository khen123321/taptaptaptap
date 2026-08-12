import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminAnalyticsPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }

  return (
    <AdminShell session={access.session}>
      <h1 className="text-3xl font-black theme-text">Analytics</h1>
      <section className="mt-6 rounded-lg border p-6 theme-card">
        <p className="text-lg font-black theme-text">Coming soon</p>
      </section>
    </AdminShell>
  );
}
