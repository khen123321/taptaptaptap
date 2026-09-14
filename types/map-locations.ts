export type MapLocationInput = {
  cityName: string;
  provinceName?: string | null;
  regionName?: string | null;
  latitude: number;
  longitude: number;
  providerId: string;
  displayCount: number;
  isVisible: boolean;
  notes?: string | null;
};

export type MapLocationRow = {
  id: string;
  city_name: string;
  province_name: string | null;
  region_name: string | null;
  city_latitude: number;
  city_longitude: number;
  city_provider_id: string;
  display_count: number;
  is_visible: boolean;
  notes: string | null;
  created_by_profile_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicMapMarker = {
  city: string;
  province: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  count: number;
};
