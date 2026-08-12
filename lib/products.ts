import type { Product } from "@/types/product";
import type { ProductInput, ProductRow, ProductStatus } from "@/types/database";
import { revalidatePath } from "next/cache";
import { formatPhp } from "@/lib/format";
import {
  createSupabaseSecretClient,
  createSupabaseServerClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/server";

export const products: Product[] = [
  {
    id: "google-review-sign",
    name: "Google Review NFC Sign",
    slug: "google-review-nfc-sign",
    description: "Make leaving a Google review as simple as tapping a phone.",
    pricePhp: 899,
    buyOnePrice: 899,
    buyTwoPrice: 1499,
    buyTwoSavings: 299,
    unitLabel: "1 Sign",
    bundlePricePhp: 1499,
    bundleLabel: "2 Signs",
    bundleSavingsLabel: "Save ₱299",
    includedFeatures: [
      "Free nationwide shipping",
      "Google Review integration",
      "Initial NFC setup & programming",
      "Ready-to-use setup",
      "Business link setup",
      "Setup assistance",
      "No monthly subscription",
    ],
    ctaLabel: "Order Google Review Sign",
    ctaHref: "mailto:taptaptap.official@outlook.com?subject=Order%20Google%20Review%20NFC%20Sign",
    cardImage: "/images/products/google-review-sign.png",
    image: "/images/products/google-review-sign.png",
    category: "nfc-signs",
    type: "standard",
  },
  {
    id: "facebook-follow-sign",
    name: "Facebook Follow NFC Sign",
    slug: "facebook-follow-nfc-sign",
    description: "Let customers instantly open and follow your Facebook Page with one tap.",
    pricePhp: 899,
    buyOnePrice: 899,
    buyTwoPrice: 1499,
    buyTwoSavings: 299,
    unitLabel: "1 Sign",
    bundlePricePhp: 1499,
    bundleLabel: "2 Signs",
    bundleSavingsLabel: "Save ₱299",
    includedFeatures: [
      "Free nationwide shipping",
      "Facebook Page integration",
      "Initial NFC setup & programming",
      "Ready-to-use setup",
      "Business link setup",
      "Setup assistance",
      "No monthly subscription",
    ],
    ctaLabel: "Order Facebook Sign",
    ctaHref: "mailto:taptaptap.official@outlook.com?subject=Order%20Facebook%20NFC%20Sign",
    cardImage: "/images/products/facebook-follow-sign.png",
    image: "/images/products/facebook-follow-sign.png",
    category: "nfc-signs",
    type: "standard",
  },
  {
    id: "custom-nfc-sign",
    name: "Custom Branded NFC Sign",
    slug: "custom-branded-nfc-sign",
    description:
      "Create an NFC sign using your business logo, colors, branding, and custom artwork.",
    pricePhp: 1099,
    priceLabel: "Starting at ₱1,099",
    buyOnePrice: 1099,
    buyTwoPrice: 1899,
    buyTwoSavings: 299,
    unitLabel: "1 Sign",
    bundlePricePhp: 1899,
    bundleLabel: "2 Signs",
    bundleSavingsLabel: "Save ₱299",
    includedFeatures: [
      "Free nationwide shipping",
      "Initial NFC setup & programming",
      "Business link integration",
      "Ready-to-use setup",
      "Business logo",
      "Business name",
      "Brand colors",
      "Personalized NFC sign design",
      "QR-code backup",
      "Setup assistance",
      "No monthly subscription",
    ],
    ctaLabel: "Customize Yours",
    ctaHref: "/customize",
    cardImage: "/images/products/custom-branded-card.png",
    image: "/images/products/custom-branded-card.png",
    mockupImage: "/images/products/mockups/blank-nfc-stand.png",
    category: "custom",
    type: "custom",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatProductPrice(product: Product) {
  return product.priceLabel ?? formatPhp(product.pricePhp);
}

export function mapProductRow(row: ProductRow): Product {
  const cardImage = row.card_image_url || row.detail_image_url || "";
  const detailImage = row.detail_image_url || row.card_image_url || "";

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.short_description ?? row.description ?? "",
    pricePhp: Number(row.price_single),
    priceLabel:
      row.product_type === "custom"
        ? `Starting at ${formatPhp(Number(row.price_single))}`
        : undefined,
    buyOnePrice: Number(row.price_single),
    buyTwoPrice: Number(row.price_bundle ?? 0),
    buyTwoSavings: Number(row.bundle_savings ?? 0),
    unitLabel: "1 Sign",
    bundlePricePhp: Number(row.price_bundle ?? 0),
    bundleLabel: "2 Signs",
    bundleSavingsLabel: `Save ${formatPhp(Number(row.bundle_savings ?? 0))}`,
    includedFeatures: Array.isArray(row.included_features)
      ? row.included_features.map(String)
      : [],
    ctaLabel: row.cta_label ?? "View Details",
    ctaHref: row.cta_href ?? "/#contact",
    cardImage,
    image: detailImage || cardImage,
    mockupImage:
      row.mockup_image_url ??
      (row.product_type === "custom"
        ? "/images/products/mockups/blank-nfc-stand.png"
        : undefined),
    category: row.category ?? "nfc-signs",
    type: row.product_type,
  };
}

export async function getPublishedProducts() {
  if (!hasSupabasePublicEnv()) return products;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load published products.", error);
      return [];
    }

    return (data as ProductRow[]).map(mapProductRow);
  } catch {
    return [];
  }
}

