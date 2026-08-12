import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { parseProductForm } from "@/lib/product-form";
import {
  deleteAdminProduct,
  getAdminProduct,
  revalidateProductStorefront,
  updateAdminProductStatus,
  upsertAdminProduct,
} from "@/lib/products";
import { createSupabaseSecretClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/types/database";

const statuses = new Set<ProductStatus>(["draft", "published", "archived"]);

export async function POST(request: Request, context: RouteContext<"/api/admin/products/[id]">) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const action = String(formData.get("_action") ?? "save");

    if (action === "status") {
      const status = String(formData.get("status")) as ProductStatus;
      if (!statuses.has(status)) throw new Error("Invalid product status.");
      const product = await updateAdminProductStatus(id, status);
      revalidateProductStorefront(product.slug);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const previous = await getAdminProduct(id);
      await deleteAdminProduct(id);
      revalidateProductStorefront(previous?.slug);
      return NextResponse.json({ ok: true, redirectTo: "/admin/products" });
    }

    const previous = await getAdminProduct(id);
    const input = parseProductForm(formData);
    const product = await upsertAdminProduct(input, id);
    await removeReplacedImages(previous, product);
    revalidateProductStorefront(product.slug, previous?.slug);

    return NextResponse.json({ ok: true, redirectTo: `/admin/products/${id}/edit?saved=1` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save product." },
      { status: 400 },
    );
  }
}

async function removeReplacedImages(
  previous: Awaited<ReturnType<typeof getAdminProduct>>,
  next: Awaited<ReturnType<typeof upsertAdminProduct>>,
) {
  if (!previous) return;

  const paths = Array.from(new Set([
    getStoragePath(previous.card_image_url, next.card_image_url),
    getStoragePath(previous.detail_image_url, next.detail_image_url),
    getStoragePath(previous.mockup_image_url, next.mockup_image_url),
  ].filter((path): path is string => Boolean(path))));

  if (!paths.length) return;

  const supabase = createSupabaseSecretClient();
  if (!supabase) return;
  await supabase.storage.from("product-images").remove(paths);
}

function getStoragePath(previousUrl?: string | null, nextUrl?: string | null) {
  if (!previousUrl || previousUrl === nextUrl) return null;
  const marker = "/storage/v1/object/public/product-images/";
  const index = previousUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(previousUrl.slice(index + marker.length).split("?")[0]);
}
