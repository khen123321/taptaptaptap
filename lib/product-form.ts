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
  const currentUnitCost = toNumber(formData.get("current_unit_cost"));
  const lowStockThreshold = toNumber(formData.get("low_stock_threshold"));
  const defaultOnlinePrice = toNullableNumber(formData.get("default_online_price"));
  const defaultPhysicalPrice = toNullableNumber(formData.get("default_physical_price"));
  const bulkEnabled = String(formData.get("bulk_enabled") ?? "") === "on";
  const bulkTier1Min = toInteger(formData.get("bulk_tier_1_min"), 10);
  const bulkTier1Max = toInteger(formData.get("bulk_tier_1_max"), 24);
  const bulkTier1UnitPrice = toNullableNumber(formData.get("bulk_tier_1_unit_price"));
  const bulkTier2Min = toInteger(formData.get("bulk_tier_2_min"), 25);
  const bulkTier2UnitPrice = toNullableNumber(formData.get("bulk_tier_2_unit_price"));
  const mixMatchBundleEnabled = String(formData.get("mix_match_bundle_enabled") ?? "") === "on";
  const mixMatchBundleGroup = String(formData.get("mix_match_bundle_group") ?? "").trim();
  const mixMatchBundleSize = toInteger(formData.get("mix_match_bundle_size"), 2);
  const mixMatchBundlePrice = toNullableNumber(formData.get("mix_match_bundle_price"));
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
  if (currentUnitCost < 0 || (defaultOnlinePrice !== null && defaultOnlinePrice < 0) || (defaultPhysicalPrice !== null && defaultPhysicalPrice < 0)) {
    throw new Error("Inventory costs and default prices cannot be negative.");
  }
  if (!Number.isInteger(displayOrder)) throw new Error("Display order must be an integer.");
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    throw new Error("Low-stock threshold must be a non-negative whole number.");
  }
  if (
    bulkTier1Min <= 0 ||
    bulkTier1Max < bulkTier1Min ||
    bulkTier2Min <= bulkTier1Max ||
    (bulkTier1UnitPrice !== null && bulkTier1UnitPrice < 0) ||
    (bulkTier2UnitPrice !== null && bulkTier2UnitPrice < 0)
  ) {
    throw new Error("Bulk pricing tiers are invalid.");
  }
  if (bulkEnabled && (bulkTier1UnitPrice === null || bulkTier2UnitPrice === null)) {
    throw new Error("Bulk-enabled products require both bulk unit prices.");
  }
  if (mixMatchBundleSize < 2 || (mixMatchBundlePrice !== null && mixMatchBundlePrice < 0)) {
    throw new Error("Mix & Match bundle settings are invalid.");
  }
  if (mixMatchBundleEnabled && (!mixMatchBundleGroup || mixMatchBundlePrice === null)) {
    throw new Error("Mix & Match products require a group and bundle price.");
  }
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
    sku: String(formData.get("sku") ?? "").trim(),
    current_unit_cost: currentUnitCost,
    low_stock_threshold: lowStockThreshold,
    track_inventory: String(formData.get("track_inventory") ?? "") === "on",
    default_online_price: defaultOnlinePrice,
    default_physical_price: defaultPhysicalPrice,
    bulk_enabled: bulkEnabled,
    bulk_tier_1_min: bulkTier1Min,
    bulk_tier_1_max: bulkTier1Max,
    bulk_tier_1_unit_price: bulkTier1UnitPrice,
    bulk_tier_2_min: bulkTier2Min,
    bulk_tier_2_unit_price: bulkTier2UnitPrice,
    mix_match_bundle_enabled: mixMatchBundleEnabled,
    mix_match_bundle_group: mixMatchBundleGroup,
    mix_match_bundle_size: mixMatchBundleSize,
    mix_match_bundle_price: mixMatchBundlePrice,
  };
}

function toNumber(value: FormDataEntryValue | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toNullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function toInteger(value: FormDataEntryValue | null, fallback: number) {
  const number = Number(value ?? fallback);
  return Number.isInteger(number) ? number : fallback;
}
