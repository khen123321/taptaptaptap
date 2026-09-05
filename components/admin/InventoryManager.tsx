"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatPhp } from "@/lib/format";
import {
  getInventoryStatusClass,
  getInventoryStatusLabel,
} from "@/lib/inventory-status";
import type { InventoryDashboardData } from "@/lib/inventory";
import type { SaleExpenseType, SalePackageType } from "@/types/database";
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

const saleDeductionTypes: Array<{ value: SaleExpenseType; label: string }> = [
  { value: "gas_transportation", label: "Gas / Transportation" },
  { value: "shipping_delivery", label: "Shipping / Delivery" },
  { value: "packaging", label: "Packaging" },
  { value: "printing_customization", label: "Printing / Customization" },
  { value: "commission", label: "Commission" },
  { value: "other", label: "Other" },
];

type DeductionDraft = {
  id: string;
  expenseType: SaleExpenseType;
  amount: string;
  description: string;
};

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
  const [bulkQuantity, setBulkQuantity] = useState(10);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [deductions, setDeductions] = useState<DeductionDraft[]>([]);

  const selectedProduct = useMemo(
    () => data.items.find((item) => item.product.id === selectedProductId)?.product,
    [data.items, selectedProductId],
  );
  const selectedTracked = selectedProduct?.track_inventory ?? true;
  const singlePrice = Number(selectedProduct?.default_physical_price ?? selectedProduct?.price_single ?? 0);
  const bundlePrice = Number(selectedProduct?.price_bundle ?? singlePrice * 2);
  const bundleSavings = Math.max(singlePrice * 2 - bundlePrice, 0);
  const bulkEnabled = selectedProduct?.bulk_enabled ?? false;
  const bulkTier1Min = Number(selectedProduct?.bulk_tier_1_min ?? 10);
  const bulkTier1Max = Number(selectedProduct?.bulk_tier_1_max ?? 24);
  const bulkTier1UnitPrice = selectedProduct?.bulk_tier_1_unit_price == null ? null : Number(selectedProduct.bulk_tier_1_unit_price);
  const bulkTier2Min = Number(selectedProduct?.bulk_tier_2_min ?? 25);
  const bulkTier2UnitPrice = selectedProduct?.bulk_tier_2_unit_price == null ? null : Number(selectedProduct.bulk_tier_2_unit_price);
  const bulkTier =
    bulkQuantity >= bulkTier2Min
      ? { label: `${bulkTier2Min}+ Cards`, unitPrice: bulkTier2UnitPrice }
      : bulkQuantity >= bulkTier1Min && bulkQuantity <= bulkTier1Max
        ? { label: `${bulkTier1Min}-${bulkTier1Max} Cards`, unitPrice: bulkTier1UnitPrice }
        : null;
  const bulkRegularValue = singlePrice * bulkQuantity;
  const bulkTotal = bulkTier?.unitPrice == null ? 0 : bulkQuantity * bulkTier.unitPrice;
  const bulkSavings = Math.max(bulkRegularValue - bulkTotal, 0);
  const bulkQuantityMessage =
    bulkQuantity === 1
      ? "Use Buy 1 instead."
      : bulkQuantity === 2
        ? "Use Buy 2 instead."
        : bulkQuantity >= 3 && bulkQuantity < bulkTier1Min
          ? "Bulk pricing starts at 10 units."
          : "";
  const bulkReady = bulkEnabled && bulkTier?.unitPrice != null && bulkQuantity >= bulkTier1Min;
  const saleQuantity = salePackage === "buy_1" ? 1 : salePackage === "buy_2" ? 2 : salePackage === "bulk" ? bulkQuantity : customQuantity;
  const saleAmount =
    salePackage === "buy_1"
      ? singlePrice
      : salePackage === "buy_2"
        ? bundlePrice
        : salePackage === "bulk"
          ? bulkTotal
          : Number(customAmount || 0);
  const grossValue =
    salePackage === "buy_1"
      ? singlePrice
      : salePackage === "buy_2"
        ? singlePrice * 2
        : salePackage === "bulk"
          ? bulkRegularValue
          : singlePrice * customQuantity;
  const saleDiscount = Math.max(grossValue - saleAmount, 0);
  const totalDirectDeductions = deductions.reduce((sum, deduction) => {
    const amount = Number(deduction.amount || 0);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const netAfterDeductions = saleAmount - totalDirectDeductions;
  const hasSaleStock = selectedTracked && Boolean(selectedProduct) && Number(selectedProduct?.current_stock ?? 0) >= saleQuantity;
  const canSaveSale = selectedTracked && Boolean(selectedProduct) && (salePackage !== "bulk" || bulkReady);
  const canMarkSold = canSaveSale && hasSaleStock && (salePackage !== "custom" || saleAmount >= 0);

  const addDeduction = () => {
    setDeductions((current) => [
      ...current,
      { id: crypto.randomUUID(), expenseType: "gas_transportation", amount: "", description: "" },
    ]);
  };

  const updateDeduction = (id: string, changes: Partial<Omit<DeductionDraft, "id">>) => {
    setDeductions((current) =>
      current.map((deduction) => (deduction.id === id ? { ...deduction, ...changes } : deduction)),
    );
  };

  const removeDeduction = (id: string) => {
    setDeductions((current) => current.filter((deduction) => deduction.id !== id));
  };

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
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    formData.set("product_id", selectedProductId);
    formData.set("package_type", salePackage);
    formData.set("sale_status", submitter?.value === "pending" ? "pending" : "completed");

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
    setBulkQuantity(10);
    setDeductions([]);
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
        <SummaryCard label="Sold Today" value={data.summary.sales ? data.summary.sales.soldToday.toLocaleString("en-PH") : "Unavailable"} />
        <SummaryCard label="Sales Today" value={data.summary.sales ? formatPhp(data.summary.sales.salesToday) : "Unavailable"} />
        <SummaryCard label="Orders Today" value={data.summary.sales ? data.summary.sales.ordersToday.toLocaleString("en-PH") : "Unavailable"} />
        <SummaryCard label="Direct Deductions Today" value={data.summary.sales ? formatPhp(data.summary.sales.directDeductionsToday) : "Unavailable"} />
        <SummaryCard label="Net After Deductions Today" value={data.summary.sales ? formatPhp(data.summary.sales.netAfterDirectDeductionsToday) : "Unavailable"} />
        <SummaryCard label="Low Stock Products" value={String(data.summary.lowStockProducts)} />
        <SummaryCard label="Out of Stock Products" value={String(data.summary.outOfStockProducts)} />
      </section>
      {data.salesError ? (
        <p className="rounded-md border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-200">
          Sales data unavailable. Inventory stock data is still shown.
        </p>
      ) : null}

      {saleResult ? (
        <section className="rounded-lg border border-green-400/40 bg-green-500/10 p-4">
          <p className="text-sm font-black text-green-300">
            {saleResult.status === "pending" ? "Pending Sale Saved" : "Sale Recorded"}
          </p>
          <p className="mt-2 text-xl font-black theme-text">Sale #{saleResult.saleNumber}</p>
          <p className="mt-1 text-sm theme-text-secondary">
            {saleResult.productName} • {saleResult.packageLabel} × {saleResult.quantity} units • {formatPhp(Number(saleResult.finalAmount))}
          </p>
          <p className="mt-1 text-sm theme-text-muted">
            Deductions: {formatPhp(Number(saleResult.totalDirectDeductions))} • Net: {formatPhp(Number(saleResult.netAfterDeductions))}
          </p>
          <p className="mt-1 text-sm theme-text-muted">
            Stock: {saleResult.previousStock == null || saleResult.newStock == null ? "No change" : `${saleResult.previousStock} → ${saleResult.newStock}`} • Payment: {paymentLabel(saleResult.paymentMethod)}
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
            {deductions.map((deduction) => (
              <Fragment key={`${deduction.id}-inputs`}>
                <input type="hidden" name="expense_type" value={deduction.expenseType} />
                <input type="hidden" name="expense_amount" value={deduction.amount} />
                <input type="hidden" name="expense_description" value={deduction.description} />
              </Fragment>
            ))}
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
                label="Bulk / Reseller"
                detail={bulkEnabled ? "Official card tier pricing" : "Not enabled for this product"}
                selected={salePackage === "bulk"}
                onClick={() => setSalePackage("bulk")}
                disabled={!bulkEnabled}
              />
              <PackageButton
                label="Custom"
                detail="Negotiated quantity and amount"
                selected={salePackage === "custom"}
                onClick={() => setSalePackage("custom")}
              />
            </div>

            {salePackage === "bulk" ? (
              <div className="mt-4 grid gap-3 rounded-md border theme-border p-3">
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Quantity
                  <input
                    name="bulk_quantity"
                    type="number"
                    min="1"
                    value={bulkQuantity}
                    onChange={(event) => setBulkQuantity(Number(event.target.value || 1))}
                    className={fieldClass}
                    required
                  />
                </label>
                <div className="grid gap-2 text-sm">
                  <PriceRow label="Pricing Tier" value={bulkTier?.label ?? "Not eligible"} />
                  <PriceRow label="Bulk Price" value={bulkTier?.unitPrice == null ? "-" : `${formatPhp(bulkTier.unitPrice)} / card`} />
                  <PriceRow label="Regular Value" value={formatPhp(bulkRegularValue)} />
                  <PriceRow label="Bulk Total" value={bulkReady ? formatPhp(bulkTotal) : "-"} strong />
                  <PriceRow label="Savings" value={bulkReady ? formatPhp(bulkSavings) : "-"} />
                  <PriceRow label="Available Stock" value={String(selectedProduct?.current_stock ?? 0)} />
                </div>
                {bulkQuantityMessage ? (
                  <p className="rounded-md border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-200">
                    {bulkQuantityMessage}
                  </p>
                ) : null}
              </div>
            ) : null}

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
            <div className="mt-4 rounded-md border theme-border p-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-black uppercase tracking-[0.14em] theme-accent">Sale Deductions</h4>
                <button
                  type="button"
                  onClick={addDeduction}
                  className="rounded-md border theme-border px-3 py-2 text-xs font-bold theme-text hover:border-[var(--accent)]"
                >
                  + Add Deduction
                </button>
              </div>
              {deductions.length ? (
                <div className="mt-3 grid gap-3">
                  {deductions.map((deduction) => (
                    <div key={deduction.id} className="grid gap-2 rounded-md border theme-border p-3">
                      <label className="grid gap-2 text-xs font-bold theme-text">
                        Type
                        <select
                          value={deduction.expenseType}
                          onChange={(event) => updateDeduction(deduction.id, { expenseType: event.target.value as SaleExpenseType })}
                          className={fieldClass}
                        >
                          {saleDeductionTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-xs font-bold theme-text">
                        Amount
                        <span className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted">₱</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={deduction.amount}
                            onChange={(event) => updateDeduction(deduction.id, { amount: event.target.value })}
                            className={`${fieldClass} w-full pl-8`}
                            required
                          />
                        </span>
                      </label>
                      <label className="grid gap-2 text-xs font-bold theme-text">
                        Notes
                        <input
                          value={deduction.description}
                          onChange={(event) => updateDeduction(deduction.id, { description: event.target.value })}
                          className={fieldClass}
                          placeholder="Optional"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeDeduction(deduction.id)}
                        className="justify-self-start rounded-md border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-md border theme-border p-3 text-sm theme-text-muted">No deductions</p>
              )}
            </div>
            <div className="mt-4 grid gap-2 rounded-md border theme-border p-3 text-sm">
              <PriceRow label="Gross Value" value={formatPhp(grossValue)} />
              <PriceRow label="Discount" value={formatPhp(saleDiscount)} />
              <PriceRow label="Customer Pays" value={formatPhp(saleAmount)} strong />
              <PriceRow label="Direct Deductions" value={formatPhp(totalDirectDeductions)} />
              <PriceRow label="Net After Deductions" value={formatPhp(netAfterDeductions)} strong />
            </div>
            {!hasSaleStock ? (
              <p className="mt-3 text-sm font-semibold text-red-300">
                {selectedTracked ? `Insufficient stock for ${salePackage === "buy_2" ? "Buy 2" : "this sale"}.` : "Inventory is not tracked for this product."}
              </p>
            ) : null}
            {salePackage === "bulk" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SubmitButton saving={saving} disabled={!canSaveSale} label="Save Pending" value="pending" />
                <SubmitButton saving={saving} disabled={!canMarkSold} label="Mark as Sold Now" value="completed" />
              </div>
            ) : (
              <SubmitButton saving={saving} disabled={!canMarkSold} label="Record Sale" value="completed" />
            )}
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
          {data.salesError ? (
            <p className="rounded-md border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm font-semibold text-yellow-200">
              Sales data unavailable.
            </p>
          ) : data.todaySales.length ? data.todaySales.map((sale) => (
            <div key={sale.sale.id} className="grid gap-2 rounded-md border p-3 theme-subtle sm:grid-cols-[90px_1fr_auto_auto] sm:items-center">
              <p className="text-sm font-bold theme-text-muted">{formatSaleTime(sale.sale.created_at)}</p>
              <p className="font-bold theme-text">{sale.productName}</p>
              <p className="text-sm theme-text-secondary">×{sale.quantity}</p>
              <p className="font-black theme-accent">
                {formatPhp(sale.finalAmount)} · Net {formatPhp(sale.netAfterDeductions)} · {paymentLabel(sale.paymentMethod)}
              </p>
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
                  <td className="py-3 theme-text">{item.soldToday ?? "Unavailable"}</td>
                  <td className="py-3 theme-text">{item.totalSold ?? "Unavailable"}</td>
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

function PriceRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold theme-text-muted">{label}</span>
      <span className={strong ? "text-base font-black theme-accent" : "font-bold theme-text"}>
        {value}
      </span>
    </div>
  );
}

function PackageButton({
  label,
  detail,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-12 rounded-md border px-3 py-2 text-left transition ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "theme-border bg-[var(--surface-secondary)] hover:border-[var(--accent)]"
      } disabled:cursor-not-allowed disabled:opacity-55`}
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

function SubmitButton({ saving, disabled, label, value }: { saving: boolean; disabled?: boolean; label: string; value?: string }) {
  return (
    <button
      disabled={saving || disabled}
      value={value}
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
