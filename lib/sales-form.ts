import type { PaymentMethod, SalePackageType } from "@/types/database";
import type { QuickSaleInput } from "@/lib/sales";

const packageTypes = new Set<SalePackageType>(["buy_1", "buy_2", "custom"]);
const paymentMethods = new Set<PaymentMethod>(["gcash", "bank_transfer", "cash", "other"]);

export function parseQuickSaleForm(formData: FormData, actorProfileId: string): QuickSaleInput {
  const productId = String(formData.get("product_id") ?? "").trim();
  const packageType = String(formData.get("package_type") ?? "buy_1") as SalePackageType;
  const paymentMethod = String(formData.get("payment_method") ?? "cash") as PaymentMethod;
  const referenceNumber = String(formData.get("reference_number") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim();

  if (!productId) throw new Error("Product is required.");
  if (!packageTypes.has(packageType)) throw new Error("Invalid sale package.");
  if (!paymentMethods.has(paymentMethod)) throw new Error("Invalid payment method.");
  if ((paymentMethod === "gcash" || paymentMethod === "bank_transfer") && !referenceNumber) {
    throw new Error("Payment reference is required for GCash or Bank Transfer.");
  }

  return {
    productId,
    packageType,
    customQuantity: packageType === "custom" ? positiveInteger(formData.get("custom_quantity"), "Custom quantity") : null,
    customAmount: packageType === "custom" ? nonNegativeNumber(formData.get("custom_amount"), "Custom amount") : null,
    paymentMethod,
    referenceNumber,
    notes,
    actorProfileId,
    idempotencyKey,
  };
}

export function parseCancelSaleForm(formData: FormData, actorProfileId: string) {
  const saleId = String(formData.get("sale_id") ?? "").trim();
  if (!saleId) throw new Error("Sale is required.");

  return {
    saleId,
    reason: String(formData.get("reason") ?? "").trim(),
    actorProfileId,
    idempotencyKey: String(formData.get("idempotency_key") ?? "").trim(),
  };
}

function positiveInteger(value: FormDataEntryValue | null, label: string) {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return number;
}

function nonNegativeNumber(value: FormDataEntryValue | null, label: string) {
  const number = Number(value ?? NaN);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }
  return number;
}
