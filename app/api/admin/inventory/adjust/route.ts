import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { adjustInventory } from "@/lib/inventory";
import { parseInventoryAdjustmentForm } from "@/lib/inventory-form";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to adjust inventory." }, { status: 403 });
  }

  try {
    const input = parseInventoryAdjustmentForm(await request.formData(), access.session.profileId);
    await adjustInventory(input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Inventory adjustment failed." },
      { status: 400 },
    );
  }
}
