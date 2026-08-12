import type { ProductInput, ProductStatus } from "@/types/database";

const statuses: ProductStatus[] = ["draft", "published", "archived"];

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseProductForm(formData: FormData): ProductInput {
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") || name));
  const status = String(formData.get("status") ?? "draft") as ProductStatus;
  const productType =
    String(formData.get("product_type") ?? "standard") === "custom"
      ? "custom"
      : "standard";
  const priceSingle = toNumber(formData.get("price_single"));
  const priceBundle = toNumber(formData.get("price_bundle"));
  const bundleSavings = toNumber(formData.get("bundle_savings"));
  const displayOrder = toNumber(formData.get("display_order"));
  const shortDescription = String(formData.get("short_description") ?? "").trim();
  const cardImageUrl = String(formData.get("card_image_url") ?? "").trim();
  const detailImageUrl = String(formData.get("detail_image_url") ?? "").trim() || cardImageUrl;
  const includedFeatures = String(formData.get("included_features") ?? "")
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);

  if (!name) throw new Error("Product name is required.");
  if (!slug) throw new Error("Slug is required.");
  if (!statuses.includes(status)) throw new Error("Invalid status.");
  if (priceSingle < 0 || priceBundle < 0 || bundleSavings < 0) {
    throw new Error("Prices cannot be negative.");
  }
  if (!Number.isInteger(displayOrder)) throw new Error("Display order must be an integer.");
  if (status === "published" && (!shortDescription || !cardImageUrl)) {
    throw new Error("Published products require a short description and card image.");
  }

  return {
    name,
    slug,
    short_description: shortDescription,
    description: String(formData.get("description") ?? "").trim(),
    product_type: productType,
    category: String(formData.get("category") ?? "").trim(),
    price_single: priceSingle,
    price_bundle: priceBundle,
    bundle_savings: bundleSavings,
    card_image_url: cardImageUrl,
    detail_image_url: detailImageUrl,
    mockup_image_url: String(formData.get("mockup_image_url") ?? "").trim(),
    included_features: includedFeatures,
    cta_label: String(formData.get("cta_label") ?? "").trim(),
    cta_href: String(formData.get("cta_href") ?? "").trim(),
    status,
    display_order: displayOrder,
  };
}

function toNumber(value: FormDataEntryValue | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
