import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { createMapLocation, parseMapLocationForm } from "@/lib/map-locations";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to manage map locations." }, { status: 403 });
  }

  try {
    const location = await createMapLocation(
      parseMapLocationForm(await request.formData()),
      access.session.profileId,
    );
    return NextResponse.json({ ok: true, location });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save map location." },
      { status: 400 },
    );
  }
}
