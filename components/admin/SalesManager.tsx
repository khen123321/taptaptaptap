"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, type FormEvent } from "react";
import { formatPhp } from "@/lib/format";
import type { SaleListItem, SaleResult } from "@/lib/sales";
import type { ProductRow, SaleExpenseType, SaleItemPackageType } from "@/types/database";

type SalesManagerProps = {
  sales: SaleListItem[];
  products: ProductRow[];
};

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

export function SalesManager({ sales, products }: SalesManagerProps) {
  const router = useRouter();
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);
  const [completingSaleId, setCompletingSaleId] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<SaleListItem | null>(null);
  const [deletingSale, setDeletingSale] = useState<SaleListItem | null>(null);
  const [cancelKey, setCancelKey] = useState(() => crypto.randomUUID());
  const [completeKey, setCompleteKey] = useState(() => crypto.randomUUID());
  const [editKey, setEditKey] = useState(() => crypto.randomUUID());
  const [deleteKey, setDeleteKey] = useState(() => crypto.randomUUID());
  const [completeSoldDate, setCompleteSoldDate] = useState(() => getManilaDateTimeParts().date);
  const [completeSoldTime, setCompleteSoldTime] = useState(() => getManilaDateTimeParts().time);
  const [editSaleItems, setEditSaleItems] = useState<SaleItemDraft[]>([]);
  const [editSoldDate, setEditSoldDate] = useState(() => getManilaDateTimeParts().date);
  const [editSoldTime, setEditSoldTime] = useState(() => getManilaDateTimeParts().time);
  const [editDeductions, setEditDeductions] = useState<DeductionDraft[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const editSummaries = editSaleItems.map((item) => summarizeSaleItem(item, products.find((product) => product.id === item.productId)));
  const editQuantity = editSummaries.reduce((sum, item) => sum + item.quantity, 0);
  const editGross = editSummaries.reduce((sum, item) => sum + item.gross, 0);
  const editAmount = editSummaries.reduce((sum, item) => sum + item.amount, 0);
  const editDeductionsTotal = editDeductions.reduce((sum, deduction) => {
    const amount = Number(deduction.amount || 0);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const openEditSale = (item: SaleListItem) => {
    setEditingSale(item);
    setEditSaleItems(item.items.length ? item.items.map((saleItem) => ({
      id: crypto.randomUUID(),
      productId: saleItem.productId,
      packageType: packageTypeFromLabel(saleItem.packageLabel),
      quantity: saleItem.quantity,
      customAmount: String(saleItem.finalAmount),
    })) : [createSaleItemDraft(products[0]?.id ?? "")]);
    const soldParts = item.sale.completed_at ? getManilaDateTimeParts(new Date(item.sale.completed_at)) : getManilaDateTimeParts();
    setEditSoldDate(soldParts.date);
    setEditSoldTime(soldParts.time);
    setEditDeductions(item.expenses.map((expense) => ({
      id: crypto.randomUUID(),
      expenseType: expense.expense_type,
      amount: String(Number(expense.amount ?? 0)),
      description: expense.description ?? "",
    })));
  };

  const addEditDeduction = () => {
    setEditDeductions((current) => [
      ...current,
      { id: crypto.randomUUID(), expenseType: "gas_transportation", amount: "", description: "" },
    ]);
  };

  const updateEditDeduction = (id: string, changes: Partial<Omit<DeductionDraft, "id">>) => {
    setEditDeductions((current) => current.map((deduction) => (deduction.id === id ? { ...deduction, ...changes } : deduction)));
  };

  const removeEditDeduction = (id: string) => {
    setEditDeductions((current) => current.filter((deduction) => deduction.id !== id));
  };

  const updateEditSaleItem = (id: string, changes: Partial<Omit<SaleItemDraft, "id">>) => {
    setEditSaleItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const openCompleteSale = (saleId: string) => {
    const manilaNow = getManilaDateTimeParts();
    setCompleteSoldDate(manilaNow.date);
    setCompleteSoldTime(manilaNow.time);
    setCompletingSaleId(saleId);
  };

  const completeSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("idempotency_key", completeKey);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/sales/complete", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { sale?: SaleResult; error?: string };

    if (!response.ok || result.error || !result.sale) {
      setError(result.error ?? "Failed to mark sale as sold.");
      return;
    }

    setMessage(`Sale #${result.sale.saleNumber} marked sold.`);
    setCompletingSaleId(null);
    setCompleteKey(crypto.randomUUID());
    router.refresh();
  };

  const cancelSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("idempotency_key", cancelKey);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/sales/cancel", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { sale?: SaleResult; error?: string };

    if (!response.ok || result.error || !result.sale) {
      setError(result.error ?? "Failed to cancel sale.");
      return;
    }

    setMessage(`Sale #${result.sale.saleNumber} cancelled.`);
    setCancellingSaleId(null);
    setCancelKey(crypto.randomUUID());
    router.refresh();
  };

  const updateSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("idempotency_key", editKey);
    if (editingSale?.sale.status === "pending") {
      const firstItem = editSaleItems[0];
      formData.set("product_id", firstItem?.productId ?? "");
      formData.set("package_type", firstItem?.packageType ?? "buy_1");
      formData.set("sale_items", JSON.stringify(editSaleItems.map((item) => ({
        productId: item.productId,
        packageType: item.packageType,
        quantity: item.packageType === "buy_1" ? 1 : item.packageType === "buy_2" ? 2 : item.quantity,
        customAmount: item.packageType === "custom" ? Number(item.customAmount || 0) : null,
      }))));
    }
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/sales/update", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { sale?: SaleResult; error?: string };

    if (!response.ok || result.error || !result.sale) {
      setError(result.error ?? "Failed to update sale.");
      return;
    }

    setMessage(`Sale #${result.sale.saleNumber} updated.`);
    setEditingSale(null);
    setEditKey(crypto.randomUUID());
    router.refresh();
  };

  const deleteSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("idempotency_key", deleteKey);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/sales/delete", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { sale?: SaleResult; error?: string };

    if (!response.ok || result.error || !result.sale) {
      setError(result.error ?? "Failed to delete sale.");
      return;
    }

    setMessage(`Sale #${result.sale.saleNumber} deleted from normal sales records.`);
    setDeletingSale(null);
    setDeleteKey(crypto.randomUUID());
    router.refresh();
  };

  return (
    <section className="rounded-lg border p-4 theme-card">
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="text-left theme-text-muted">
            <tr>
              <th className="pb-3 font-semibold">Sale ID</th>
              <th className="pb-3 font-semibold">Sold Date</th>
              <th className="pb-3 font-semibold">Product</th>
              <th className="pb-3 font-semibold">Qty</th>
              <th className="pb-3 font-semibold">Package</th>
              <th className="pb-3 font-semibold">Amount</th>
              <th className="pb-3 font-semibold">Deductions</th>
              <th className="pb-3 font-semibold">Net After</th>
              <th className="pb-3 font-semibold">Payment</th>
              <th className="pb-3 font-semibold">Handled By</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sales.map((item) => (
              <Fragment key={item.sale.id}>
                <tr>
                  <td className="py-3 font-bold theme-text">{item.sale.sale_number}</td>
                  <td className="py-3 theme-text-muted">{item.sale.completed_at ? formatDateTime(item.sale.completed_at) : "-"}</td>
                  <td className="py-3">
                    <p className="font-bold theme-text">{item.productName}</p>
                    <p className="mt-1 text-xs theme-text-muted">{item.items.length > 1 ? `${item.items.length} products` : item.sku || "No SKU"}</p>
                  </td>
                  <td className="py-3 theme-text">{item.quantity}</td>
                  <td className="py-3 theme-text-secondary">{item.packageLabel}</td>
                  <td className="py-3 font-bold theme-text">{formatPhp(item.finalAmount)}</td>
                  <td className="py-3 theme-text-secondary">{formatPhp(item.totalDirectDeductions)}</td>
                  <td className="py-3 font-bold theme-text">{formatPhp(item.netAfterDeductions)}</td>
                  <td className="py-3 theme-text-secondary">{paymentLabel(item.paymentMethod)}</td>
                  <td className="py-3 theme-text-muted">{item.handledByEmail || "Unknown admin"}</td>
                  <td className="py-3">
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(item.sale.status)}`}>
                      {item.sale.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSaleId(expandedSaleId === item.sale.id ? null : item.sale.id)}
                        className="rounded-md border theme-border px-3 py-2 text-xs font-bold theme-text"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditSale(item)}
                        className="rounded-md border border-[var(--accent)]/70 px-3 py-2 text-xs font-bold theme-accent"
                      >
                        Edit
                      </button>
                      {item.sale.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => openCompleteSale(item.sale.id)}
                          className="rounded-md border border-[var(--accent)] px-3 py-2 text-xs font-bold theme-accent"
                        >
                          Mark Sold
                        </button>
                      ) : null}
                      {item.sale.status !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => setCancellingSaleId(item.sale.id)}
                          className="rounded-md border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300"
                        >
                          Cancel
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setDeletingSale(item)}
                        className="rounded-md border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedSaleId === item.sale.id ? (
                  <tr key={`${item.sale.id}-details`}>
                    <td colSpan={12} className="py-4">
                      <div className="grid gap-4 rounded-md border p-4 theme-subtle lg:grid-cols-[1fr_1fr]">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.14em] theme-accent">Sale Summary</h3>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <Detail label="Sale Number" value={item.sale.sale_number} />
                            <Detail label="Created" value={formatDateTime(item.sale.created_at)} />
                            <Detail label="Sold" value={item.sale.completed_at ? formatDateTime(item.sale.completed_at) : "-"} />
                            <Detail label="Gross Value" value={formatPhp(item.grossAmount)} />
                            <Detail label="Discount" value={formatPhp(item.discountAmount)} />
                            <Detail label="Customer Pays" value={formatPhp(item.finalAmount)} />
                            <Detail label="Physical Units" value={String(item.quantity)} />
                            <Detail label="Payment Reference" value={item.paymentReference || "-"} />
                            <Detail label="Movement Reference" value={item.movementId || "-"} />
                            <Detail label="Notes" value={item.sale.notes || "-"} />
                          </div>
                          <h3 className="mt-5 text-xs font-black uppercase tracking-[0.14em] theme-accent">Items</h3>
                          <div className="mt-3 grid gap-2">
                            {item.items.map((saleItem, index) => (
                              <div key={`${item.sale.id}-${saleItem.productId}-${index}`} className="rounded-md border theme-border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-bold theme-text">{saleItem.productName}</p>
                                    <p className="mt-1 text-xs theme-text-muted">
                                      {saleItem.packageLabel} · Qty {saleItem.quantity}{saleItem.pricingTierLabel ? ` · ${saleItem.pricingTierLabel}` : ""}
                                    </p>
                                  </div>
                                  <p className="font-black theme-accent">{formatPhp(saleItem.finalAmount)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.14em] theme-accent">Direct Deductions</h3>
                          <div className="mt-3 grid gap-2">
                            {item.expenses.length ? item.expenses.map((expense) => (
                              <div key={expense.id} className="flex items-start justify-between gap-3 rounded-md border theme-border p-3">
                                <div>
                                  <p className="font-bold theme-text">{expenseLabel(expense.expense_type)}</p>
                                  {expense.description ? (
                                    <p className="mt-1 text-xs theme-text-muted">{expense.description}</p>
                                  ) : null}
                                </div>
                                <p className="font-black theme-text">{formatPhp(Number(expense.amount ?? 0))}</p>
                              </div>
                            )) : (
                              <p className="rounded-md border theme-border p-3 text-sm theme-text-muted">No deductions</p>
                            )}
                            <div className="mt-2 grid gap-2 rounded-md border theme-border p-3">
                              <SummaryLine label="Total Deductions" value={formatPhp(item.totalDirectDeductions)} />
                              <SummaryLine label="Net After Deductions" value={formatPhp(item.netAfterDeductions)} strong />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {sales.length === 0 ? (
        <p className="mt-5 rounded-md border theme-border p-5 text-center text-sm theme-text-muted">
          No sales found.
        </p>
      ) : null}

      {editingSale ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8"
          style={{ background: "var(--overlay)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sale-title"
        >
          <form onSubmit={updateSale} className="w-full max-w-3xl rounded-lg border p-6 theme-card-elevated">
            <input type="hidden" name="sale_id" value={editingSale.sale.id} />
            <input type="hidden" name="sale_status" value={editingSale.sale.status} />
            {editDeductions.map((deduction) => (
              <Fragment key={`${deduction.id}-hidden`}>
                <input type="hidden" name="expense_type" value={deduction.expenseType} />
                <input type="hidden" name="expense_amount" value={deduction.amount} />
                <input type="hidden" name="expense_description" value={deduction.description} />
              </Fragment>
            ))}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="edit-sale-title" className="text-xl font-black theme-text">Edit Sale</h2>
                <p className="mt-1 text-sm theme-text-muted">{editingSale.sale.sale_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSale(null)}
                className="rounded-md border theme-border px-3 py-2 text-sm font-bold theme-text"
              >
                Close
              </button>
            </div>

            {editingSale.sale.status === "pending" ? (
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.14em] theme-accent">Products</h3>
                  <button type="button" onClick={() => setEditSaleItems((current) => [...current, createSaleItemDraft(products[0]?.id ?? "")])} className="rounded-md border theme-border px-3 py-2 text-xs font-bold theme-text hover:border-[var(--accent)]">
                    + Add Product
                  </button>
                </div>
                {editSummaries.map((summary, index) => (
                  <div key={summary.draft.id} className="grid gap-3 rounded-md border theme-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] theme-text-muted">Item {index + 1}</p>
                      {editSaleItems.length > 1 ? (
                        <button type="button" onClick={() => setEditSaleItems((current) => current.filter((entry) => entry.id !== summary.draft.id))} className="rounded-md border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300">
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-bold theme-text">
                        Product
                        <select value={summary.draft.productId} onChange={(event) => updateEditSaleItem(summary.draft.id, { productId: event.target.value })} className={fieldClass}>
                          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-bold theme-text">
                        Package
                        <select value={summary.draft.packageType} onChange={(event) => updateEditSaleItem(summary.draft.id, { packageType: event.target.value as SaleItemPackageType })} className={fieldClass}>
                          <option value="buy_1">Buy 1</option>
                          <option value="buy_2">Buy 2</option>
                          {summary.product?.bulk_enabled ? <option value="bulk">Bulk</option> : null}
                          <option value="custom">Custom</option>
                        </select>
                      </label>
                    </div>
                    {summary.draft.packageType === "bulk" || summary.draft.packageType === "custom" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Quantity" type="number" min="1" value={String(summary.draft.quantity)} onChange={(value) => updateEditSaleItem(summary.draft.id, { quantity: Number(value || 1) })} />
                        {summary.draft.packageType === "custom" ? (
                          <Field label="Custom Amount" type="number" min="0" value={summary.draft.customAmount} onChange={(value) => updateEditSaleItem(summary.draft.id, { customAmount: value })} prefix="₱" />
                        ) : null}
                      </div>
                    ) : null}
                    <SummaryLine label="Calculated Amount" value={formatPhp(summary.amount)} strong />
                    {summary.bulkMessage ? (
                      <p className="rounded-md border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-200">{summary.bulkMessage}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border theme-border p-4">
                <p className="text-sm font-bold theme-text">{editingSale.productName}</p>
                <p className="mt-1 text-sm theme-text-muted">{editingSale.packageLabel} × {editingSale.quantity}</p>
                {editingSale.sale.status === "completed" ? (
                  <p className="mt-3 text-sm theme-text-secondary">
                    Product and quantity cannot be changed after a sale is completed. Cancel the sale and create a corrected sale if those values are wrong.
                  </p>
                ) : (
                  <p className="mt-3 text-sm theme-text-secondary">Cancelled sales cannot be made active again from this editor.</p>
                )}
              </div>
            )}

            {editingSale.sale.status === "completed" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Sold Date
                  <input name="sold_date" type="date" value={editSoldDate} onChange={(event) => setEditSoldDate(event.target.value)} className={fieldClass} required />
                </label>
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Sold Time
                  <input name="sold_time" type="time" value={editSoldTime} onChange={(event) => setEditSoldTime(event.target.value)} className={fieldClass} required />
                </label>
              </div>
            ) : null}

            {editingSale.sale.status !== "cancelled" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold theme-text">
                  Payment
                  <select name="payment_method" defaultValue={editingSale.paymentMethod} className={fieldClass}>
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <Field label="Reference" name="reference_number" defaultValue={editingSale.paymentReference ?? ""} />
              </div>
            ) : null}

            <label className="mt-4 grid gap-2 text-sm font-bold theme-text">
              Notes
              <textarea name="notes" defaultValue={editingSale.sale.notes ?? ""} rows={3} className="rounded-md border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-sm theme-text outline-none focus:border-[var(--accent)]" />
            </label>

            <div className="mt-4 rounded-md border theme-border p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.14em] theme-accent">Direct Deductions</h3>
                {editingSale.sale.status !== "cancelled" ? (
                  <button type="button" onClick={addEditDeduction} className="rounded-md border theme-border px-3 py-2 text-xs font-bold theme-text hover:border-[var(--accent)]">
                    + Add Deduction
                  </button>
                ) : null}
              </div>
              <div className="mt-3 grid gap-3">
                {editDeductions.length ? editDeductions.map((deduction) => (
                  <div key={deduction.id} className="grid gap-2 rounded-md border theme-border p-3 sm:grid-cols-[1fr_140px_1fr_auto] sm:items-end">
                    <label className="grid gap-2 text-xs font-bold theme-text">
                      Type
                      <select value={deduction.expenseType} disabled={editingSale.sale.status === "cancelled"} onChange={(event) => updateEditDeduction(deduction.id, { expenseType: event.target.value as SaleExpenseType })} className={fieldClass}>
                        {saleDeductionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                    </label>
                    <Field label="Amount" type="number" min="0" value={deduction.amount} onChange={(value) => updateEditDeduction(deduction.id, { amount: value })} prefix="₱" disabled={editingSale.sale.status === "cancelled"} />
                    <Field
                      label="Notes"
                      value={deduction.description}
                      onChange={(value) => updateEditDeduction(deduction.id, { description: value })}
                      disabled={editingSale.sale.status === "cancelled"}
                    />
                    {editingSale.sale.status !== "cancelled" ? (
                      <button type="button" onClick={() => removeEditDeduction(deduction.id)} className="rounded-md border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300">Remove</button>
                    ) : null}
                  </div>
                )) : (
                  <p className="rounded-md border theme-border p-3 text-sm theme-text-muted">No deductions</p>
                )}
              </div>
            </div>

            {editingSale.sale.status === "pending" ? (
              <div className="mt-4 grid gap-2 rounded-md border theme-border p-3 text-sm">
                <SummaryLine label="Gross Value" value={formatPhp(editGross)} />
                <SummaryLine label="Discount" value={formatPhp(Math.max(editGross - editAmount, 0))} />
                <SummaryLine label="Customer Pays" value={formatPhp(editAmount)} strong />
                <SummaryLine label="Direct Deductions" value={formatPhp(editDeductionsTotal)} />
                <SummaryLine label="Net After Deductions" value={formatPhp(editAmount - editDeductionsTotal)} strong />
                <SummaryLine label="Quantity" value={String(editQuantity)} />
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setEditingSale(null)} className="inline-flex min-h-11 items-center justify-center rounded-md border theme-border px-4 text-sm font-bold theme-text">
                Cancel
              </button>
              <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)]">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {cancellingSaleId ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "var(--overlay)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-sale-title"
        >
          <form onSubmit={cancelSale} className="w-full max-w-md rounded-lg border p-6 theme-card-elevated">
            <input type="hidden" name="sale_id" value={cancellingSaleId} />
            <h2 id="cancel-sale-title" className="text-xl font-black theme-text">Cancel this sale?</h2>
            <p className="mt-3 text-sm leading-6 theme-text-secondary">
              The sale record will be preserved. Completed sales restore inventory once; pending sales do not change inventory.
            </p>
            <label className="mt-4 grid gap-2 text-sm font-bold theme-text">
              Reason
              <textarea
                name="reason"
                rows={3}
                className="rounded-md border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-sm theme-text outline-none focus:border-[var(--accent)]"
              />
            </label>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-400/50 px-4 text-sm font-bold text-red-300">
                Cancel Sale
              </button>
              <button
                type="button"
                onClick={() => setCancellingSaleId(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border theme-border px-4 text-sm font-bold theme-text"
              >
                Keep Sale
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deletingSale ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "var(--overlay)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-sale-title"
        >
          <form onSubmit={deleteSale} className="w-full max-w-md rounded-lg border p-6 theme-card-elevated">
            <input type="hidden" name="sale_id" value={deletingSale.sale.id} />
            <h2 id="delete-sale-title" className="text-xl font-black theme-text">Delete sale?</h2>
            <div className="mt-4 rounded-md border theme-border p-4 text-sm">
              <SummaryLine label="Sale" value={deletingSale.sale.sale_number} />
              <SummaryLine label="Product" value={deletingSale.productName} />
              <SummaryLine label="Amount" value={formatPhp(deletingSale.finalAmount)} strong />
            </div>
            <p className="mt-3 text-sm leading-6 theme-text-secondary">
              This action will remove the sale from normal sales records and reports. The database history remains preserved.
            </p>
            <label className="mt-4 grid gap-2 text-sm font-bold theme-text">
              Reason
              <textarea
                name="reason"
                rows={3}
                className="rounded-md border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-sm theme-text outline-none focus:border-[var(--accent)]"
              />
            </label>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeletingSale(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border theme-border px-4 text-sm font-bold theme-text"
              >
                Cancel
              </button>
              <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-400/50 bg-red-500/10 px-4 text-sm font-bold text-red-300">
                Delete Sale
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {completingSaleId ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "var(--overlay)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-sale-title"
        >
          <form onSubmit={completeSale} className="w-full max-w-md rounded-lg border p-6 theme-card-elevated">
            <input type="hidden" name="sale_id" value={completingSaleId} />
            <h2 id="complete-sale-title" className="text-xl font-black theme-text">Mark sale as sold</h2>
            <p className="mt-3 text-sm leading-6 theme-text-secondary">
              Choose the actual sold date and time. Inventory will be deducted once when confirmed.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold theme-text">
                Sold Date
                <input
                  name="sold_date"
                  type="date"
                  value={completeSoldDate}
                  onChange={(event) => setCompleteSoldDate(event.target.value)}
                  className={fieldClass}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold theme-text">
                Sold Time
                <input
                  name="sold_time"
                  type="time"
                  value={completeSoldTime}
                  onChange={(event) => setCompleteSoldTime(event.target.value)}
                  className={fieldClass}
                  required
                />
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setCompletingSaleId(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border theme-border px-4 text-sm font-bold theme-text"
              >
                Cancel
              </button>
              <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)]">
                Confirm Sold
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

const fieldClass =
  "min-h-11 rounded-md border theme-border bg-[var(--surface-secondary)] px-3 text-sm theme-text outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] theme-text-muted">{label}</p>
      <p className="mt-1 font-bold theme-text">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold theme-text-muted">{label}</span>
      <span className={strong ? "font-black theme-accent" : "font-bold theme-text"}>{value}</span>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  min,
  prefix,
  value,
  defaultValue,
  onChange,
  disabled,
}: {
  label: string;
  name?: string;
  type?: string;
  min?: string;
  prefix?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
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
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className={`${fieldClass} w-full ${prefix ? "pl-8" : ""}`}
          required={type === "number" && !disabled}
        />
      </span>
    </label>
  );
}

function expenseLabel(value: string) {
  if (value === "gas_transportation") return "Gas / Transportation";
  if (value === "shipping_delivery") return "Shipping / Delivery";
  if (value === "packaging") return "Packaging";
  if (value === "printing_customization") return "Printing / Customization";
  if (value === "commission") return "Commission";
  return "Other";
}

function paymentLabel(value: string) {
  if (value === "gcash") return "GCash";
  if (value === "bank_transfer") return "Bank Transfer";
  if (value === "cash") return "Cash";
  return "Other";
}

function statusClass(status: string) {
  if (status === "completed") return "border-green-400/50 bg-green-500/10 text-green-300";
  if (status === "pending") return "border-yellow-400/50 bg-yellow-500/10 text-yellow-200";
  return "border-red-400/50 bg-red-500/10 text-red-300";
}

function formatDateTime(value: string) {
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

function packageTypeFromLabel(label: string): SaleItemPackageType {
  const normalized = label.toLowerCase();
  if (normalized.includes("buy 2")) return "buy_2";
  if (normalized.includes("bulk")) return "bulk";
  if (normalized.includes("custom")) return "custom";
  return "buy_1";
}

function summarizeSaleItem(draft: SaleItemDraft, product: ProductRow | undefined) {
  const singlePrice = Number(product?.default_physical_price ?? product?.price_single ?? 0);
  const bundlePrice = Number(product?.price_bundle ?? singlePrice * 2);
  const quantity = draft.packageType === "buy_1" ? 1 : draft.packageType === "buy_2" ? 2 : Math.max(Number(draft.quantity || 1), 1);
  const gross = singlePrice * quantity;
  const bulk = product ? getBulkPricing(product, quantity) : { ready: false, message: "", unitPrice: null as number | null };
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
    amount,
    bulkMessage: bulk.message,
  };
}

function getBulkPricing(product: ProductRow, quantity: number) {
  const tier1Min = Number(product.bulk_tier_1_min ?? 10);
  const tier1Max = Number(product.bulk_tier_1_max ?? 24);
  const tier1UnitPrice = product.bulk_tier_1_unit_price == null ? null : Number(product.bulk_tier_1_unit_price);
  const tier2Min = Number(product.bulk_tier_2_min ?? 25);
  const tier2UnitPrice = product.bulk_tier_2_unit_price == null ? null : Number(product.bulk_tier_2_unit_price);

  if (!product.bulk_enabled) return { ready: false, message: "Bulk pricing is not enabled for this product.", unitPrice: null };
  if (quantity === 1) return { ready: false, message: "Use Buy 1 instead.", unitPrice: null };
  if (quantity === 2) return { ready: false, message: "Use Buy 2 instead.", unitPrice: null };
  if (quantity < tier1Min) return { ready: false, message: "Bulk pricing starts at 10 units.", unitPrice: null };
  if (quantity >= tier2Min) return { ready: tier2UnitPrice != null, message: tier2UnitPrice == null ? "Bulk pricing is not fully configured for this product." : "", unitPrice: tier2UnitPrice };
  if (quantity <= tier1Max) return { ready: tier1UnitPrice != null, message: tier1UnitPrice == null ? "Bulk pricing is not fully configured for this product." : "", unitPrice: tier1UnitPrice };
  return { ready: false, message: "Bulk pricing starts at 10 units.", unitPrice: null };
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
