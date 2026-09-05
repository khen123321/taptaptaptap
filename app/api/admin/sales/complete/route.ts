import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { completePendingQuickSale } from "@/lib/sales";
import { parseCompleteSaleForm } from "@/lib/sales-form";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to complete sales." }, { status: 403 });
  }

  try {
    const sale = await completePendingQuickSale(
      parseCompleteSaleForm(await request.formData(), access.session.profileId),
    );
    return NextResponse.json({ ok: true, sale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark sale as sold." },
      { status: 400 },
    );
  }
}
