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
    let input;
    try {
      input = parseQuickSaleForm(await request.formData(), access.session.profileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Quick sale form is invalid.";
      console.error("Quick sale validation failed", { message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (process.env.NODE_ENV === "development") {
      console.info("Quick sale submitted items", {
        items: input.saleItems?.map((item, index) => ({
          index: index + 1,
          productId: item.productId,
          packageType: item.packageType,
          quantity: item.quantity ?? null,
          hasCustomAmount: item.customAmount != null,
        })) ?? [],
      });
    }

    const sale = await recordQuickPhysicalSale(input);
    return NextResponse.json({ ok: true, sale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record sale." },
      { status: 400 },
    );
  }
}
