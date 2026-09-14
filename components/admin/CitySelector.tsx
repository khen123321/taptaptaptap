"use client";

import { useMemo, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { adminFieldClass } from "@/components/admin/AdminUI";
import { cityProviderId, philippineCities, type PhilippineCityOption } from "@/data/philippine-cities";
import type { MapLocationInput } from "@/types/map-locations";

type CitySelection = Pick<
  MapLocationInput,
  "cityName" | "provinceName" | "regionName" | "latitude" | "longitude" | "providerId"
>;

type CitySelectorProps = {
  initialCity?: CitySelection | null;
  disabled?: boolean;
};

export function CitySelector({ initialCity = null, disabled = false }: CitySelectorProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CitySelection | null>(initialCity);
  const [results, setResults] = useState<PhilippineCityOption[]>([]);
  const [error, setError] = useState("");

  const hiddenCity = useMemo(() => selected, [selected]);

  const searchCities = () => {
    const trimmed = query.trim();
    if (disabled || !trimmed) return;
    setError("");

    const matches = philippineCities
      .filter((city) => cityMatchesQuery(city, trimmed))
      .slice(0, 8);

    setResults(matches);
    if (!matches.length) setError("No matching city or municipality found in the local list.");
  };

  const chooseCity = (city: PhilippineCityOption) => {
    setSelected(cityToSelection(city));
    setQuery("");
    setResults([]);
    setError("");
  };

  return (
    <div className="grid gap-3">
      {hiddenCity ? (
        <>
          <input type="hidden" name="city_name" value={hiddenCity.cityName} />
          <input type="hidden" name="province_name" value={hiddenCity.provinceName ?? ""} />
          <input type="hidden" name="region_name" value={hiddenCity.regionName ?? ""} />
          <input type="hidden" name="city_latitude" value={String(hiddenCity.latitude)} />
          <input type="hidden" name="city_longitude" value={String(hiddenCity.longitude)} />
          <input type="hidden" name="city_provider_id" value={hiddenCity.providerId} />
        </>
      ) : null}

      <div className="grid gap-2 text-sm font-bold theme-text">
        City / Municipality
        <div className="flex flex-col gap-2 sm:flex-row">
          <span className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  searchCities();
                }
              }}
              className={`${adminFieldClass} w-full pl-9`}
              placeholder="Search city, e.g. Cagayan de Oro"
            />
          </span>
          <button
            type="button"
            onClick={searchCities}
            disabled={disabled || !query.trim()}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] px-4 text-sm font-bold theme-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-200">
          {error}
        </p>
      ) : null}

      {results.length ? (
        <div className="grid gap-2 rounded-md border theme-border p-2">
          {results.map((result) => (
            <button
              key={cityProviderId(result)}
              type="button"
              onClick={() => chooseCity(result)}
              className="flex items-start gap-2 rounded-md px-3 py-2 text-left text-sm theme-text hover:bg-[var(--accent-soft)]"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 theme-accent" aria-hidden />
              <span>
                <span className="block font-bold">{result.cityName}</span>
                <span className="block text-xs theme-text-muted">
                  {result.provinceName} · {result.regionName}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div className="rounded-md border theme-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black theme-text">{selected.cityName}</p>
              <p className="mt-1 text-xs theme-text-muted">
                {[selected.provinceName, selected.regionName].filter(Boolean).join(", ") || "Philippines"}
              </p>
            </div>
            {!disabled ? (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setResults([]);
                  setQuery("");
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border theme-border theme-text"
                aria-label="Clear selected city"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="rounded-md border theme-border p-3 text-sm theme-text-muted">
          Select a city or municipality from the local list. Coordinates are city-center only.
        </p>
      )}
    </div>
  );
}

function cityToSelection(city: PhilippineCityOption): CitySelection {
  return {
    cityName: city.cityName,
    provinceName: city.provinceName,
    regionName: city.regionName,
    latitude: city.latitude,
    longitude: city.longitude,
    providerId: cityProviderId(city),
  };
}

function cityMatchesQuery(city: PhilippineCityOption, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return [city.cityName, city.provinceName, city.regionName]
    .some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\bcity\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
