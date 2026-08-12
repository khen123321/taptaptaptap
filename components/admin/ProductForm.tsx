"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { DbProductType, ProductRow } from "@/types/database";

const defaultFeatures = [
  "Free nationwide shipping",
  "Initial NFC setup & programming",
  "Ready-to-use setup",
  "Setup assistance",
  "No monthly subscription",
];

const uploadErrorMessage = "Please upload a PNG, JPG, JPEG, or WEBP image under 5 MB.";
const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

type ImageField = "card_image_url" | "detail_image_url" | "mockup_image_url";

export function ProductForm({
  product,
  action,
  saved,
  error,
}: {
  product?: ProductRow | null;
  action: string;
  saved?: boolean;
  error?: string;
}) {
  const router = useRouter();
  const isExisting = Boolean(product?.id);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error ?? "");
  const [productType, setProductType] = useState<DbProductType>(product?.product_type ?? "standard");
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product?.slug));
  const [features, setFeatures] = useState<string[]>(
    product?.included_features?.length ? product.included_features : defaultFeatures,
  );
  const [images, setImages] = useState<Record<ImageField, string>>({
    card_image_url: product?.card_image_url ?? "",
    detail_image_url: product?.detail_image_url ?? "",
    mockup_image_url: product?.mockup_image_url ?? "",
  });
  const [useStorefrontForDetails, setUseStorefrontForDetails] = useState(
    !product || !product.detail_image_url || product.detail_image_url === product.card_image_url,
  );
  const [uploading, setUploading] = useState<ImageField | null>(null);
  const [uploadedFields, setUploadedFields] = useState<Set<ImageField>>(() => new Set());
  const [uploadId] = useState(() => product?.id ?? crypto.randomUUID());

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const featureText = useMemo(() => features.map((feature) => feature.trim()).filter(Boolean).join("\n"), [features]);
  const detailImageUrl = useStorefrontForDetails ? images.card_image_url : images.detail_image_url;

  const uploadImage = async (field: ImageField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!allowedImageTypes.has(file.type) || file.size > maxImageSize) {
      setErrorMessage(uploadErrorMessage);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append(product?.id ? "product_id" : "upload_id", uploadId);

    setUploading(field);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { imageUrl?: string; error?: string };

      if (!response.ok || !result.imageUrl) {
        setErrorMessage(mapUploadError(response.status, result.error));
        return;
      }

      setImages((current) => ({ ...current, [field]: result.imageUrl }));
      setUploadedFields((current) => new Set(current).add(field));
      setDirty(true);
    } catch {
      setErrorMessage("Image upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const removeImage = (field: ImageField) => {
    setImages((current) => ({ ...current, [field]: "" }));
    setUploadedFields((current) => {
      const next = new Set(current);
      next.delete(field);
      return next;
    });
    setDirty(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    formData.set("included_features", featureText);
    formData.set("detail_image_url", detailImageUrl);

    const response = await fetch(action, {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { redirectTo?: string; error?: string };
    setSaving(false);

    if (!response.ok || result.error) {
      setErrorMessage(result.error ?? "Failed to save product.");
      return;
    }

    setDirty(false);
    router.push(result.redirectTo ?? "/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={submit} onChange={() => setDirty(true)} className="grid gap-5">
      {saved ? (
        <p className="rounded-md border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          Saved successfully.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold theme-text">
          Product Name
          <input
            name="name"
            value={name}
            required
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              if (!slugEdited) setSlug(slugify(nextName));
            }}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold theme-text">
          Slug
          <input
            name="slug"
            value={slug}
            required
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.target.value));
            }}
            className={fieldClass}
          />
        </label>
      </div>

      <Field label="Short Description" name="short_description" defaultValue={product?.short_description} />
      <TextArea label="Full Description" name="description" defaultValue={product?.description} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Select
          label="Product Type"
          name="product_type"
          value={productType}
          onChange={(event) => {
            setProductType(event.target.value as DbProductType);
            setDirty(true);
          }}
        >
          <option value="standard">Standard</option>
          <option value="custom">Custom Branded</option>
        </Select>
        <Field label="Category" name="category" defaultValue={product?.category ?? "nfc-signs"} />
        <Select label="Status" name="status" defaultValue={product?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <Field label="Buy 1 Price" name="price_single" type="number" min="0" defaultValue={product?.price_single ?? 899} prefix="₱" required />
        <Field label="Buy 2 Price" name="price_bundle" type="number" min="0" defaultValue={product?.price_bundle ?? 1499} prefix="₱" />
        <Field label="Bundle Savings" name="bundle_savings" type="number" min="0" defaultValue={product?.bundle_savings ?? 299} prefix="₱" />
        <Field label="Display Order" name="display_order" type="number" step="1" defaultValue={product?.display_order ?? 0} />
      </div>

      <section className="grid gap-5 rounded-lg border p-4 theme-card">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] theme-accent">Product Images</h2>
          <p className="mt-1 text-sm theme-text-muted">
            Upload images here. Storage URLs are generated and saved automatically.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <ImageUploadPanel
            label="Storefront Card Image"
            helper="Shown on the product card in the storefront."
            inputName="card_image_url"
            value={images.card_image_url}
            onUpload={(event) => uploadImage("card_image_url", event)}
            onRemove={() => removeImage("card_image_url")}
            uploading={uploading === "card_image_url"}
            uploaded={uploadedFields.has("card_image_url")}
          />

          <DetailsImagePanel
            cardImageUrl={images.card_image_url}
            detailImageUrl={images.detail_image_url}
            useStorefront={useStorefrontForDetails}
            onUseStorefrontChange={(checked) => {
              setUseStorefrontForDetails(checked);
              setDirty(true);
            }}
            onUpload={(event) => uploadImage("detail_image_url", event)}
            onRemove={() => removeImage("detail_image_url")}
            uploading={uploading === "detail_image_url"}
            uploaded={uploadedFields.has("detail_image_url")}
          />

          {productType === "custom" ? (
            <ImageUploadPanel
              label="Customizer Mockup Image"
              helper="Blank base image used when customers upload their own design."
              inputName="mockup_image_url"
              value={images.mockup_image_url}
              onUpload={(event) => uploadImage("mockup_image_url", event)}
              onRemove={() => removeImage("mockup_image_url")}
              uploading={uploading === "mockup_image_url"}
              uploaded={uploadedFields.has("mockup_image_url")}
              uploadLabel="Upload Mockup"
              changeLabel="Change Mockup"
              removeLabel="Remove Mockup"
            />
          ) : (
            <input type="hidden" name="mockup_image_url" value={images.mockup_image_url} />
          )}
        </div>
      </section>

      <FeatureEditor features={features} onChange={setFeatures} />
      <input type="hidden" name="included_features" value={featureText} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="CTA Label" name="cta_label" defaultValue={product?.cta_label ?? "Order Standard"} />
        <Field label="CTA Destination" name="cta_href" defaultValue={product?.cta_href ?? "/#contact"} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          disabled={saving || Boolean(uploading)}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-5 text-sm font-bold text-[var(--button-primary-text)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : isExisting ? "Save Changes" : "Create Product"}
        </button>
        <a
          href="/admin/products"
          className="inline-flex min-h-12 items-center justify-center rounded-md border theme-border px-5 text-sm font-bold theme-text"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

const fieldClass =
  "min-h-12 rounded-md border theme-border bg-[var(--surface-secondary)] px-4 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  min,
  step,
  prefix,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
  prefix?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold theme-text">
      {label}
      <span className={prefix ? "relative" : ""}>
        {prefix ? <span className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted">{prefix}</span> : null}
        <input
          name={name}
          type={type}
          required={required}
          min={min}
          step={step}
          defaultValue={defaultValue ?? ""}
          className={`${fieldClass} w-full ${prefix ? "pl-8" : ""}`}
        />
      </span>
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold theme-text">
      {label}
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="rounded-md border theme-border bg-[var(--surface-secondary)] px-4 py-3 text-sm leading-6 theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  value,
  onChange,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold theme-text">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        className={fieldClass}
      >
        {children}
      </select>
    </label>
  );
}

function DetailsImagePanel({
  cardImageUrl,
  detailImageUrl,
  useStorefront,
  onUseStorefrontChange,
  onUpload,
  onRemove,
  uploading,
  uploaded,
}: {
  cardImageUrl: string;
  detailImageUrl: string;
  useStorefront: boolean;
  onUseStorefrontChange: (checked: boolean) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
  uploaded: boolean;
}) {
  const shownImage = useStorefront ? cardImageUrl : detailImageUrl;

  return (
    <div className="rounded-lg border p-4 theme-card">
      <input type="hidden" name="detail_image_url" value={shownImage} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold theme-text">Product Details Image</h3>
          <p className="mt-1 text-xs leading-5 theme-text-muted">Shown when customers open View Details.</p>
        </div>
        {uploaded ? <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-black theme-accent">Uploaded</span> : null}
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs font-bold theme-text">
        <input
          type="checkbox"
          checked={useStorefront}
          onChange={(event) => onUseStorefrontChange(event.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Use storefront image
      </label>

      <ImagePreview value={shownImage} label="Product Details Image" />

      {useStorefront ? (
        <p className="mt-3 text-xs leading-5 theme-text-muted">
          This will save the storefront card image as the Product Details image.
        </p>
      ) : (
        <ImageControls
          inputId="detail_image_url_upload"
          value={detailImageUrl}
          uploading={uploading}
          onUpload={onUpload}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}

function ImageUploadPanel({
  label,
  helper,
  inputName,
  value,
  onUpload,
  onRemove,
  uploading,
  uploaded,
  uploadLabel = "Upload Image",
  changeLabel = "Change Image",
  removeLabel = "Remove Image",
}: {
  label: string;
  helper: string;
  inputName: ImageField;
  value: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
  uploaded: boolean;
  uploadLabel?: string;
  changeLabel?: string;
  removeLabel?: string;
}) {
  return (
    <div className="rounded-lg border p-4 theme-card">
      <input type="hidden" name={inputName} value={value} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold theme-text">{label}</h3>
          <p className="mt-1 text-xs leading-5 theme-text-muted">{helper}</p>
        </div>
        {uploaded ? <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-black theme-accent">Uploaded</span> : null}
      </div>
      <ImagePreview value={value} label={label} />
      <ImageControls
        inputId={`${inputName}_upload`}
        value={value}
        uploading={uploading}
        onUpload={onUpload}
        onRemove={onRemove}
        uploadLabel={uploadLabel}
        changeLabel={changeLabel}
        removeLabel={removeLabel}
      />
    </div>
  );
}

function ImagePreview({ value, label }: { value: string; label: string }) {
  return (
    <div className="mt-3 flex aspect-[4/3] max-h-44 items-center justify-center overflow-hidden rounded-md border theme-border bg-[var(--surface-secondary)]">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={`${label} preview`} className="h-full w-full object-contain" />
      ) : (
        <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.14em] theme-text-muted">
          Image Preview
        </span>
      )}
    </div>
  );
}

function ImageControls({
  inputId,
  value,
  uploading,
  onUpload,
  onRemove,
  uploadLabel = "Upload Image",
  changeLabel = "Change Image",
  removeLabel = "Remove Image",
}: {
  inputId: string;
  value: string;
  uploading: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploadLabel?: string;
  changeLabel?: string;
  removeLabel?: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <label
        htmlFor={inputId}
        className={`inline-flex min-h-10 items-center rounded-md border theme-border px-3 text-sm font-semibold theme-text transition hover:bg-[var(--accent-soft)] ${
          uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {uploading ? "Uploading..." : value ? changeLabel : uploadLabel}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={onUpload}
        disabled={uploading}
      />
      {value ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={uploading}
          className="inline-flex min-h-10 items-center rounded-md border border-red-400/50 px-3 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {removeLabel}
        </button>
      ) : null}
    </div>
  );
}

function FeatureEditor({
  features,
  onChange,
}: {
  features: string[];
  onChange: (features: string[]) => void;
}) {
  const update = (index: number, value: string) => {
    onChange(features.map((feature, featureIndex) => (featureIndex === index ? value : feature)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= features.length) return;
    const next = [...features];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  };

  return (
    <div className="rounded-lg border p-4 theme-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold theme-text">Included Features</h2>
          <p className="mt-1 text-xs theme-text-muted">Stored as a JSONB text array.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...features, ""])}
          className="rounded-md border theme-border px-3 py-2 text-xs font-bold theme-text"
        >
          Add feature
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {features.map((feature, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={feature}
              onChange={(event) => update(index, event.target.value)}
              className={fieldClass}
              placeholder="Feature"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => move(index, -1)} className="rounded-md border theme-border px-3 text-xs font-bold theme-text">Up</button>
              <button type="button" onClick={() => move(index, 1)} className="rounded-md border theme-border px-3 text-xs font-bold theme-text">Down</button>
              <button
                type="button"
                onClick={() => onChange(features.filter((_, featureIndex) => featureIndex !== index))}
                className="rounded-md border border-red-400/50 px-3 text-xs font-bold text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function mapUploadError(status: number, error?: string) {
  if (error?.startsWith("Product image uploads are not configured.")) return error;
  if (status === 400) return error ?? uploadErrorMessage;
  if (status === 401 || status === 403) return "You do not have permission to upload product images.";
  return "Image upload failed. Please try again.";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
