import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { BusinessLogosManager } from "@/components/admin/BusinessLogosManager";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminBusinessLogos } from "@/lib/business-logos";

export default async function AdminBusinessLogosPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }

  const logos = await getAdminBusinessLogos();

  return (
    <AdminShell session={access.session}>
      <AdminPageHeader
        eyebrow="PARTNERS"
        title="Business Logos"
        description="Manage the Google Drive-hosted logos displayed on the public Partners page."
      />
      <div className="mt-6">
        <BusinessLogosManager logos={logos} />
      </div>
    </AdminShell>
  );
}
