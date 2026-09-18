import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { resetAllSalesData } from "@/lib/sales";

export async function POST() {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to reset sales data." }, { status: 403 });
  }

  try {
    const result = await resetAllSalesData({ actorProfileId: access.session.profileId });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset sales data." },
      { status: 400 },
    );
  }
}
