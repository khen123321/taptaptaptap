import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { MapLocationsManager } from "@/components/admin/MapLocationsManager";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminMapLocations } from "@/lib/map-locations";

export default async function AdminMapLocationsPage() {
  const access = await requireAdmin();

  if (access.status === "forbidden") {
    return <AdminDenied />;
  }

  const locations = await getAdminMapLocations();

  return (
    <AdminShell session={access.session}>
      <AdminPageHeader
        eyebrow="PUBLIC MAP"
        title="Map Locations"
        description="Manage the cities displayed on the TapTapTap public Philippines map."
      />
      <div className="mt-6">
        <MapLocationsManager locations={locations} />
      </div>
    </AdminShell>
  );
}
