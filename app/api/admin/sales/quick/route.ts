import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { parseQuickSaleForm } from "@/lib/sales-form";
import { recordQuickPhysicalSale } from "@/lib/sales";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to record sales." }, { status: 403 });
  }

  try {
    const sale = await recordQuickPhysicalSale(
      parseQuickSaleForm(await request.formData(), access.session.profileId),
    );
    return NextResponse.json({ ok: true, sale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record sale." },
      { status: 400 },
    );
  }
}
