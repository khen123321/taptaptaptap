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
import type { SalePackageType } from "@/types/database";
import type { SaleResult } from "@/lib/sales";

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
  const [saleKey, setSaleKey] = useState(() => crypto.randomUUID());
  const [salePackage, setSalePackage] = useState<SalePackageType>("buy_1");
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customAmount, setCustomAmount] = useState("");
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);

  const selectedProduct = useMemo(
    () => data.items.find((item) => item.product.id === selectedProductId)?.product,
    [data.items, selectedProductId],
  );
  const selectedTracked = selectedProduct?.track_inventory ?? true;
  const singlePrice = Number(selectedProduct?.default_physical_price ?? selectedProduct?.price_single ?? 0);
  const bundlePrice = Number(selectedProduct?.price_bundle ?? singlePrice * 2);
  const bundleSavings = Math.max(singlePrice * 2 - bundlePrice, 0);
  const saleQuantity = salePackage === "buy_1" ? 1 : salePackage === "buy_2" ? 2 : customQuantity;
  const saleAmount = salePackage === "buy_1" ? singlePrice : salePackage === "buy_2" ? bundlePrice : Number(customAmount || 0);
  const hasSaleStock = selectedTracked && Boolean(selectedProduct) && Number(selectedProduct?.current_stock ?? 0) >= saleQuantity;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    setSaleResult(null);

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

  const submitSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    setSaleResult(null);

    const formData = new FormData(event.currentTarget);
    formData.set("product_id", selectedProductId);
    formData.set("package_type", salePackage);

    const response = await fetch("/api/admin/sales/quick", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { sale?: SaleResult; error?: string };
    setSaving(false);

    if (!response.ok || result.error || !result.sale) {
      setError(result.error ?? "Failed to record sale.");
      return;
    }

    event.currentTarget.reset();
    setSaleKey(crypto.randomUUID());
    setSalePackage("buy_1");
    setCustomQuantity(1);
    setCustomAmount("");
    setSaleResult(result.sale);
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
        <SummaryCard label="Sold Today" value={data.summary.sales.soldToday.toLocaleString("en-PH")} />
        <SummaryCard label="Sales Today" value={formatPhp(data.summary.sales.salesToday)} />
        <SummaryCard label="Orders Today" value={data.summary.sales.ordersToday.toLocaleString("en-PH")} />
        <SummaryCard label="Low Stock Products" value={String(data.summary.lowStockProducts)} />
        <SummaryCard label="Out of Stock Products" value={String(data.summary.outOfStockProducts)} />
      </section>

      {saleResult ? (
        <section className="rounded-lg border border-green-400/40 bg-green-500/10 p-4">
          <p className="text-sm font-black text-green-300">Sale Recorded</p>
          <p className="mt-2 text-xl font-black theme-text">Sale #{saleResult.saleNumber}</p>
          <p className="mt-1 text-sm theme-text-secondary">
            {saleResult.productName} • {saleResult.packageLabel} × {saleResult.quantity} units • {formatPhp(Number(saleResult.finalAmount))}
          </p>
          <p className="mt-1 text-sm theme-text-muted">
            Stock: {saleResult.previousStock} → {saleResult.newStock} • Payment: {paymentLabel(saleResult.paymentMethod)}
          </p>
        </section>
      ) : null}

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

        <div className="mt-5 grid gap-5 xl:grid-cols-[280px_1fr_1fr_1fr]">
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

          <form onSubmit={submitSale} className="rounded-lg border p-4 theme-subtle">
            <input type="hidden" name="idempotency_key" value={saleKey} />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] theme-accent">Quick Sale</h3>
            <p className="mt-3 text-xs font-semibold theme-text-muted">
              Available Stock: {selectedProduct?.current_stock ?? 0}
            </p>

            <div className="mt-4 grid gap-2">
              <PackageButton
                label="Buy 1"
                detail={formatPhp(singlePrice)}
                selected={salePackage === "buy_1"}
                onClick={() => setSalePackage("buy_1")}
              />
              <PackageButton
                label="Buy 2"
                detail={`${formatPhp(bundlePrice)}${bundleSavings > 0 ? ` • Save ${formatPhp(bundleSavings)}` : ""}`}
                selected={salePackage === "buy_2"}
                onClick={() => setSalePackage("buy_2")}
              />
              <PackageButton
                label="Custom"
                detail="Negotiated quantity and amount"
                selected={salePackage === "custom"}
                onClick={() => setSalePackage("custom")}
              />
            </div>

            {salePackage === "custom" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Quantity
                  <input
                    name="custom_quantity"
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(event) => setCustomQuantity(Number(event.target.value || 1))}
                    className={fieldClass}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Amount
                  <span className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted">₱</span>
                    <input
                      name="custom_amount"
                      type="number"
                      min="0"
                      value={customAmount}
                      onChange={(event) => setCustomAmount(event.target.value)}
                      className={`${fieldClass} w-full pl-8`}
                      required
                    />
                  </span>
                </label>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold theme-text">
                Payment
                <select name="payment_method" className={fieldClass} defaultValue="gcash">
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <Field label="Reference" name="reference_number" />
            </div>
            <TextArea label="Notes" name="notes" />
            {!hasSaleStock ? (
              <p className="mt-3 text-sm font-semibold text-red-300">
                {selectedTracked ? `Insufficient stock for ${salePackage === "buy_2" ? "Buy 2" : "this sale"}.` : "Inventory is not tracked for this product."}
              </p>
            ) : null}
            <SubmitButton saving={saving} disabled={!hasSaleStock || (salePackage === "custom" && saleAmount < 0)} label="Record Sale" />
          </form>
        </div>
      </section>

      <section className="rounded-lg border p-4 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black theme-text">Today&apos;s Sales</h2>
          <Link href="/admin/sales?date=today" className="text-sm font-bold theme-accent">
            View All Sales
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {data.todaySales.length ? data.todaySales.map((sale) => (
            <div key={sale.sale.id} className="grid gap-2 rounded-md border p-3 theme-subtle sm:grid-cols-[90px_1fr_auto_auto] sm:items-center">
              <p className="text-sm font-bold theme-text-muted">{formatSaleTime(sale.sale.created_at)}</p>
              <p className="font-bold theme-text">{sale.productName}</p>
              <p className="text-sm theme-text-secondary">×{sale.quantity}</p>
              <p className="font-black theme-accent">{formatPhp(sale.finalAmount)} · {paymentLabel(sale.paymentMethod)}</p>
            </div>
          )) : (
            <p className="rounded-md border theme-border p-4 text-sm theme-text-muted">No completed sales today.</p>
          )}
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
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Sold Today</th>
                <th className="pb-3 font-semibold">Total Sold</th>
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
                  <td className="py-3 theme-text">{item.soldToday}</td>
                  <td className="py-3 theme-text">{item.totalSold}</td>
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

function PackageButton({
  label,
  detail,
  selected,
  onClick,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-md border px-3 py-2 text-left transition ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "theme-border bg-[var(--surface-secondary)] hover:border-[var(--accent)]"
      }`}
    >
      <span className="block text-sm font-black theme-text">{label}</span>
      <span className="mt-1 block text-xs font-semibold theme-text-muted">{detail}</span>
    </button>
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

function paymentLabel(value: string) {
  if (value === "gcash") return "GCash";
  if (value === "bank_transfer") return "Bank Transfer";
  if (value === "cash") return "Cash";
  return "Other";
}

function formatSaleTime(value: string) {
  return new Date(value).toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  });
}
