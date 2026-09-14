import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  deleteMapLocation,
  parseMapLocationForm,
  setMapLocationVisibility,
  updateMapLocation,
} from "@/lib/map-locations";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to manage map locations." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const action = String(formData.get("_action") ?? "save");

    if (action === "visibility") {
      const isVisible = String(formData.get("is_visible") ?? "false") === "true";
      const location = await setMapLocationVisibility(id, isVisible);
      return NextResponse.json({ ok: true, location });
    }

    if (action === "delete") {
      await deleteMapLocation(id);
      return NextResponse.json({ ok: true });
    }

    const location = await updateMapLocation(
      id,
      parseMapLocationForm(formData),
    );
    return NextResponse.json({ ok: true, location });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update map location." },
      { status: 400 },
    );
  }
}
