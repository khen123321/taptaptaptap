import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  deleteBusinessLogo,
  parseBusinessLogoForm,
  setBusinessLogoVisibility,
  updateBusinessLogo,
} from "@/lib/business-logos";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to manage business logos." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const action = String(formData.get("_action") ?? "save");

    if (action === "visibility") {
      const isVisible = String(formData.get("is_visible") ?? "false") === "true";
      const logo = await setBusinessLogoVisibility(id, isVisible);
      return NextResponse.json({ ok: true, logo });
    }

    if (action === "delete") {
      await deleteBusinessLogo(id);
      return NextResponse.json({ ok: true });
    }

    const logo = await updateBusinessLogo(id, parseBusinessLogoForm(formData));
    return NextResponse.json({ ok: true, logo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update business logo." },
      { status: 400 },
    );
  }
}
