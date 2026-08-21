"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatPhp } from "@/lib/format";
import {
  getInventoryStatusClass,
  getInventoryStatusLabel,
} from "@/lib/inventory-status";
import type { InventoryDashboardData } from "@/lib/inventory";

const adjustmentReasons = [
  { value: "manual_adjustment", label: "Manual adjustment" },
  { value: "damage", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "promotional_giveaway", label: "Promotional giveaway" },
  { value: "sample_unit", label: "Sample unit" },
  { value: "inventory_correction", label: "Inventory correction" },
  { value: "returned_item", label: "Returned item" },
  { value: "other", label: "Other" },
] as const;

export function InventoryManager({ data }: { data: InventoryDashboardData }) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(data.items[0]?.product.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [restockKey, setRestockKey] = useState(() => crypto.randomUUID());
  const [adjustmentKey, setAdjustmentKey] = useState(() => crypto.randomUUID());

  const selectedProduct = useMemo(
    () => data.items.find((item) => item.product.id === selectedProductId)?.product,
    [data.items, selectedProductId],
  );
  const selectedTracked = selectedProduct?.track_inventory ?? true;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    formData.set("product_id", selectedProductId);

    const response = await fetch("/api/admin/inventory/adjust", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok || result.error) {
      setError(result.error ?? "Inventory adjustment failed.");
      return;
    }

    event.currentTarget.reset();
    if (formData.get("flow") === "restock") {
      setRestockKey(crypto.randomUUID());
    } else {
      setAdjustmentKey(crypto.randomUUID());
    }
    setMessage("Inventory updated.");
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      {message ? (
        <p className="rounded-md border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Units In Stock" value={data.summary.totalUnits.toLocaleString("en-PH")} />
        <SummaryCard label="Inventory Value" value={formatPhp(data.summary.inventoryValue)} />
        <SummaryCard label="Low Stock Products" value={String(data.summary.lowStockProducts)} />
        <SummaryCard label="Out of Stock Products" value={String(data.summary.outOfStockProducts)} />
      </section>

      <section className="rounded-lg border p-4 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black theme-text">Inventory Actions</h2>
            <p className="mt-1 text-sm theme-text-muted">
              Every stock change creates a movement entry.
            </p>
          </div>
          <Link href="/admin/inventory/history" className="text-sm font-bold theme-accent">
            View History
          </Link>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr_1fr]">
          <label className="grid gap-2 text-sm font-bold theme-text">
            Product
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className={fieldClass}
            >
              {data.items.map((item) => (
                <option key={item.product.id} value={item.product.id}>
                  {item.product.name}
                </option>
              ))}
            </select>
            {selectedProduct ? (
              <span className="text-xs font-semibold theme-text-muted">
                Current stock: {selectedProduct.current_stock ?? 0}
              </span>
            ) : null}
          </label>

          <form onSubmit={submit} className="rounded-lg border p-4 theme-subtle">
            <input type="hidden" name="flow" value="restock" />
            <input type="hidden" name="idempotency_key" value={restockKey} />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] theme-accent">Add Stock</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Quantity received" name="quantity" type="number" min="1" required />
              <Field label="Cost per unit" name="unit_cost" type="number" min="0" prefix="₱" required />
              <Field label="Supplier" name="supplier" />
              <Field label="Freight cost" name="freight_cost" type="number" min="0" prefix="₱" />
              <Field label="Date received" name="received_at" type="date" />
              <label className="flex min-h-11 items-center gap-2 rounded-md border theme-border px-3 text-sm font-bold theme-text">
                <input name="update_unit_cost" type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
                Update cost
              </label>
            </div>
            <TextArea label="Notes" name="notes" />
            <SubmitButton saving={saving} disabled={!selectedTracked} label={selectedTracked ? "Add Stock" : "Not Tracked"} />
          </form>

          <form onSubmit={submit} className="rounded-lg border p-4 theme-subtle">
            <input type="hidden" name="flow" value="adjust" />
            <input type="hidden" name="idempotency_key" value={adjustmentKey} />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] theme-accent">Adjust Stock</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold theme-text">
                Adjustment
                <select name="adjustment_action" className={fieldClass} defaultValue="remove">
                  <option value="add">Add</option>
                  <option value="remove">Remove</option>
                </select>
              </label>
              <Field label="Quantity" name="quantity" type="number" min="1" required />
              <label className="grid gap-2 text-sm font-bold theme-text sm:col-span-2">
                Reason
                <select name="movement_type" className={fieldClass} defaultValue="damage">
                  {adjustmentReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <TextArea label="Notes" name="notes" />
            <SubmitButton saving={saving} disabled={!selectedTracked} label={selectedTracked ? "Save Adjustment" : "Not Tracked"} />
          </form>
        </div>
      </section>

      <section className="rounded-lg border p-4 theme-card">
        <h2 className="text-lg font-black theme-text">Current Inventory</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="text-left theme-text-muted">
              <tr>
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">SKU</th>
                <th className="pb-3 font-semibold">Current Stock</th>
                <th className="pb-3 font-semibold">Unit Cost</th>
                <th className="pb-3 font-semibold">Inventory Value</th>
                <th className="pb-3 font-semibold">Threshold</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.items.map((item) => (
                <tr key={item.product.id}>
                  <td className="py-3 font-bold theme-text">{item.product.name}</td>
                  <td className="py-3 theme-text-muted">{item.product.sku || "Not set"}</td>
                  <td className="py-3 theme-text">{item.product.current_stock ?? 0}</td>
                  <td className="py-3 theme-text">{formatPhp(Number(item.product.current_unit_cost ?? 0))}</td>
                  <td className="py-3 theme-text">{formatPhp(item.inventoryValue)}</td>
                  <td className="py-3 theme-text-muted">{item.product.low_stock_threshold ?? 0}</td>
                  <td className="py-3">
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold ${getInventoryStatusClass(item.status)}`}>
                      {getInventoryStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-lg border p-5 theme-card">
      <p className="text-sm font-bold theme-text">{label}</p>
      <p className="mt-4 text-3xl font-black theme-accent">{value}</p>
    </section>
  );
}

const fieldClass =
  "min-h-11 rounded-md border theme-border bg-[var(--surface-secondary)] px-3 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25";

function Field({
  label,
  name,
  type = "text",
  min,
  prefix,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  min?: string;
  prefix?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold theme-text">
      {label}
      <span className={prefix ? "relative" : ""}>
        {prefix ? <span className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted">{prefix}</span> : null}
        <input
          name={name}
          type={type}
          min={min}
          required={required}
          className={`${fieldClass} w-full ${prefix ? "pl-8" : ""}`}
        />
      </span>
    </label>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <label className="mt-3 grid gap-2 text-sm font-bold theme-text">
      {label}
      <textarea
        name={name}
        rows={3}
        className="rounded-md border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25"
      />
    </label>
  );
}

function SubmitButton({ saving, disabled, label }: { saving: boolean; disabled?: boolean; label: string }) {
  return (
    <button
      disabled={saving || disabled}
      className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "Saving..." : label}
    </button>
  );
}
