export type PhilippineCityOption = {
  cityName: string;
  provinceName: string;
  regionName: string;
  latitude: number;
  longitude: number;
};

export const philippineCities: PhilippineCityOption[] = [
  { cityName: "Angeles City", provinceName: "Pampanga", regionName: "Central Luzon", latitude: 15.145, longitude: 120.5887 },
  { cityName: "Antipolo City", provinceName: "Rizal", regionName: "Calabarzon", latitude: 14.6255, longitude: 121.1245 },
  { cityName: "Bacolod City", provinceName: "Negros Occidental", regionName: "Western Visayas", latitude: 10.6765, longitude: 122.9509 },
  { cityName: "Baguio City", provinceName: "Benguet", regionName: "Cordillera Administrative Region", latitude: 16.4023, longitude: 120.596 },
  { cityName: "Batangas City", provinceName: "Batangas", regionName: "Calabarzon", latitude: 13.7565, longitude: 121.0583 },
  { cityName: "Butuan City", provinceName: "Agusan del Norte", regionName: "Caraga", latitude: 8.9475, longitude: 125.5406 },
  { cityName: "Cagayan de Oro City", provinceName: "Misamis Oriental", regionName: "Northern Mindanao", latitude: 8.4542, longitude: 124.6319 },
  { cityName: "Caloocan City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.6507, longitude: 120.9676 },
  { cityName: "Cebu City", provinceName: "Cebu", regionName: "Central Visayas", latitude: 10.3157, longitude: 123.8854 },
  { cityName: "Davao City", provinceName: "Davao del Sur", regionName: "Davao Region", latitude: 7.1907, longitude: 125.4553 },
  { cityName: "General Santos City", provinceName: "South Cotabato", regionName: "Soccsksargen", latitude: 6.1164, longitude: 125.1716 },
  { cityName: "Iligan City", provinceName: "Lanao del Norte", regionName: "Northern Mindanao", latitude: 8.228, longitude: 124.2452 },
  { cityName: "Iloilo City", provinceName: "Iloilo", regionName: "Western Visayas", latitude: 10.7202, longitude: 122.5621 },
  { cityName: "Lapu-Lapu City", provinceName: "Cebu", regionName: "Central Visayas", latitude: 10.3103, longitude: 123.9494 },
  { cityName: "Las Pinas City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.4445, longitude: 120.9939 },
  { cityName: "Lucena City", provinceName: "Quezon", regionName: "Calabarzon", latitude: 13.9314, longitude: 121.6172 },
  { cityName: "Makati City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.5547, longitude: 121.0244 },
  { cityName: "Malabon City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.6681, longitude: 120.9658 },
  { cityName: "Mandaluyong City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.5794, longitude: 121.0359 },
  { cityName: "Mandaue City", provinceName: "Cebu", regionName: "Central Visayas", latitude: 10.3403, longitude: 123.9416 },
  { cityName: "Manila City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.5995, longitude: 120.9842 },
  { cityName: "Marikina City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.6507, longitude: 121.1029 },
  { cityName: "Muntinlupa City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.4081, longitude: 121.0415 },
  { cityName: "Naga City", provinceName: "Camarines Sur", regionName: "Bicol Region", latitude: 13.6218, longitude: 123.1948 },
  { cityName: "Navotas City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.6667, longitude: 120.9417 },
  { cityName: "Olongapo City", provinceName: "Zambales", regionName: "Central Luzon", latitude: 14.8386, longitude: 120.2842 },
  { cityName: "Paranaque City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.4793, longitude: 121.0198 },
  { cityName: "Pasay City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.5378, longitude: 121.0014 },
  { cityName: "Pasig City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.5764, longitude: 121.0851 },
  { cityName: "Puerto Princesa City", provinceName: "Palawan", regionName: "Mimaropa", latitude: 9.7638, longitude: 118.7473 },
  { cityName: "Quezon City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.676, longitude: 121.0437 },
  { cityName: "San Fernando City", provinceName: "Pampanga", regionName: "Central Luzon", latitude: 15.0343, longitude: 120.6844 },
  { cityName: "San Juan City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.6042, longitude: 121.0297 },
  { cityName: "Santa Rosa City", provinceName: "Laguna", regionName: "Calabarzon", latitude: 14.3122, longitude: 121.1114 },
  { cityName: "Tagbilaran City", provinceName: "Bohol", regionName: "Central Visayas", latitude: 9.65, longitude: 123.85 },
  { cityName: "Taguig City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.5176, longitude: 121.0509 },
  { cityName: "Tacloban City", provinceName: "Leyte", regionName: "Eastern Visayas", latitude: 11.2543, longitude: 125.0036 },
  { cityName: "Tarlac City", provinceName: "Tarlac", regionName: "Central Luzon", latitude: 15.4755, longitude: 120.5963 },
  { cityName: "Valenzuela City", provinceName: "Metro Manila", regionName: "National Capital Region", latitude: 14.7011, longitude: 120.983 },
  { cityName: "Zamboanga City", provinceName: "Zamboanga del Sur", regionName: "Zamboanga Peninsula", latitude: 6.9214, longitude: 122.079 },
];

export function cityProviderId(city: Pick<PhilippineCityOption, "cityName" | "provinceName">) {
  return `${slugify(city.provinceName)}:${slugify(city.cityName)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\bcity\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
