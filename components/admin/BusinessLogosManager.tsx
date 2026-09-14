"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminButton, AdminEmptyState, AdminModal, adminFieldClass } from "@/components/admin/AdminUI";
import type { BusinessLogoRow } from "@/types/business-logos";

type BusinessLogosManagerProps = {
  logos: BusinessLogoRow[];
};

type ActionResponse = {
  ok?: boolean;
  error?: string;
};

export function BusinessLogosManager({ logos }: BusinessLogosManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<BusinessLogoRow | null>(null);
  const [deletingLogo, setDeletingLogo] = useState<BusinessLogoRow | null>(null);

  const filteredLogos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return logos;

    return logos.filter((logo) =>
      [logo.business_name, logo.logo_url, logo.website_url]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [logos, query]);

  const submitLogo = async (event: FormEvent<HTMLFormElement>, logoId?: string) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const url = logoId ? `/api/admin/business-logos/${logoId}` : "/api/admin/business-logos";
    const response = await fetch(url, { method: "POST", body: formData });
    const result = (await response.json()) as ActionResponse;
    setSaving(false);

    if (!response.ok || result.error) {
      setError(result.error ?? "Failed to save business logo.");
      return;
    }

    setMessage(logoId ? "Business logo updated." : "Business logo added.");
    setAddOpen(false);
    setEditingLogo(null);
    router.refresh();
  };

  const setVisibility = async (logo: BusinessLogoRow) => {
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("_action", "visibility");
    formData.set("is_visible", logo.is_visible ? "false" : "true");

    const response = await fetch(`/api/admin/business-logos/${logo.id}`, { method: "POST", body: formData });
    const result = (await response.json()) as ActionResponse;

    if (!response.ok || result.error) {
      setError(result.error ?? "Failed to update visibility.");
      return;
    }

    setMessage(logo.is_visible ? "Business logo hidden." : "Business logo shown.");
    router.refresh();
  };

  const deleteLogo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deletingLogo || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("_action", "delete");

    const response = await fetch(`/api/admin/business-logos/${deletingLogo.id}`, {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as ActionResponse;
    setSaving(false);

    if (!response.ok || result.error) {
      setError(result.error ?? "Failed to delete business logo.");
      return;
    }

    setMessage("Business logo deleted.");
    setDeletingLogo(null);
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
          placeholder="Search business name or URL"
        />
        <AdminButton type="button" variant="primary" onClick={() => setAddOpen(true)}>
          + Add Business Logo
        </AdminButton>
      </div>

      <p className="mt-4 rounded-lg border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-xs leading-5 theme-text-muted">
        Make sure the Google Drive file is shared as &quot;Anyone with the link - Viewer&quot;.
      </p>

      {filteredLogos.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-[var(--surface-secondary)] text-left theme-text-muted">
              <tr>
                <th className="rounded-l-lg px-3 py-3 font-semibold">Business</th>
                <th className="px-3 py-3 font-semibold">Logo</th>
                <th className="px-3 py-3 font-semibold">Website / Facebook</th>
                <th className="px-3 py-3 font-semibold">Sort</th>
                <th className="px-3 py-3 font-semibold">Visibility</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="rounded-r-lg px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredLogos.map((logo) => (
                <tr key={logo.id}>
                  <td className="px-3 py-4">
                    <p className="font-bold theme-text">{logo.business_name}</p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="relative h-14 w-24 overflow-hidden rounded-lg border theme-border bg-white">
                      <Image
                        src={logo.logo_url}
                        alt={`${logo.business_name} logo`}
                        fill
                        unoptimized
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-3 py-4 theme-text-secondary">
                    {logo.website_url || "-"}
                  </td>
                  <td className="px-3 py-4 text-xl font-black theme-text">{logo.sort_order}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${logo.is_visible ? "border-green-400/50 bg-green-500/10 text-green-300" : "border-yellow-400/50 bg-yellow-500/10 text-yellow-200"}`}>
                      {logo.is_visible ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-3 py-4 theme-text-muted">{formatDate(logo.updated_at)}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <AdminButton type="button" variant="secondary" onClick={() => setEditingLogo(logo)}>
                        Edit
                      </AdminButton>
                      <AdminButton type="button" variant="ghost" onClick={() => void setVisibility(logo)}>
                        {logo.is_visible ? "Hide" : "Show"}
                      </AdminButton>
                      <AdminButton type="button" variant="danger" onClick={() => setDeletingLogo(logo)}>
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
            title="No business logos found"
            description="Add a Google Drive logo URL to show a business on the public Partners page."
          />
        </div>
      )}

      <BusinessLogoModal
        open={addOpen}
        title="Add Business Logo"
        submitLabel="Add Logo"
        saving={saving}
        onClose={() => setAddOpen(false)}
        onSubmit={(event) => submitLogo(event)}
      />

      <BusinessLogoModal
        key={editingLogo?.id ?? "edit-logo"}
        open={Boolean(editingLogo)}
        title="Edit Business Logo"
        submitLabel="Save Changes"
        saving={saving}
        logo={editingLogo}
        onClose={() => setEditingLogo(null)}
        onSubmit={(event) => editingLogo ? submitLogo(event, editingLogo.id) : undefined}
      />

      <AdminModal
        open={Boolean(deletingLogo)}
        title="Delete Business Logo?"
        description={deletingLogo ? `${deletingLogo.business_name} will be removed from the public Partners page.` : undefined}
        onClose={() => setDeletingLogo(null)}
        size="sm"
        footer={
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminButton type="button" variant="secondary" onClick={() => setDeletingLogo(null)}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" form="delete-business-logo-form" variant="danger" disabled={saving}>
              {saving ? "Deleting..." : "Delete Logo"}
            </AdminButton>
          </div>
        }
      >
        <form id="delete-business-logo-form" onSubmit={deleteLogo}>
          <p className="text-sm leading-6 theme-text-secondary">
            This permanently deletes only the public partner logo record. It does not delete anything from Google Drive.
          </p>
        </form>
      </AdminModal>
    </section>
  );
}

function BusinessLogoModal({
  open,
  title,
  submitLabel,
  saving,
  logo,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  saving: boolean;
  logo?: BusinessLogoRow | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const formId = logo ? `business-logo-form-${logo.id}` : "business-logo-form-new";

  return (
    <AdminModal
      open={open}
      title={title}
      description="Paste a public Google Drive sharing URL. No image files are uploaded to Supabase."
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
        <label className="grid gap-2 text-sm font-bold theme-text">
          Business Name
          <input
            name="business_name"
            defaultValue={logo?.business_name ?? ""}
            className={adminFieldClass}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold theme-text">
          Google Drive Logo URL
          <input
            name="logo_url"
            type="url"
            defaultValue={logo?.logo_url ?? ""}
            className={adminFieldClass}
            placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
            required
          />
          <span className="text-xs font-medium leading-5 theme-text-muted">
            Make sure the Google Drive file is shared as &quot;Anyone with the link - Viewer&quot;.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold theme-text">
          Website / Facebook URL
          <input
            name="website_url"
            type="url"
            defaultValue={logo?.website_url ?? ""}
            className={adminFieldClass}
            placeholder="https://..."
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold theme-text">
            Sort Order
            <input
              name="sort_order"
              type="number"
              step="1"
              defaultValue={logo?.sort_order ?? 0}
              className={adminFieldClass}
              required
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 self-end rounded-lg border theme-border px-3 text-sm font-bold theme-text">
            <input
              name="is_visible"
              type="checkbox"
              defaultChecked={logo?.is_visible ?? true}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Visible
          </label>
        </div>
      </form>
    </AdminModal>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
  });
}
