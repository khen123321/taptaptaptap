import type { InventoryAdjustmentInput } from "@/lib/inventory";
import type { InventoryMovementType } from "@/types/database";

const movementTypes = new Set<InventoryMovementType>([
  "initial_stock",
  "restock",
  "manual_adjustment",
  "damage",
  "lost",
  "promotional_giveaway",
  "sample_unit",
  "inventory_correction",
  "returned_item",
  "other",
]);

const removalTypes = new Set<InventoryMovementType>([
  "damage",
  "lost",
  "promotional_giveaway",
  "sample_unit",
]);

export function parseInventoryAdjustmentForm(
  formData: FormData,
  actorProfileId: string,
): InventoryAdjustmentInput {
  const productId = String(formData.get("product_id") ?? "").trim();
  const flow = String(formData.get("flow") ?? "adjust");
  const action = String(formData.get("adjustment_action") ?? "add");
  const movementType = String(formData.get("movement_type") ?? (flow === "restock" ? "restock" : "manual_adjustment")) as InventoryMovementType;
  const rawQuantity = toInteger(formData.get("quantity"));
  const unitCost = nullableNumber(formData.get("unit_cost"));
  const freightCost = nullableNumber(formData.get("freight_cost"));
  const notes = String(formData.get("notes") ?? "").trim();
  const supplier = String(formData.get("supplier") ?? "").trim();
  const receivedAt = String(formData.get("received_at") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim();

  if (!productId) throw new Error("Product is required.");
  if (!movementTypes.has(movementType)) throw new Error("Invalid inventory reason.");
  if (!Number.isInteger(rawQuantity) || rawQuantity <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }
  if (unitCost !== null && unitCost < 0) throw new Error("Unit cost cannot be negative.");
  if (freightCost !== null && freightCost < 0) throw new Error("Freight cost cannot be negative.");

  if (flow === "restock") {
    if (unitCost === null) throw new Error("Cost per unit is required for restocking.");
    return {
      productId,
      quantityChange: rawQuantity,
      movementType: "restock",
      reason: "New stock received",
      notes,
      actorProfileId,
      idempotencyKey,
      unitCost,
      supplier,
      freightCost,
      receivedAt,
      updateUnitCost: String(formData.get("update_unit_cost") ?? "on") === "on",
    };
  }

  const quantityChange =
    action === "remove" || removalTypes.has(movementType) ? -rawQuantity : rawQuantity;

  return {
    productId,
    quantityChange,
    movementType,
    reason: movementLabel(movementType),
    notes,
    actorProfileId,
    idempotencyKey,
  };
}

function movementLabel(value: InventoryMovementType) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toInteger(value: FormDataEntryValue | null) {
  const number = Number(value ?? 0);
  return Number.isInteger(number) ? number : NaN;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : NaN;
}