export async function getPublishedProductBySlug(slug: string) {
  if (!hasSupabasePublicEnv()) return getProductBySlug(slug);

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) return undefined;
    return mapProductRow(data as ProductRow);
  } catch {
    return undefined;
  }
}

export async function getAdminProducts() {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Failed to load products.");
  return (data ?? []) as ProductRow[];
}

export async function getAdminProduct(id: string) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to load product.");
  return data as ProductRow | null;
}

export async function getAdminProductDashboard() {
  const supabase = createSupabaseSecretClient();
  if (!supabase) {
    return { total: 0, published: 0, draft: 0, archived: 0, recent: [] as ProductRow[] };
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Failed to load dashboard products.");

  const rows = (data ?? []) as ProductRow[];
  return {
    total: rows.length,
    published: rows.filter((product) => product.status === "published").length,
    draft: rows.filter((product) => product.status === "draft").length,
    archived: rows.filter((product) => product.status === "archived").length,
    recent: rows.slice(0, 5),
  };
}

export async function upsertAdminProduct(input: ProductInput, id?: string) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const payload = {
    name: input.name,
    slug: input.slug,
    short_description: input.short_description,
    description: input.description,
    product_type: input.product_type,
    category: input.category,
    price_single: input.price_single,
    price_bundle: input.price_bundle,
    bundle_savings: input.bundle_savings,
    card_image_url: input.card_image_url,
    detail_image_url: input.detail_image_url,
    mockup_image_url: input.mockup_image_url,
    included_features: input.included_features,
    cta_label: input.cta_label,
    cta_href: input.cta_href,
    status: input.status,
    display_order: input.display_order,
  };

  const query = id
    ? supabase.from("products").update(payload).eq("id", id).select("*").single()
    : supabase.from("products").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error?.code === "23505") throw new Error("Product slug already exists.");
  if (error) throw new Error("Failed to save product.");
  return data as ProductRow;
}

export async function updateAdminProductStatus(id: string, status: ProductStatus) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error("Failed to update product status.");
  return data as ProductRow;
}

export async function deleteAdminProduct(id: string) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error("Failed to delete product.");
}

export function revalidateProductStorefront(...slugs: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[slug]", "page");

  for (const slug of slugs) {
    if (slug) revalidatePath(`/products/${slug}`);
  }
}
