import type { ProductRow } from "@/types/database";

export type InventoryStatus = "out" | "low" | "ok" | "not_tracked";

export function getInventoryStatus(product: Pick<ProductRow, "track_inventory" | "current_stock" | "low_stock_threshold">): InventoryStatus {
  if (!product.track_inventory) return "not_tracked";
  const stock = Number(product.current_stock ?? 0);
  const threshold = Number(product.low_stock_threshold ?? 0);
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "ok";
}

export function getInventoryStatusLabel(status: InventoryStatus) {
  if (status === "out") return "Out of Stock";
  if (status === "low") return "Low Stock";
  if (status === "not_tracked") return "Not Tracked";
  return "In Stock";
}

export function getInventoryStatusClass(status: InventoryStatus) {
  if (status === "out") return "border-red-400/50 bg-red-500/10 text-red-300";
  if (status === "low") return "border-yellow-400/50 bg-yellow-500/10 text-yellow-200";
  if (status === "not_tracked") return "theme-border theme-text-muted";
  return "border-green-400/50 bg-green-500/10 text-green-300";
}
