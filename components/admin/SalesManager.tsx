"use client";

import { useRouter } from "next/navigation";
import { Fragment } from "react";
import { useState, type FormEvent } from "react";
import { formatPhp } from "@/lib/format";
import type { SaleListItem, SaleResult } from "@/lib/sales";

type SalesManagerProps = {
  sales: SaleListItem[];
};

export function SalesManager({ sales }: SalesManagerProps) {
  const router = useRouter();
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);
  const [cancelKey, setCancelKey] = useState(() => crypto.randomUUID());
  const [completeKey, setCompleteKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const completeSale = async (saleId: string) => {
    const formData = new FormData();
    formData.set("sale_id", saleId);
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
              <th className="pb-3 font-semibold">Date</th>
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
                  <td className="py-3 theme-text-muted">{formatDateTime(item.sale.completed_at ?? item.sale.created_at)}</td>
                  <td className="py-3">
                    <p className="font-bold theme-text">{item.productName}</p>
                    <p className="mt-1 text-xs theme-text-muted">{item.sku || "No SKU"}</p>
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
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSaleId(expandedSaleId === item.sale.id ? null : item.sale.id)}
                        className="rounded-md border theme-border px-3 py-2 text-xs font-bold theme-text"
                      >
                        Details
                      </button>
                      {item.sale.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => completeSale(item.sale.id)}
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
                            <Detail label="Product" value={item.productName} />
                            <Detail label="Package" value={`${item.packageLabel} × ${item.quantity}`} />
                            <Detail label="Gross Value" value={formatPhp(item.grossAmount)} />
                            <Detail label="Discount" value={formatPhp(item.discountAmount)} />
                            <Detail label="Customer Pays" value={formatPhp(item.finalAmount)} />
                            <Detail label="Regular Unit Price" value={formatPhp(item.regularUnitPrice)} />
                            <Detail label="Bulk Unit Price" value={item.bulkUnitPrice == null ? "-" : formatPhp(item.bulkUnitPrice)} />
                            <Detail label="Pricing Tier" value={item.pricingTierLabel || "-"} />
                            <Detail label="Payment Reference" value={item.paymentReference || "-"} />
                            <Detail label="Movement Reference" value={item.movementId || "-"} />
                            <Detail label="Unit Cost Snapshot" value={formatPhp(item.unitCostSnapshot)} />
                            <Detail label="Notes" value={item.sale.notes || "-"} />
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
    </section>
  );
}

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
