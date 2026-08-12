import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { createSupabaseSecretClient } from "@/lib/supabase/server";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const uploadId = String(formData.get("product_id") || formData.get("upload_id") || "drafts").replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  );

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);
  if (!extension || file.size > maxSize) {
    return NextResponse.json(
      { error: "Please upload a PNG, JPG, JPEG, or WEBP image under 5 MB." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseSecretClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Product image uploads are not configured. Add SUPABASE_SECRET_KEY to .env.local and restart the development server.",
      },
      { status: 500 },
    );
  }

  const path = `products/${uploadId || "drafts"}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 500 });
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ imageUrl: data.publicUrl, path });
}
