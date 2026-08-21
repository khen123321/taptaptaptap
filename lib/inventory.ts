import { revalidatePath } from "next/cache";
import { formatPhp } from "@/lib/format";
import { getInventoryStatus, type InventoryStatus } from "@/lib/inventory-status";
import { createSupabaseSecretClient } from "@/lib/supabase/server";
import type { InventoryMovementRow, InventoryMovementType, ProductRow } from "@/types/database";

export type InventoryOverviewItem = {
  product: ProductRow;
  inventoryValue: number;
  status: InventoryStatus;
};

export type InventorySummary = {
  totalUnits: number;
  inventoryValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
};

export type InventoryDashboardData = {
  items: InventoryOverviewItem[];
  summary: InventorySummary;
};

export type InventoryHistoryItem = InventoryMovementRow & {
  productName: string;
  productSku: string | null;
  actorEmail: string | null;
};

export type InventoryHistoryFilters = {
  productId?: string;
  movementType?: InventoryMovementType | "all";
  query?: string;
};

export type InventoryAdjustmentInput = {
  productId: string;
  quantityChange: number;
  movementType: InventoryMovementType;
  reason: string;
  notes?: string;
  actorProfileId: string;
  idempotencyKey?: string;
  unitCost?: number | null;
  supplier?: string;
  freightCost?: number | null;
  receivedAt?: string;
  updateUnitCost?: boolean;
};

type MovementRecord = InventoryMovementRow & {
  product?: { name?: string | null; sku?: string | null } | null;
  actor?: { email?: string | null } | null;
};

export const inventoryMovementTypes: Array<{ value: InventoryMovementType; label: string }> = [
  { value: "initial_stock", label: "Initial stock" },
  { value: "restock", label: "Restock" },
  { value: "manual_adjustment", label: "Manual adjustment" },
  { value: "damage", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "promotional_giveaway", label: "Promotional giveaway" },
  { value: "sample_unit", label: "Sample unit" },
  { value: "inventory_correction", label: "Inventory correction" },
  { value: "returned_item", label: "Returned item" },
  { value: "other", label: "Other" },
];

export function getInventoryValue(product: Pick<ProductRow, "current_stock" | "current_unit_cost">) {
  return Number(product.current_stock ?? 0) * Number(product.current_unit_cost ?? 0);
}

export async function getInventoryDashboardData(): Promise<InventoryDashboardData> {
  const products = await getInventoryProducts();
  const items = products.map((product) => ({
    product,
    inventoryValue: getInventoryValue(product),
    status: getInventoryStatus(product),
  }));
  const trackedItems = items.filter((item) => item.status !== "not_tracked");

  return {
    items,
    summary: {
      totalUnits: trackedItems.reduce((sum, item) => sum + Number(item.product.current_stock ?? 0), 0),
      inventoryValue: trackedItems.reduce((sum, item) => sum + item.inventoryValue, 0),
      lowStockProducts: trackedItems.filter((item) => item.status === "low").length,
      outOfStockProducts: trackedItems.filter((item) => item.status === "out").length,
    },
  };
}

export async function getInventoryProducts() {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [] as ProductRow[];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error("Failed to load inventory products.");
  return (data ?? []) as ProductRow[];
}

export async function getInventoryHistory(filters: InventoryHistoryFilters = {}) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [] as InventoryHistoryItem[];

  let query = supabase
    .from("inventory_movements")
    .select("*, product:products(name, sku), actor:profiles(email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.movementType && filters.movementType !== "all") {
    query = query.eq("movement_type", filters.movementType);
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to load inventory history.");

  const search = filters.query?.trim().toLowerCase();
  const rows = ((data ?? []) as MovementRecord[]).map((movement) => ({
    ...movement,
    productName: movement.product?.name ?? "Unknown product",
    productSku: movement.product?.sku ?? null,
    actorEmail: movement.actor?.email ?? null,
  }));

  if (!search) return rows;

  return rows.filter((movement) =>
    [
      movement.productName,
      movement.productSku,
      movement.reason,
      movement.notes,
      movement.actorEmail,
      movement.movement_type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search),
  );
}

export async function adjustInventory(input: InventoryAdjustmentInput) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase.rpc("adjust_product_inventory", {
    p_product_id: input.productId,
    p_quantity_change: input.quantityChange,
    p_movement_type: input.movementType,
    p_reason: input.reason,
    p_notes: input.notes ?? null,
    p_actor_profile_id: input.actorProfileId,
    p_idempotency_key: input.idempotencyKey ?? null,
    p_unit_cost: input.unitCost ?? null,
    p_supplier: input.supplier ?? null,
    p_freight_cost: input.freightCost ?? null,
    p_received_at: input.receivedAt || null,
    p_update_unit_cost: Boolean(input.updateUnitCost),
  });

  if (error) {
    console.error("Inventory adjustment failed.", error);
    throw new Error(mapInventoryError(error.message));
  }

  revalidateInventoryAdmin();
  return data as InventoryMovementRow;
}

export function revalidateInventoryAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/history");
}

export function formatInventoryValue(value: number) {
  return formatPhp(value);
}

function mapInventoryError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("insufficient stock")) return "Insufficient stock for this adjustment.";
  if (lower.includes("tracking is disabled")) return "Inventory tracking is disabled for this product.";
  if (lower.includes("unit cost")) return "Unit cost cannot be negative and is required for restocking.";
  if (lower.includes("freight cost")) return "Freight cost cannot be negative.";
  if (lower.includes("quantity change")) return "Quantity must not be zero.";
  if (lower.includes("idempotency key")) return "This request key was already used for a different inventory adjustment.";
  if (lower.includes("admin profile")) return "You do not have permission to adjust inventory.";
  if (lower.includes("product not found")) return "Product not found.";
  return "Inventory adjustment failed. Please check the details and try again.";
}
