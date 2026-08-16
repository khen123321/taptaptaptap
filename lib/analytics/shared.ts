import type { AnalyticsEventName } from "@/types/database";

export const analyticsEventNames = [
  "page_view",
  "product_view",
  "product_details_open",
  "customizer_open",
  "customizer_upload",
  "customizer_request",
  "contact_click",
  "facebook_click",
  "email_click",
  "shop_click",
  "reseller_modal_open",
  "reseller_email_click",
  "reseller_facebook_click",
] as const satisfies readonly AnalyticsEventName[];

export const analyticsEventNameSet = new Set<string>(analyticsEventNames);

export const ctaEventNames: AnalyticsEventName[] = [
  "contact_click",
  "facebook_click",
  "email_click",
  "shop_click",
  "customizer_request",
  "reseller_modal_open",
  "reseller_email_click",
  "reseller_facebook_click",
];

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && analyticsEventNameSet.has(value);
}

export function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

export function normalizePagePath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path || path.length > 512 || !path.startsWith("/")) return null;
  if (isAdminPath(path)) return null;
  return path;
}

export function normalizeReferrer(value: unknown) {
  if (typeof value !== "string") return null;
  const referrer = value.trim();
  if (!referrer || referrer.length > 512) return null;
  return referrer;
}

export function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const input = value as Record<string, unknown>;
  const output: Record<string, string | number | boolean> = {};
  for (const key of ["productSlug", "cta", "source"]) {
    const item = input[key];
    if (typeof item === "string") output[key] = item.slice(0, 120);
    if (typeof item === "number" && Number.isFinite(item)) output[key] = item;
    if (typeof item === "boolean") output[key] = item;
  }
  return output;
}

export function getSourceCategory(referrer?: string | null) {
  if (!referrer) return "Direct";

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.")) return "Google";
    if (host.includes("facebook.") || host.includes("fb.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    return "Other";
  } catch {
    return "Other";
  }
}
