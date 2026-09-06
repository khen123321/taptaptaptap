"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AdminButton,
  AdminEmptyState,
  AdminFormSection,
  AdminMetricCard,
  AdminModal,
  adminFieldClass,
} from "@/components/admin/AdminUI";
import { formatPhp } from "@/lib/format";
import {
  getInventoryStatusClass,
  getInventoryStatusLabel,
} from "@/lib/inventory-status";
import type { InventoryDashboardData } from "@/lib/inventory";
import type { ProductRow, SaleExpenseType, SaleItemPackageType } from "@/types/database";
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

type SaleItemDraft = {
  id: string;
  productId: string;
  packageType: SaleItemPackageType;
  quantity: number;
  customAmount: string;
};

type SaleItemSummary = {
  draft: SaleItemDraft;
  product: ProductRow | undefined;
  quantity: number;
  gross: number;
  discount: number;
  amount: number;
  bulkReady: boolean;
  bulkMessage: string;
  bulkTierLabel: string;
  bulkUnitPrice: number | null;
};

export function InventoryManager({ data }: { data: InventoryDashboardData }) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(data.items[0]?.product.id ?? "");
  const [activeModal, setActiveModal] = useState<"restock" | "adjust" | "sale" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [restockKey, setRestockKey] = useState(() => crypto.randomUUID());
  const [adjustmentKey, setAdjustmentKey] = useState(() => crypto.randomUUID());
  const [saleKey, setSaleKey] = useState(() => crypto.randomUUID());
  const [saleItems, setSaleItems] = useState<SaleItemDraft[]>(() => [
    createSaleItemDraft(data.items[0]?.product.id ?? ""),
  ]);
  const [saleStatus, setSaleStatus] = useState<"pending" | "completed">("completed");
  const [soldDate, setSoldDate] = useState(() => getManilaDateTimeParts().date);
  const [soldTime, setSoldTime] = useState(() => getManilaDateTimeParts().time);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [deductions, setDeductions] = useState<DeductionDraft[]>([]);

  const selectedProduct = useMemo(
    () => data.items.find((item) => item.product.id === selectedProductId)?.product,
    [data.items, selectedProductId],
  );
  const selectedTracked = selectedProduct?.track_inventory ?? true;
  const productById = useMemo(() => new Map(data.items.map((item) => [item.product.id, item.product])), [data.items]);
  const saleItemSummaries = useMemo(
    () => saleItems.map((item) => summarizeSaleItem(item, productById.get(item.productId))),
    [productById, saleItems],
  );
  const saleAmount = saleItemSummaries.reduce((sum, item) => sum + item.amount, 0);
  const grossValue = saleItemSummaries.reduce((sum, item) => sum + item.gross, 0);
  const saleDiscount = saleItemSummaries.reduce((sum, item) => sum + item.discount, 0);
  const totalDirectDeductions = deductions.reduce((sum, deduction) => {
    const amount = Number(deduction.amount || 0);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const netAfterDeductions = saleAmount - totalDirectDeductions;
  const stockRequiredByProduct = saleItemSummaries.reduce<Map<string, number>>((totals, item) => {
    if (!item.product) return totals;
    totals.set(item.product.id, (totals.get(item.product.id) ?? 0) + item.quantity);
    return totals;
  }, new Map());
  const hasSaleStock = [...stockRequiredByProduct].every(([productId, quantity]) => {
    const product = productById.get(productId);
    return Boolean(product?.track_inventory) && Number(product?.current_stock ?? 0) >= quantity;
  });
  const canSaveSale =
    saleItems.length > 0 &&
    saleItemSummaries.every((item) =>
      Boolean(item.product?.track_inventory) &&
      (item.draft.packageType !== "bulk" || item.bulkReady) &&
      (item.draft.packageType !== "custom" || item.amount >= 0),
    );
  const canMarkSold = canSaveSale && hasSaleStock;

  const updateSaleItem = (id: string, changes: Partial<Omit<SaleItemDraft, "id">>) => {
    setSaleItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const addSaleItem = () => {
    setSaleItems((current) => [...current, createSaleItemDraft(data.items[0]?.product.id ?? "")]);
  };

  const removeSaleItem = (id: string) => {
    setSaleItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current);
  };

  const openProductAction = (productId: string, modal: "restock" | "adjust" | "sale") => {
    setSelectedProductId(productId);
    if (modal === "sale") {
      setSaleItems((current) => current.length ? current.map((item, index) => index === 0 ? { ...item, productId } : item) : [createSaleItemDraft(productId)]);
    }
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

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
    closeModal();
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
    const firstItem = saleItems[0];
    formData.set("product_id", firstItem?.productId ?? selectedProductId);
    formData.set("package_type", firstItem?.packageType ?? "buy_1");
    formData.set("sale_items", JSON.stringify(saleItems.map((item) => ({
      productId: item.productId,
      packageType: item.packageType,
      quantity: item.packageType === "buy_1" ? 1 : item.packageType === "buy_2" ? 2 : item.quantity,
      customAmount: item.packageType === "custom" ? Number(item.customAmount || 0) : null,
    }))));
    formData.set("sale_status", saleStatus);

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
    setSaleItems([createSaleItemDraft(data.items[0]?.product.id ?? "")]);
    setSaleStatus("completed");
    const manilaNow = getManilaDateTimeParts();
    setSoldDate(manilaNow.date);
    setSoldTime(manilaNow.time);
    setDeductions([]);
    setSaleResult(result.sale);
    closeModal();
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
        <AdminMetricCard icon="package-check" label="Total Units" value={data.summary.totalUnits.toLocaleString("en-PH")} />
        <AdminMetricCard icon="net" label="Inventory Value" value={formatPhp(data.summary.inventoryValue)} tone="neutral" />
        <AdminMetricCard icon="low-stock" label="Low Stock" value={String(data.summary.lowStockProducts)} tone="amber" />
        <AdminMetricCard icon="out-of-stock" label="Out of Stock" value={String(data.summary.outOfStockProducts)} tone="red" />
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
            {saleResult.items?.length > 1 ? "Combo sale" : saleResult.productName} • {saleResult.quantity} units • {formatPhp(Number(saleResult.finalAmount))}
          </p>
          <p className="mt-1 text-sm theme-text-muted">
            Deductions: {formatPhp(Number(saleResult.totalDirectDeductions))} • Net: {formatPhp(Number(saleResult.netAfterDeductions))}
          </p>
          <p className="mt-1 text-sm theme-text-muted">
            Created: {formatSaleDateTime(saleResult.createdAt)} • Sold: {saleResult.completedAt ? formatSaleDateTime(saleResult.completedAt) : "-"}
          </p>
          <p className="mt-1 text-sm theme-text-muted">
            Stock: {saleResult.previousStock == null || saleResult.newStock == null ? "No change" : `${saleResult.previousStock} → ${saleResult.newStock}`} • Payment: {paymentLabel(saleResult.paymentMethod)}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black theme-text">Product Inventory</h2>
            <p className="mt-1 text-sm theme-text-muted">Choose a product action. Every stock change creates a movement entry.</p>
          </div>
          <Link href="/admin/inventory/history" className="text-sm font-bold theme-accent">
            View History
          </Link>
        </div>

        {data.items.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-[var(--surface-secondary)] text-left theme-text-muted">
                <tr>
                  <th className="rounded-l-lg px-3 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">SKU</th>
                  <th className="px-3 py-3 font-semibold">Stock</th>
                  <th className="px-3 py-3 font-semibold">Unit Cost</th>
                  <th className="px-3 py-3 font-semibold">Inventory Value</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="rounded-r-lg px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((item) => (
                  <tr key={item.product.id}>
                    <td className="px-3 py-4">
                      <p className="font-bold theme-text">{item.product.name}</p>
                      <p className="mt-1 text-xs theme-text-muted">Sold today: {item.soldToday ?? "Unavailable"} · Total sold: {item.totalSold ?? "Unavailable"}</p>
                    </td>
                    <td className="px-3 py-4 theme-text-muted">{item.product.sku || "Not set"}</td>
                    <td className="px-3 py-4 text-xl font-black theme-text">{item.product.current_stock ?? 0}</td>
                    <td className="px-3 py-4 theme-text">{formatPhp(Number(item.product.current_unit_cost ?? 0))}</td>
                    <td className="px-3 py-4 font-bold theme-text">{formatPhp(item.inventoryValue)}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getInventoryStatusClass(item.status)}`}>
                        {getInventoryStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <AdminButton type="button" variant="secondary" onClick={() => openProductAction(item.product.id, "restock")}>Add Stock</AdminButton>
                        <AdminButton type="button" variant="ghost" onClick={() => openProductAction(item.product.id, "adjust")}>Adjust</AdminButton>
                        <AdminButton type="button" variant="primary" onClick={() => openProductAction(item.product.id, "sale")}>Quick Sale</AdminButton>
                        <Link href={`/admin/inventory/history?product=${item.product.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border theme-border px-4 text-sm font-bold theme-text-secondary hover:border-[var(--accent)]">
                          History
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No products yet" description="Create products before managing stock or recording quick sales." />
        )}
      </section>

      <AdminModal
        open={activeModal === "restock"}
        title="Add Stock"
        description={selectedProduct ? selectedProduct.name : "Select a product to restock."}
        onClose={closeModal}
        footer={<div className="flex justify-end gap-3"><AdminButton type="button" variant="secondary" onClick={closeModal}>Cancel</AdminButton><SubmitButton saving={saving} form="restock-form" disabled={!selectedTracked} label={selectedTracked ? "Add Stock" : "Not Tracked"} /></div>}
      >
        <form id="restock-form" onSubmit={submit} className="grid gap-4">
          <input type="hidden" name="flow" value="restock" />
          <input type="hidden" name="idempotency_key" value={restockKey} />
          <AdminFormSection title="Stock Received">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Quantity Received" name="quantity" type="number" min="1" required />
              <Field label="Cost Per Unit" name="unit_cost" type="number" min="0" prefix="₱" required />
              <Field label="Supplier" name="supplier" />
              <Field label="Freight Cost" name="freight_cost" type="number" min="0" prefix="₱" />
              <Field label="Date Received" name="received_at" type="date" />
              <label className="flex min-h-11 items-center gap-2 rounded-lg border theme-border px-3 text-sm font-bold theme-text">
                <input name="update_unit_cost" type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
                Update cost
              </label>
            </div>
            <TextArea label="Notes" name="notes" />
          </AdminFormSection>
        </form>
      </AdminModal>

      <AdminModal
        open={activeModal === "adjust"}
        title="Adjust Stock"
        description={selectedProduct ? `${selectedProduct.name} · Current stock ${selectedProduct.current_stock ?? 0}` : "Select a product to adjust."}
        onClose={closeModal}
        footer={<div className="flex justify-end gap-3"><AdminButton type="button" variant="secondary" onClick={closeModal}>Cancel</AdminButton><SubmitButton saving={saving} form="adjust-form" disabled={!selectedTracked} label={selectedTracked ? "Save Adjustment" : "Not Tracked"} /></div>}
      >
        <form id="adjust-form" onSubmit={submit} className="grid gap-4">
          <input type="hidden" name="flow" value="adjust" />
          <input type="hidden" name="idempotency_key" value={adjustmentKey} />
          <AdminFormSection title="Adjustment Details">
            <div className="grid gap-3 sm:grid-cols-2">
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
          </AdminFormSection>
        </form>
      </AdminModal>

      <AdminModal
        open={activeModal === "sale"}
        title="Record Quick Sale"
        description="Create a pending sale or record a sold transaction."
        onClose={closeModal}
        size="xl"
        footer={<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><AdminButton type="button" variant="secondary" onClick={closeModal}>Cancel</AdminButton><SubmitButton saving={saving} form="quick-sale-form" disabled={saleStatus === "pending" ? !canSaveSale : !canMarkSold} label={saleStatus === "pending" ? "Save Pending" : "Record as Sold"} /></div>}
      >
        <form id="quick-sale-form" onSubmit={submitSale} className="grid gap-5">
            <input type="hidden" name="idempotency_key" value={saleKey} />
            {deductions.map((deduction) => (
              <Fragment key={`${deduction.id}-inputs`}>
                <input type="hidden" name="expense_type" value={deduction.expenseType} />
                <input type="hidden" name="expense_amount" value={deduction.amount} />
                <input type="hidden" name="expense_description" value={deduction.description} />
              </Fragment>
            ))}
            <AdminFormSection title="Sale Status">
              <div className="grid gap-2 sm:grid-cols-2">
                <PackageButton
                  label="Pending"
                  detail="Save without stock or sales metrics"
                  selected={saleStatus === "pending"}
                  onClick={() => setSaleStatus("pending")}
                />
                <PackageButton
                  label="Sold"
                  detail="Deduct stock using selected sold time"
                  selected={saleStatus === "completed"}
                  onClick={() => setSaleStatus("completed")}
                />
              </div>

            {saleStatus === "completed" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Sold Date
                  <input
                    name="sold_date"
                    type="date"
                    value={soldDate}
                    onChange={(event) => setSoldDate(event.target.value)}
                    className={fieldClass}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Sold Time
                  <input
                    name="sold_time"
                    type="time"
                    value={soldTime}
                    onChange={(event) => setSoldTime(event.target.value)}
                    className={fieldClass}
                    required
                  />
                </label>
              </div>
            ) : null}
            </AdminFormSection>

            <AdminFormSection title="Products">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={addSaleItem}
                  className="rounded-md border theme-border px-3 py-2 text-xs font-bold theme-text hover:border-[var(--accent)]"
                >
                  + Add Another Product
                </button>
              </div>
              <div className="mt-3 grid gap-3">
                {saleItemSummaries.map((summary, index) => (
                  <div key={summary.draft.id} className="grid gap-3 rounded-md border theme-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] theme-text-muted">
                        Item {index + 1}
                      </p>
                      {saleItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSaleItem(summary.draft.id)}
                          className="rounded-md border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <label className="grid gap-2 text-sm font-bold theme-text">
                      Product
                      <select
                        value={summary.draft.productId}
                        onChange={(event) => updateSaleItem(summary.draft.id, { productId: event.target.value })}
                        className={fieldClass}
                      >
                        {data.items.map((item) => (
                          <option key={item.product.id} value={item.product.id}>
                            {item.product.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid gap-2">
                      <PackageButton
                        label="Buy 1"
                        detail={summary.product ? formatPhp(getSinglePrice(summary.product)) : "-"}
                        selected={summary.draft.packageType === "buy_1"}
                        onClick={() => updateSaleItem(summary.draft.id, { packageType: "buy_1", quantity: 1 })}
                      />
                      <PackageButton
                        label="Buy 2"
                        detail={summary.product ? `${formatPhp(getBundlePrice(summary.product))}${getBundleSavings(summary.product) > 0 ? ` • Save ${formatPhp(getBundleSavings(summary.product))}` : ""}` : "-"}
                        selected={summary.draft.packageType === "buy_2"}
                        onClick={() => updateSaleItem(summary.draft.id, { packageType: "buy_2", quantity: 2 })}
                      />
                      <PackageButton
                        label="Bulk / Reseller"
                        detail={summary.product?.bulk_enabled ? "Official card tier pricing" : "Not enabled for this product"}
                        selected={summary.draft.packageType === "bulk"}
                        onClick={() => updateSaleItem(summary.draft.id, { packageType: "bulk", quantity: Math.max(summary.draft.quantity, 10) })}
                        disabled={!summary.product?.bulk_enabled}
                      />
                      <PackageButton
                        label="Custom"
                        detail="Negotiated quantity and amount"
                        selected={summary.draft.packageType === "custom"}
                        onClick={() => updateSaleItem(summary.draft.id, { packageType: "custom", quantity: Math.max(summary.draft.quantity, 1) })}
                      />
                    </div>
                    {summary.draft.packageType === "bulk" || summary.draft.packageType === "custom" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-bold theme-text">
                          Quantity
                          <input
                            type="number"
                            min="1"
                            value={summary.draft.quantity}
                            onChange={(event) => updateSaleItem(summary.draft.id, { quantity: Number(event.target.value || 1) })}
                            className={fieldClass}
                            required
                          />
                        </label>
                        {summary.draft.packageType === "custom" ? (
                          <label className="grid gap-2 text-sm font-bold theme-text">
                            Amount
                            <span className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted">₱</span>
                              <input
                                type="number"
                                min="0"
                                value={summary.draft.customAmount}
                                onChange={(event) => updateSaleItem(summary.draft.id, { customAmount: event.target.value })}
                                className={`${fieldClass} w-full pl-8`}
                                required
                              />
                            </span>
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="grid gap-2 text-sm">
                      {summary.draft.packageType === "bulk" ? (
                        <>
                          <PriceRow label="Pricing Tier" value={summary.bulkTierLabel} />
                          <PriceRow label="Bulk Price" value={summary.bulkUnitPrice == null ? "-" : `${formatPhp(summary.bulkUnitPrice)} / card`} />
                        </>
                      ) : null}
                      <PriceRow label="Available Stock" value={String(summary.product?.current_stock ?? 0)} />
                      <PriceRow label="Quantity" value={String(summary.quantity)} />
                      <PriceRow label="Calculated Amount" value={formatPhp(summary.amount)} strong />
                    </div>
                    {summary.bulkMessage ? (
                      <p className="rounded-md border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-200">
                        {summary.bulkMessage}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </AdminFormSection>

            <AdminFormSection title="Payment">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Payment Method
                  <select name="payment_method" className={fieldClass} defaultValue="gcash">
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <Field label="Reference (optional)" name="reference_number" />
              </div>
            </AdminFormSection>

            <AdminFormSection title="Direct Deductions" description="Expenses directly related to this sale.">
              <div className="flex items-center justify-between gap-3">
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
            </AdminFormSection>

            <AdminFormSection title="Notes">
              <TextArea label="Notes" name="notes" />
            </AdminFormSection>

            <AdminFormSection title={saleItems.length > 1 ? "Sale Summary · Combo Sale" : "Sale Summary"}>
              <div className="grid gap-2 text-sm">
                {saleItemSummaries.map((summary, index) => (
                  <PriceRow key={summary.draft.id} label={`${index + 1}. ${summary.product?.name ?? "Product"} (${summary.quantity})`} value={formatPhp(summary.amount)} />
                ))}
              </div>
              <div className="mt-4 grid gap-2 border-t theme-border pt-4 text-sm">
              <PriceRow label="Gross Value" value={formatPhp(grossValue)} />
              <PriceRow label="Discount" value={formatPhp(saleDiscount)} />
              <PriceRow label="Customer Pays" value={formatPhp(saleAmount)} strong />
              <PriceRow label="Direct Deductions" value={formatPhp(totalDirectDeductions)} />
              <PriceRow label="Net After Deductions" value={formatPhp(netAfterDeductions)} strong />
              </div>
            {saleStatus === "completed" && !hasSaleStock ? (
              <p className="mt-3 text-sm font-semibold text-red-300">
                Insufficient stock for one or more products in this sale.
              </p>
            ) : null}
            </AdminFormSection>
          </form>
      </AdminModal>

      <section className="rounded-2xl border p-5 theme-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black theme-text">Today&apos;s Sales</h2>
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
            <div key={sale.sale.id} className="grid gap-2 rounded-xl border p-3 theme-subtle sm:grid-cols-[90px_1fr_auto_auto] sm:items-center">
              <p className="text-sm font-bold theme-text-muted">
                {sale.sale.completed_at ? formatSaleTime(sale.sale.completed_at) : "-"}
              </p>
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
    </div>
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

const fieldClass = adminFieldClass;

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
        className="min-h-20 rounded-lg border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25"
      />
    </label>
  );
}

function SubmitButton({
  saving,
  disabled,
  label,
  value,
  form,
}: {
  saving: boolean;
  disabled?: boolean;
  label: string;
  value?: string;
  form?: string;
}) {
  return (
    <button
      disabled={saving || disabled}
      value={value}
      form={form}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] disabled:cursor-not-allowed disabled:opacity-60"
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

function formatSaleDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function createSaleItemDraft(productId: string): SaleItemDraft {
  return {
    id: crypto.randomUUID(),
    productId,
    packageType: "buy_1",
    quantity: 1,
    customAmount: "",
  };
}

function summarizeSaleItem(draft: SaleItemDraft, product: ProductRow | undefined): SaleItemSummary {
  const singlePrice = product ? getSinglePrice(product) : 0;
  const bundlePrice = product ? getBundlePrice(product) : 0;
  const quantity = draft.packageType === "buy_1" ? 1 : draft.packageType === "buy_2" ? 2 : Math.max(Number(draft.quantity || 1), 1);
  const bulk = product ? getBulkPricing(product, quantity) : { ready: false, message: "", tierLabel: "Not eligible", unitPrice: null as number | null };
  const gross = singlePrice * quantity;
  const amount =
    draft.packageType === "buy_1"
      ? singlePrice
      : draft.packageType === "buy_2"
        ? bundlePrice
        : draft.packageType === "bulk"
          ? bulk.ready && bulk.unitPrice != null
            ? quantity * bulk.unitPrice
            : 0
          : Number(draft.customAmount || 0);

  return {
    draft,
    product,
    quantity,
    gross,
    discount: Math.max(gross - amount, 0),
    amount,
    bulkReady: bulk.ready,
    bulkMessage: bulk.message,
    bulkTierLabel: bulk.tierLabel,
    bulkUnitPrice: bulk.unitPrice,
  };
}

function getSinglePrice(product: ProductRow) {
  return Number(product.default_physical_price ?? product.price_single ?? 0);
}

function getBundlePrice(product: ProductRow) {
  return Number(product.price_bundle ?? getSinglePrice(product) * 2);
}

function getBundleSavings(product: ProductRow) {
  return Math.max(getSinglePrice(product) * 2 - getBundlePrice(product), 0);
}

function getBulkPricing(product: ProductRow, quantity: number) {
  const tier1Min = Number(product.bulk_tier_1_min ?? 10);
  const tier1Max = Number(product.bulk_tier_1_max ?? 24);
  const tier1UnitPrice = product.bulk_tier_1_unit_price == null ? null : Number(product.bulk_tier_1_unit_price);
  const tier2Min = Number(product.bulk_tier_2_min ?? 25);
  const tier2UnitPrice = product.bulk_tier_2_unit_price == null ? null : Number(product.bulk_tier_2_unit_price);

  if (!product.bulk_enabled) {
    return { ready: false, message: "Bulk pricing is not enabled for this product.", tierLabel: "Not eligible", unitPrice: null };
  }

  if (quantity === 1) {
    return { ready: false, message: "Use Buy 1 instead.", tierLabel: "Not eligible", unitPrice: null };
  }

  if (quantity === 2) {
    return { ready: false, message: "Use Buy 2 instead.", tierLabel: "Not eligible", unitPrice: null };
  }

  if (quantity < tier1Min) {
    return { ready: false, message: "Bulk pricing starts at 10 units.", tierLabel: "Not eligible", unitPrice: null };
  }

  if (quantity >= tier2Min) {
    return { ready: tier2UnitPrice != null, message: tier2UnitPrice == null ? "Bulk pricing is not fully configured for this product." : "", tierLabel: `${tier2Min}+ Cards`, unitPrice: tier2UnitPrice };
  }

  if (quantity <= tier1Max) {
    return { ready: tier1UnitPrice != null, message: tier1UnitPrice == null ? "Bulk pricing is not fully configured for this product." : "", tierLabel: `${tier1Min}-${tier1Max} Cards`, unitPrice: tier1UnitPrice };
  }

  return { ready: false, message: "Bulk pricing starts at 10 units.", tierLabel: "Not eligible", unitPrice: null };
}

function getManilaDateTimeParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}
