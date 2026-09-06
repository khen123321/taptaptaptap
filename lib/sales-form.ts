import type { PaymentMethod, SaleExpenseType, SaleItemPackageType } from "@/types/database";
import type { QuickSaleInput, QuickSaleItemInput } from "@/lib/sales";

const packageTypes = new Set<SaleItemPackageType>(["buy_1", "buy_2", "bulk", "custom"]);
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
  const packageType = String(formData.get("package_type") ?? "buy_1") as SaleItemPackageType;
  const saleItems = parseSaleItems(formData);
  const paymentMethod = String(formData.get("payment_method") ?? "cash") as PaymentMethod;
  const referenceNumber = String(formData.get("reference_number") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim();
  const saleStatus = String(formData.get("sale_status") ?? "completed").trim();
  const completedAt =
    saleStatus === "completed"
      ? parseManilaCompletedAt(formData.get("sold_date"), formData.get("sold_time"))
      : null;

  if (!productId && saleItems.length === 0) throw new Error("Product is required.");
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
    saleItems,
    paymentMethod,
    referenceNumber,
    notes,
    actorProfileId,
    idempotencyKey,
    saleStatus: saleStatus as "pending" | "completed",
    completedAt,
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
    completedAt: parseManilaCompletedAt(formData.get("sold_date"), formData.get("sold_time")),
  };
}

export function parseUpdateSaleForm(formData: FormData, actorProfileId: string) {
  const saleId = String(formData.get("sale_id") ?? "").trim();
  const status = String(formData.get("sale_status") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "cash") as PaymentMethod;
  const packageType = String(formData.get("package_type") ?? "buy_1") as SaleItemPackageType;
  const saleItems = parseSaleItems(formData);
  if (!saleId) throw new Error("Sale is required.");
  if (!paymentMethods.has(paymentMethod)) throw new Error("Invalid payment method.");
  if (status === "pending" && !packageTypes.has(packageType)) throw new Error("Invalid sale package.");

  const productId = status === "pending" ? String(formData.get("product_id") ?? "").trim() : null;
  if (status === "pending" && !productId && saleItems.length === 0) throw new Error("Product is required.");

  return {
    saleId,
    productId,
    packageType: status === "pending" ? packageType : null,
    customQuantity:
      status === "pending" && packageType === "custom"
        ? positiveInteger(formData.get("custom_quantity"), "Custom quantity")
        : status === "pending" && packageType === "bulk"
          ? positiveInteger(formData.get("bulk_quantity"), "Bulk quantity")
          : null,
    customAmount:
      status === "pending" && packageType === "custom"
        ? nonNegativeNumber(formData.get("custom_amount"), "Custom amount")
        : null,
    saleItems: status === "pending" ? saleItems : [],
    paymentMethod,
    referenceNumber: String(formData.get("reference_number") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    actorProfileId,
    idempotencyKey: String(formData.get("idempotency_key") ?? "").trim(),
    completedAt:
      status === "completed"
        ? parseManilaCompletedAt(formData.get("sold_date"), formData.get("sold_time"))
        : null,
    expenses: parseSaleExpenses(formData),
  };
}

function parseSaleItems(formData: FormData): QuickSaleItemInput[] {
  const raw = String(formData.get("sale_items") ?? "").trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Sale items are invalid.");
  }

  if (!Array.isArray(parsed)) throw new Error("Sale items must be an array.");

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Sale item ${index + 1} is invalid.`);
    const item = entry as Record<string, unknown>;
    const productId = String(item.productId ?? item.product_id ?? "").trim();
    const packageType = String(item.packageType ?? item.package_type ?? "buy_1") as SaleItemPackageType;
    const quantityValue = item.quantity ?? item.customQuantity ?? item.custom_quantity ?? null;
    const customAmountValue = item.customAmount ?? item.custom_amount ?? null;

    if (!productId) throw new Error(`Product is required for sale item ${index + 1}.`);
    if (!packageTypes.has(packageType)) throw new Error(`Invalid package for sale item ${index + 1}.`);

    return {
      productId,
      packageType,
      quantity: packageType === "custom" || packageType === "bulk"
        ? positiveIntegerValue(quantityValue, `Quantity for sale item ${index + 1}`)
        : null,
      customAmount: packageType === "custom"
        ? nonNegativeNumberValue(customAmountValue, `Custom amount for sale item ${index + 1}`)
        : null,
    };
  });
}

export function parseDeleteSaleForm(formData: FormData, actorProfileId: string) {
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
  return positiveIntegerValue(value, label);
}

function positiveIntegerValue(value: unknown, label: string) {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return number;
}

function nonNegativeNumber(value: FormDataEntryValue | null, label: string) {
  return nonNegativeNumberValue(value, label);
}

function nonNegativeNumberValue(value: unknown, label: string) {
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

function parseManilaCompletedAt(dateValue: FormDataEntryValue | null, timeValue: FormDataEntryValue | null) {
  const date = String(dateValue ?? "").trim();
  const time = String(timeValue ?? "").trim();
  if (!date || !time) throw new Error("Sold date and time are required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Sold date is invalid.");
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("Sold time is invalid.");

  const completedAt = new Date(`${date}T${time}:00+08:00`);
  if (Number.isNaN(completedAt.getTime())) throw new Error("Sold date and time are invalid.");
  if (completedAt.getTime() > Date.now()) throw new Error("Sold date and time cannot be in the future.");
  return completedAt.toISOString();
}
