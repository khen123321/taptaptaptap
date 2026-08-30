import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { cancelQuickSale } from "@/lib/sales";
import { parseCancelSaleForm } from "@/lib/sales-form";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to cancel sales." }, { status: 403 });
  }

  try {
    const sale = await cancelQuickSale(
      parseCancelSaleForm(await request.formData(), access.session.profileId),
    );
    return NextResponse.json({ ok: true, sale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel sale." },
      { status: 400 },
    );
  }
}
