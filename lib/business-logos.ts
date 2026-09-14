import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseSecretClient } from "@/lib/supabase/server";
import type { BusinessLogoInput, BusinessLogoRow, PublicBusinessLogo } from "@/types/business-logos";

const businessLogoColumns = [
  "id",
  "business_name",
  "logo_url",
  "website_url",
  "is_visible",
  "sort_order",
  "created_at",
  "updated_at",
].join(",");

const publicBusinessLogoColumns = [
  "id",
  "business_name",
  "logo_url",
  "website_url",
  "sort_order",
].join(",");

export async function getAdminBusinessLogos() {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [] as BusinessLogoRow[];

  const { data, error } = await supabase
    .from("business_logos")
    .select(businessLogoColumns)
    .order("sort_order", { ascending: true })
    .order("business_name", { ascending: true });

  if (error) {
    if (isMissingBusinessLogosTable(error)) return [];
    console.error("Failed to load admin business logos", error);
    throw new Error("Failed to load business logos.");
  }

  return ((data ?? []) as unknown as BusinessLogoRow[]).map(mapBusinessLogoRow);
}

export async function getPublicBusinessLogos(): Promise<PublicBusinessLogo[]> {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("business_logos")
    .select(publicBusinessLogoColumns)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("business_name", { ascending: true });

  if (error) {
    if (isMissingBusinessLogosTable(error)) return [];
    console.error("Failed to load public business logos", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return ((data ?? []) as unknown as PublicBusinessLogo[]).map(mapPublicBusinessLogo);
}

export async function createBusinessLogo(input: BusinessLogoInput) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase
    .from("business_logos")
    .insert(toDatabaseInput(input))
    .select(businessLogoColumns)
    .single();

  if (error) throw mapBusinessLogoError(error);
  revalidateBusinessLogos();
  return mapBusinessLogoRow(data as unknown as BusinessLogoRow);
}

export async function updateBusinessLogo(id: string, input: BusinessLogoInput) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase
    .from("business_logos")
    .update(toDatabaseInput(input))
    .eq("id", id)
    .select(businessLogoColumns)
    .single();

  if (error) throw mapBusinessLogoError(error);
  revalidateBusinessLogos();
  return mapBusinessLogoRow(data as unknown as BusinessLogoRow);
}

export async function setBusinessLogoVisibility(id: string, isVisible: boolean) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase
    .from("business_logos")
    .update({ is_visible: isVisible })
    .eq("id", id)
    .select(businessLogoColumns)
    .single();

  if (error) throw mapBusinessLogoError(error);
  revalidateBusinessLogos();
  return mapBusinessLogoRow(data as unknown as BusinessLogoRow);
}

export async function deleteBusinessLogo(id: string) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { error } = await supabase
    .from("business_logos")
    .delete()
    .eq("id", id);

  if (error) throw mapBusinessLogoError(error);
  revalidateBusinessLogos();
}

export function parseBusinessLogoForm(formData: FormData): BusinessLogoInput {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const rawLogoUrl = String(formData.get("logo_url") ?? "").trim();
  const rawWebsiteUrl = String(formData.get("website_url") ?? "").trim();
  const sortOrder = Number(String(formData.get("sort_order") ?? "0").trim());

  if (!businessName) throw new Error("Business name is required.");
  if (!Number.isInteger(sortOrder)) throw new Error("Sort order must be a whole number.");

  return {
    businessName,
    logoUrl: normalizeGoogleDriveLogoUrl(rawLogoUrl),
    websiteUrl: normalizeOptionalWebsiteUrl(rawWebsiteUrl),
    isVisible: formData.get("is_visible") === "on",
    sortOrder,
  };
}

export function normalizeGoogleDriveLogoUrl(rawUrl: string) {
  const fileId = extractGoogleDriveFileId(rawUrl);
  if (!fileId) throw new Error("Invalid Google Drive image URL.");
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`;
}

export function extractGoogleDriveFileId(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname !== "drive.google.com" && url.hostname !== "www.drive.google.com") return null;

    const thumbnailId = url.pathname === "/thumbnail" ? url.searchParams.get("id") : null;
    if (thumbnailId && isGoogleDriveFileId(thumbnailId)) return thumbnailId;

    const openId = url.searchParams.get("id");
    if (openId && isGoogleDriveFileId(openId)) return openId;

    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch?.[1] && isGoogleDriveFileId(fileMatch[1])) return fileMatch[1];

    const ucId = url.pathname === "/uc" ? url.searchParams.get("id") : null;
    if (ucId && isGoogleDriveFileId(ucId)) return ucId;
  } catch {
    return null;
  }

  return null;
}

export function revalidateBusinessLogos() {
  revalidatePath("/partners");
  revalidatePath("/admin/business-logos");
}

function toDatabaseInput(input: BusinessLogoInput) {
  return {
    business_name: input.businessName,
    logo_url: input.logoUrl,
    website_url: input.websiteUrl,
    is_visible: input.isVisible,
    sort_order: input.sortOrder,
  };
}

function normalizeOptionalWebsiteUrl(rawUrl: string) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Website / Facebook URL must start with http:// or https://.");
    }
    return url.toString();
  } catch {
    throw new Error("Website / Facebook URL must be a valid URL.");
  }
}

function isGoogleDriveFileId(value: string) {
  return /^[A-Za-z0-9_-]{10,}$/.test(value);
}

function mapBusinessLogoRow(row: BusinessLogoRow): BusinessLogoRow {
  return {
    ...row,
    sort_order: Number(row.sort_order),
  };
}

function mapPublicBusinessLogo(row: PublicBusinessLogo): PublicBusinessLogo {
  return {
    ...row,
    sort_order: Number(row.sort_order),
  };
}

function isMissingBusinessLogosTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.code === "PGRST205" || error.message?.toLowerCase().includes("business_logos");
}

function mapBusinessLogoError(error: { code?: string; message?: string }) {
  if (isMissingBusinessLogosTable(error)) return new Error("The business logos migration has not been applied yet.");
  if (error.code === "23505") return new Error("That business logo already exists.");
  if (error.code === "23514") return new Error("Business logo values are invalid.");
  return new Error(error.message || "Failed to save business logo.");
}
