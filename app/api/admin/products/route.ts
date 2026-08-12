import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { parseProductForm } from "@/lib/product-form";
import { revalidateProductStorefront, upsertAdminProduct } from "@/lib/products";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 });
  }

  try {
    const product = await upsertAdminProduct(parseProductForm(await request.formData()));
    revalidateProductStorefront(product.slug);
    return NextResponse.json({ ok: true, redirectTo: `/admin/products/${product.id}/edit?saved=1` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save product." },
      { status: 400 },
    );
  }
}
