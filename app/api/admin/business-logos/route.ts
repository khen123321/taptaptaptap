import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { createBusinessLogo, parseBusinessLogoForm } from "@/lib/business-logos";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to manage business logos." }, { status: 403 });
  }

  try {
    const logo = await createBusinessLogo(parseBusinessLogoForm(await request.formData()));
    return NextResponse.json({ ok: true, logo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save business logo." },
      { status: 400 },
    );
  }
}
