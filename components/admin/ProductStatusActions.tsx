"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductStatus } from "@/types/database";

type Action = {
  label: string;
  status?: ProductStatus;
  destructive?: boolean;
  delete?: boolean;
};

export function ProductStatusActions({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const actions: Action[] = [
    ...(status !== "published" ? [{ label: "Publish", status: "published" as const }] : []),
    ...(status === "published" ? [{ label: "Unpublish", status: "draft" as const }] : []),
    ...(status !== "archived" ? [{ label: "Archive", status: "archived" as const, destructive: true }] : []),
    { label: "Delete permanently", delete: true, destructive: true },
  ];

  const runAction = async () => {
    if (!pendingAction) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("_action", pendingAction.delete ? "delete" : "status");
    if (pendingAction.status) formData.set("status", pendingAction.status);

    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "POST",
      body: formData,
    });
    setLoading(false);
    setPendingAction(null);

    if (response.ok) {
      router.refresh();
      return;
    }

    const result = (await response.json()) as { error?: string };
    alert(result.error ?? "Failed to update product.");
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => setPendingAction(action)}
          className={`rounded-md border px-3 py-2 text-xs font-bold ${
            action.destructive
              ? "border-red-400/50 text-red-300"
              : "theme-border theme-text"
          }`}
        >
          {action.label}
        </button>
      ))}

      {pendingAction ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "var(--overlay)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-action-title"
        >
          <div className="w-full max-w-md rounded-lg border p-6 theme-card-elevated">
            <h2 id="product-action-title" className="text-xl font-black theme-text">
              {pendingAction.label} this product?
            </h2>
            <p className="mt-3 text-sm leading-6 theme-text-secondary">
              This changes the product visibility according to its new status.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={runAction}
                disabled={loading}
                className={`inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-bold disabled:opacity-60 ${
                  pendingAction.destructive
                    ? "border-red-400/50 text-red-300"
                    : "border-[var(--accent)] bg-[var(--accent)] text-[var(--button-primary-text)]"
                }`}
              >
                {loading ? "Working..." : pendingAction.label}
              </button>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border theme-border px-4 text-sm font-bold theme-text"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
