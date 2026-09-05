import type { PaymentMethod, SaleExpenseType, SalePackageType } from "@/types/database";
import type { QuickSaleInput } from "@/lib/sales";

const packageTypes = new Set<SalePackageType>(["buy_1", "buy_2", "bulk", "custom"]);
const paymentMethods = new Set<PaymentMethod>(["gcash", "bank_transfer", "cash", "other"]);
const saleStatuses = new Set(["pending", "completed"]);
const saleExpenseTypes = new Set<SaleExpenseType>([
  "gas_transportation",
  "shipping_delivery",
  "packaging",
  "printing_customization",
  "commission",
  "other",
]);

export function parseQuickSaleForm(formData: FormData, actorProfileId: string): QuickSaleInput {
  const productId = String(formData.get("product_id") ?? "").trim();
  const packageType = String(formData.get("package_type") ?? "buy_1") as SalePackageType;
  const paymentMethod = String(formData.get("payment_method") ?? "cash") as PaymentMethod;
  const referenceNumber = String(formData.get("reference_number") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim();
  const saleStatus = String(formData.get("sale_status") ?? "completed").trim();

  if (!productId) throw new Error("Product is required.");
  if (!packageTypes.has(packageType)) throw new Error("Invalid sale package.");
  if (!paymentMethods.has(paymentMethod)) throw new Error("Invalid payment method.");
  if (!saleStatuses.has(saleStatus)) throw new Error("Invalid sale status.");

  return {
    productId,
    packageType,
    customQuantity:
      packageType === "custom"
        ? positiveInteger(formData.get("custom_quantity"), "Custom quantity")
        : packageType === "bulk"
          ? positiveInteger(formData.get("bulk_quantity"), "Bulk quantity")
          : null,
    customAmount: packageType === "custom" ? nonNegativeNumber(formData.get("custom_amount"), "Custom amount") : null,
    paymentMethod,
    referenceNumber,
    notes,
    actorProfileId,
    idempotencyKey,
    saleStatus: saleStatus as "pending" | "completed",
    expenses: parseSaleExpenses(formData),
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

export function parseCompleteSaleForm(formData: FormData, actorProfileId: string) {
  const saleId = String(formData.get("sale_id") ?? "").trim();
  if (!saleId) throw new Error("Sale is required.");

  return {
    saleId,
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

function parseSaleExpenses(formData: FormData) {
  const types = formData.getAll("expense_type");
  const amounts = formData.getAll("expense_amount");
  const descriptions = formData.getAll("expense_description");

  return types.flatMap((typeValue, index) => {
    const expenseType = String(typeValue ?? "").trim() as SaleExpenseType;
    const amountValue = String(amounts[index] ?? "").trim();
    const description = String(descriptions[index] ?? "").trim();
    const hasAnyValue = Boolean(expenseType || amountValue || description);

    if (!hasAnyValue) return [];
    if (!saleExpenseTypes.has(expenseType)) throw new Error("Invalid deduction type.");
    if (!amountValue) throw new Error("Deduction amount is required.");

    const amount = nonNegativeNumber(amountValue, "Deduction amount");
    return [{ expenseType, amount, description }];
  });
}
