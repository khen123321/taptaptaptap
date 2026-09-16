import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseSecretClient } from "@/lib/supabase/server";
import type { MapLocationInput, MapLocationRow, PublicMapMarker } from "@/types/map-locations";

type MapLocationRecord = Omit<MapLocationRow, "city_latitude" | "city_longitude"> & {
  city_latitude: number | string;
  city_longitude: number | string;
};

const mapLocationColumns = [
  "id",
  "city_name",
  "province_name",
  "region_name",
  "city_latitude",
  "city_longitude",
  "city_provider_id",
  "display_count",
  "is_visible",
  "notes",
  "created_by_profile_id",
  "created_at",
  "updated_at",
].join(",");

export async function getAdminMapLocations() {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [] as MapLocationRow[];

  const { data, error } = await supabase
    .from("public_map_locations")
    .select(mapLocationColumns)
    .order("city_name", { ascending: true })
    .order("province_name", { ascending: true });

  if (error) {
    if (isMissingMapLocationsTable(error)) return [];
    console.error("Failed to load admin map locations", error);
    throw new Error("Failed to load map locations.");
  }

  return ((data ?? []) as unknown as MapLocationRecord[]).map(mapLocationRecord);
}

export async function getPublicMapMarkers(): Promise<PublicMapMarker[]> {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("public_map_locations")
    .select("city_name,province_name,region_name,city_latitude,city_longitude,display_count")
    .eq("is_visible", true)
    .order("city_name", { ascending: true });

  if (error) {
    if (isMissingMapLocationsTable(error)) return [];
    console.error("Failed to load public map locations", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return ((data ?? []) as Array<{
    city_name: string;
    province_name: string | null;
    region_name: string | null;
    city_latitude: number | string;
    city_longitude: number | string;
    display_count: number | string;
  }>).map((row) => ({
    city: row.city_name,
    province: row.province_name,
    region: row.region_name,
    latitude: Number(row.city_latitude),
    longitude: Number(row.city_longitude),
    count: Number(row.display_count ?? 0),
  }));
}

export async function createMapLocation(input: MapLocationInput, actorProfileId: string) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase
    .from("public_map_locations")
    .insert(toDatabaseInput(input, actorProfileId))
    .select(mapLocationColumns)
    .single();

  if (error) throw mapMapLocationError(error);
  revalidateMapLocations();
  return mapLocationRecord(data as unknown as MapLocationRecord);
}

export async function updateMapLocation(id: string, input: MapLocationInput) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase
    .from("public_map_locations")
    .update(toDatabaseInput(input))
    .eq("id", id)
    .select(mapLocationColumns)
    .single();

  if (error) throw mapMapLocationError(error);
  revalidateMapLocations();
  return mapLocationRecord(data as unknown as MapLocationRecord);
}

export async function setMapLocationVisibility(id: string, isVisible: boolean) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase
    .from("public_map_locations")
    .update({ is_visible: isVisible })
    .eq("id", id)
    .select(mapLocationColumns)
    .single();

  if (error) throw mapMapLocationError(error);
  revalidateMapLocations();
  return mapLocationRecord(data as unknown as MapLocationRecord);
}

export async function deleteMapLocation(id: string) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { error } = await supabase
    .from("public_map_locations")
    .delete()
    .eq("id", id);

  if (error) throw mapMapLocationError(error);
  revalidateMapLocations();
}

export function parseMapLocationForm(formData: FormData): MapLocationInput {
  const cityName = String(formData.get("city_name") ?? "").trim();
  const provinceName = String(formData.get("province_name") ?? "").trim();
  const regionName = String(formData.get("region_name") ?? "").trim();
  const providerId = String(formData.get("city_provider_id") ?? "").trim();
  const latitude = Number(String(formData.get("city_latitude") ?? "").trim());
  const longitude = Number(String(formData.get("city_longitude") ?? "").trim());
  const displayCount = Number(String(formData.get("display_count") ?? "1").trim());
  const notes = String(formData.get("notes") ?? "").trim();

  if (!cityName || !providerId) throw new Error("Choose a city or municipality from the list.");
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("Selected city coordinates are invalid.");
  if (latitude < 4 || latitude > 22 || longitude < 116 || longitude > 127) {
    throw new Error("Choose a city or municipality in the Philippines.");
  }
  if (!Number.isInteger(displayCount) || displayCount < 0) {
    throw new Error("Display count must be a whole number zero or greater.");
  }

  return {
    cityName,
    provinceName: provinceName || null,
    regionName: regionName || null,
    latitude,
    longitude,
    providerId,
    displayCount,
    isVisible: formData.get("is_visible") === "on",
    notes: notes || null,
  };
}

export function revalidateMapLocations() {
  revalidatePath("/");
  revalidatePath("/admin/map-locations");
}

function toDatabaseInput(input: MapLocationInput, actorProfileId?: string) {
  return {
    city_name: input.cityName,
    province_name: input.provinceName ?? null,
    region_name: input.regionName ?? null,
    city_latitude: input.latitude,
    city_longitude: input.longitude,
    city_provider_id: input.providerId,
    display_count: input.displayCount,
    is_visible: input.isVisible,
    notes: input.notes?.trim() || null,
    ...(actorProfileId ? { created_by_profile_id: actorProfileId } : {}),
  };
}

function mapLocationRecord(record: MapLocationRecord): MapLocationRow {
  return {
    ...record,
    city_latitude: Number(record.city_latitude),
    city_longitude: Number(record.city_longitude),
    display_count: Number(record.display_count),
  };
}

function isMissingMapLocationsTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.code === "PGRST205" || error.message?.toLowerCase().includes("public_map_locations");
}

function mapMapLocationError(error: { code?: string; message?: string }) {
  if (error.code === "23505") return new Error("That city already has a map location. Edit the existing row instead.");
  if (error.code === "23514") return new Error("Map location values are invalid.");
  return new Error(error.message || "Failed to save map location.");
}
