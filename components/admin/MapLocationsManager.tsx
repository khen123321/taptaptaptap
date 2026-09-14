"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminButton, AdminEmptyState, AdminModal, adminFieldClass } from "@/components/admin/AdminUI";
import { CitySelector } from "@/components/admin/CitySelector";
import type { MapLocationInput, MapLocationRow } from "@/types/map-locations";

type MapLocationsManagerProps = {
  locations: MapLocationRow[];
};

type ActionResponse = {
  ok?: boolean;
  error?: string;
};

export function MapLocationsManager({ locations }: MapLocationsManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MapLocationRow | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<MapLocationRow | null>(null);

  const filteredLocations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return locations;

    return locations.filter((location) =>
      [location.city_name, location.province_name, location.region_name, location.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [locations, query]);

  const submitLocation = async (event: FormEvent<HTMLFormElement>, locationId?: string) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const url = locationId ? `/api/admin/map-locations/${locationId}` : "/api/admin/map-locations";

    const response = await fetch(url, { method: "POST", body: formData });
    const result = (await response.json()) as ActionResponse;
    setSaving(false);

    if (!response.ok || result.error) {
      setError(result.error ?? "Failed to save map location.");
      return;
    }

    setMessage(locationId ? "Map location updated." : "Map location added.");
    setAddOpen(false);
    setEditingLocation(null);
    router.refresh();
  };

  const setVisibility = async (location: MapLocationRow) => {
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("_action", "visibility");
    formData.set("is_visible", location.is_visible ? "false" : "true");

    const response = await fetch(`/api/admin/map-locations/${location.id}`, { method: "POST", body: formData });
    const result = (await response.json()) as ActionResponse;

    if (!response.ok || result.error) {
      setError(result.error ?? "Failed to update visibility.");
      return;
    }

    setMessage(location.is_visible ? "Location hidden." : "Location shown.");
    router.refresh();
  };

  const deleteLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deletingLocation || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("_action", "delete");

    const response = await fetch(`/api/admin/map-locations/${deletingLocation.id}`, {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as ActionResponse;
    setSaving(false);

    if (!response.ok || result.error) {
      setError(result.error ?? "Failed to delete map location.");
      return;
    }

    setMessage("Map location deleted.");
    setDeletingLocation(null);
    router.refresh();
  };

  return (
    <section className="rounded-2xl border p-5 theme-card">
      {message ? (
        <p className="mb-4 rounded-md border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`${adminFieldClass} sm:max-w-sm`}
          placeholder="Search city, province, region"
        />
        <AdminButton type="button" variant="primary" onClick={() => setAddOpen(true)}>
          + Add Location
        </AdminButton>
      </div>

      {filteredLocations.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-[var(--surface-secondary)] text-left theme-text-muted">
              <tr>
                <th className="rounded-l-lg px-3 py-3 font-semibold">City</th>
                <th className="px-3 py-3 font-semibold">Province</th>
                <th className="px-3 py-3 font-semibold">Region</th>
                <th className="px-3 py-3 font-semibold">Count</th>
                <th className="px-3 py-3 font-semibold">Visibility</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="rounded-r-lg px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredLocations.map((location) => (
                <tr key={location.id}>
                  <td className="px-3 py-4">
                    <p className="font-bold theme-text">{location.city_name}</p>
                    {location.notes ? <p className="mt-1 line-clamp-1 text-xs theme-text-muted">{location.notes}</p> : null}
                  </td>
                  <td className="px-3 py-4 theme-text-secondary">{location.province_name || "-"}</td>
                  <td className="px-3 py-4 theme-text-secondary">{location.region_name || "-"}</td>
                  <td className="px-3 py-4 text-xl font-black theme-text">{location.display_count}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${location.is_visible ? "border-green-400/50 bg-green-500/10 text-green-300" : "border-yellow-400/50 bg-yellow-500/10 text-yellow-200"}`}>
                      {location.is_visible ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-3 py-4 theme-text-muted">{formatDate(location.updated_at)}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <AdminButton type="button" variant="secondary" onClick={() => setEditingLocation(location)}>
                        Edit
                      </AdminButton>
                      <AdminButton type="button" variant="ghost" onClick={() => void setVisibility(location)}>
                        {location.is_visible ? "Hide" : "Show"}
                      </AdminButton>
                      <AdminButton type="button" variant="danger" onClick={() => setDeletingLocation(location)}>
                        Delete
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5">
          <AdminEmptyState
            title="No map locations found"
            description="Add a city to show a TapTapTap pin on the public Philippines map."
          />
        </div>
      )}

      <LocationModal
        open={addOpen}
        title="Add Location"
        submitLabel="Add Location"
        saving={saving}
        onClose={() => setAddOpen(false)}
        onSubmit={(event) => submitLocation(event)}
      />

      <LocationModal
        key={editingLocation?.id ?? "edit-location"}
        open={Boolean(editingLocation)}
        title="Edit Location"
        submitLabel="Save Changes"
        saving={saving}
        location={editingLocation}
        onClose={() => setEditingLocation(null)}
        onSubmit={(event) => editingLocation ? submitLocation(event, editingLocation.id) : undefined}
      />

      <AdminModal
        open={Boolean(deletingLocation)}
        title="Delete Map Location?"
        description={deletingLocation ? `${deletingLocation.city_name} will be removed from the public map.` : undefined}
        onClose={() => setDeletingLocation(null)}
        size="sm"
        footer={
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminButton type="button" variant="secondary" onClick={() => setDeletingLocation(null)}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" form="delete-map-location-form" variant="danger" disabled={saving}>
              {saving ? "Deleting..." : "Delete Location"}
            </AdminButton>
          </div>
        }
      >
        <form id="delete-map-location-form" onSubmit={deleteLocation}>
          <p className="text-sm leading-6 theme-text-secondary">
            This permanently deletes only the manual public map pin. It does not alter sales, inventory, or analytics data.
          </p>
        </form>
      </AdminModal>
    </section>
  );
}

function LocationModal({
  open,
  title,
  submitLabel,
  saving,
  location,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  saving: boolean;
  location?: MapLocationRow | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const initialCity = location ? rowToCity(location) : null;
  const formId = location ? `map-location-form-${location.id}` : "map-location-form-new";

  return (
    <AdminModal
      open={open}
      title={title}
      description="Manage a city-level public map pin. Exact addresses are not stored."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form={formId} variant="primary" disabled={saving}>
            {saving ? "Saving..." : submitLabel}
          </AdminButton>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="grid gap-4">
        <CitySelector initialCity={initialCity} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold theme-text">
            Display Count
            <input
              name="display_count"
              type="number"
              min="0"
              step="1"
              defaultValue={location?.display_count ?? 1}
              className={adminFieldClass}
              required
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 self-end rounded-lg border theme-border px-3 text-sm font-bold theme-text">
            <input
              name="is_visible"
              type="checkbox"
              defaultChecked={location?.is_visible ?? true}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Visible
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold theme-text">
          Notes
          <textarea
            name="notes"
            rows={3}
            defaultValue={location?.notes ?? ""}
            className="rounded-md border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-sm theme-text outline-none focus:border-[var(--accent)]"
            placeholder="Optional internal note"
          />
        </label>
      </form>
    </AdminModal>
  );
}

function rowToCity(location: MapLocationRow): Pick<MapLocationInput, "cityName" | "provinceName" | "regionName" | "latitude" | "longitude" | "providerId"> {
  return {
    cityName: location.city_name,
    provinceName: location.province_name,
    regionName: location.region_name,
    latitude: location.city_latitude,
    longitude: location.city_longitude,
    providerId: location.city_provider_id,
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
  });
}
