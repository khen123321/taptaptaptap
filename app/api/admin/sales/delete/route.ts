import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { parseDeleteSaleForm } from "@/lib/sales-form";
import { softDeleteQuickSale } from "@/lib/sales";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to delete sales." }, { status: 403 });
  }

  try {
    const sale = await softDeleteQuickSale(
      parseDeleteSaleForm(await request.formData(), access.session.profileId),
    );
    return NextResponse.json({ ok: true, sale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete sale." },
      { status: 400 },
    );
  }
}
