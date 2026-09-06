import { revalidatePath } from "next/cache";
import { createSupabaseSecretClient } from "@/lib/supabase/server";
import type {
  PaymentMethod,
  SaleExpenseRow,
  SaleExpenseType,
  SaleItemPackageType,
  SaleRow,
} from "@/types/database";

type SupabaseRpcError = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export type SaleExpenseInput = {
  expenseType: SaleExpenseType;
  amount: number;
  description?: string;
};

export type QuickSaleItemInput = {
  productId: string;
  packageType: SaleItemPackageType;
  quantity?: number | null;
  customAmount?: number | null;
};

export type QuickSaleInput = {
  productId: string;
  packageType: SaleItemPackageType;
  customQuantity?: number | null;
  customAmount?: number | null;
  saleItems?: QuickSaleItemInput[];
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  actorProfileId: string;
  idempotencyKey?: string;
  saleStatus?: "pending" | "completed";
  completedAt?: string | null;
  expenses?: SaleExpenseInput[];
};

export type UpdateSaleInput = {
  saleId: string;
  productId?: string | null;
  packageType?: SaleItemPackageType | null;
  customQuantity?: number | null;
  customAmount?: number | null;
  saleItems?: QuickSaleItemInput[];
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string;
  notes?: string;
  actorProfileId: string;
  idempotencyKey?: string;
  completedAt?: string | null;
  expenses?: SaleExpenseInput[];
};

export type DeleteSaleInput = {
  saleId: string;
  reason?: string;
  actorProfileId: string;
  idempotencyKey?: string;
};

export type SaleResult = {
  saleId: string;
  saleNumber: string;
  status: string;
  items: SaleLineItem[];
  productId: string;
  productName: string;
  packageLabel: string;
  pricingTierLabel: string | null;
  quantity: number;
  regularUnitPrice: number;
  bulkUnitPrice: number | null;
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
  unitCostSnapshot: number;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  previousStock: number | null;
  newStock: number | null;
  movementId: string | null;
  totalDirectDeductions: number;
  netAfterDeductions: number;
  expenses: SaleExpenseRow[];
  createdAt: string;
  completedAt: string | null;
};

export type SalesSummary = {
  soldToday: number;
  salesToday: number;
  ordersToday: number;
  directDeductionsToday: number;
  netAfterDirectDeductionsToday: number;
};

export type SalesOverallMetrics = {
  totalSold: number;
  totalOrders: number;
  totalSales: number;
  totalDeductions: number;
  totalNetAfterDeductions: number;
};

export type SalesMetrics = {
  today: SalesSummary;
  overall: SalesOverallMetrics;
};

export type ProductSalesTotals = Record<string, { soldToday: number; totalSold: number }>;

export type SaleLineItem = {
  productId: string;
  productName: string;
  sku: string | null;
  packageLabel: string;
  pricingTierLabel: string | null;
  quantity: number;
  regularUnitPrice: number;
  bulkUnitPrice: number | null;
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
  unitCostSnapshot: number;
};

export type SaleListItem = {
  sale: SaleRow;
  items: SaleLineItem[];
  productId: string;
  productName: string;
  sku: string | null;
  packageLabel: string;
  pricingTierLabel: string | null;
  quantity: number;
  regularUnitPrice: number;
  bulkUnitPrice: number | null;
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
  unitCostSnapshot: number;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  handledByEmail: string | null;
  movementId: string | null;
  expenses: SaleExpenseRow[];
  totalDirectDeductions: number;
  netAfterDeductions: number;
};

export type SalesFilters = {
  query?: string;
  date?: "today" | "all";
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
};

export type SalesDashboardMetrics = {
  summary: SalesSummary;
  productSalesTotals: ProductSalesTotals;
  todaySales: SaleListItem[];
};

type SaleRecord = SaleRow & {
  item?: {
    product_id?: string | null;
    product_name_snapshot?: string | null;
    sku_snapshot?: string | null;
    package_label?: string | null;
    quantity?: number | null;
    gross_amount?: number | null;
    discount_amount?: number | null;
    final_amount?: number | null;
    unit_cost_snapshot?: number | null;
    unit_regular_price?: number | null;
    bulk_unit_price?: number | null;
    pricing_tier_label?: string | null;
  }[] | null;
  payment?: {
    payment_method?: PaymentMethod | null;
    reference_number?: string | null;
  }[] | null;
  expenses?: SaleExpenseRow[] | null;
  handler?: { email?: string | null } | null;
  movement?: { id?: string | null }[] | null;
};

type SaleMetricsRecord = Pick<SaleRow, "status" | "total_amount" | "completed_at"> & {
  item?: { quantity?: number | null }[] | null;
  expenses?: { amount?: number | null }[] | null;
};

export async function recordQuickPhysicalSale(input: QuickSaleInput) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase.rpc("record_quick_physical_sale", {
    p_product_id: input.productId,
    p_package_type: input.packageType,
    p_custom_quantity: input.customQuantity ?? null,
    p_custom_amount: input.customAmount ?? null,
    p_payment_method: input.paymentMethod,
    p_reference_number: input.referenceNumber ?? null,
    p_notes: input.notes ?? null,
    p_actor_profile_id: input.actorProfileId,
    p_idempotency_key: input.idempotencyKey ?? null,
    p_sale_status: input.saleStatus ?? "completed",
    p_completed_at: input.completedAt ?? null,
    p_sale_expenses: input.expenses ?? [],
    p_sale_items: input.saleItems ?? [],
  });

  if (error) {
    logRpcError("Quick sale RPC failed", error);
    throw new Error(mapSaleError(error));
  }

  revalidateSalesAdmin();
  return data as unknown as SaleResult;
}

export async function completePendingQuickSale(input: {
  saleId: string;
  actorProfileId: string;
  idempotencyKey?: string;
  completedAt?: string | null;
}) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase.rpc("complete_pending_quick_sale", {
    p_sale_id: input.saleId,
    p_actor_profile_id: input.actorProfileId,
    p_idempotency_key: input.idempotencyKey ?? null,
    p_completed_at: input.completedAt ?? null,
  });

  if (error) {
    logRpcError("Pending sale completion RPC failed", error);
    throw new Error(mapSaleError(error));
  }

  revalidateSalesAdmin();
  return data as unknown as SaleResult;
}

export async function cancelQuickSale(input: {
  saleId: string;
  reason?: string;
  actorProfileId: string;
  idempotencyKey?: string;
}) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase.rpc("cancel_quick_sale", {
    p_sale_id: input.saleId,
    p_reason: input.reason ?? null,
    p_actor_profile_id: input.actorProfileId,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    logRpcError("Sale cancellation RPC failed", error);
    throw new Error(mapSaleError(error));
  }

  revalidateSalesAdmin();
  return data as unknown as SaleResult;
}

export async function updateQuickSale(input: UpdateSaleInput) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase.rpc("update_quick_sale", {
    p_sale_id: input.saleId,
    p_product_id: input.productId ?? null,
    p_package_type: input.packageType ?? null,
    p_custom_quantity: input.customQuantity ?? null,
    p_custom_amount: input.customAmount ?? null,
    p_payment_method: input.paymentMethod ?? null,
    p_reference_number: input.referenceNumber ?? null,
    p_notes: input.notes ?? null,
    p_actor_profile_id: input.actorProfileId,
    p_idempotency_key: input.idempotencyKey ?? null,
    p_completed_at: input.completedAt ?? null,
    p_sale_expenses: input.expenses ?? [],
    p_sale_items: input.saleItems ?? [],
  });

  if (error) {
    logRpcError("Sale update RPC failed", error);
    throw new Error(mapSaleError(error));
  }

  revalidateSalesAdmin();
  return data as unknown as SaleResult;
}

export async function softDeleteQuickSale(input: DeleteSaleInput) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) throw new Error("Missing Supabase secret key configuration.");

  const { data, error } = await supabase.rpc("soft_delete_quick_sale", {
    p_sale_id: input.saleId,
    p_reason: input.reason ?? null,
    p_actor_profile_id: input.actorProfileId,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    logRpcError("Sale delete RPC failed", error);
    throw new Error(mapSaleError(error));
  }

  revalidateSalesAdmin();
  return data as unknown as SaleResult;
}

export async function getSalesSummary(): Promise<SalesSummary> {
  return deriveSalesSummary(await getSalesList({ date: "today", sort: "newest" }));
}

export async function getOverallSalesMetrics() {
  return (await getSalesMetrics()).overall;
}

export async function getSalesMetrics(): Promise<SalesMetrics> {
  const supabase = createSupabaseSecretClient();
  if (!supabase) {
    return {
      today: emptySalesSummary(),
      overall: emptyOverallSalesMetrics(),
    };
  }

  const records: SaleMetricsRecord[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        status,
        total_amount,
        completed_at,
        item:sale_items(quantity),
        expenses:sale_expenses(amount)
      `)
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load total sales", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error("Failed to load total sales.");
    }

    const rows = (data ?? []) as unknown as SaleMetricsRecord[];
    records.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return deriveSalesMetrics(records);
}

export async function getProductSalesTotals(): Promise<ProductSalesTotals> {
  return deriveProductSalesTotals(await getSalesList({ date: "all", sort: "newest" }));
}

export async function getTodaySales(limit = 5) {
  return deriveTodaySales(await getSalesList({ date: "today", sort: "newest" }), limit);
}

export function deriveSalesDashboardMetrics(sales: SaleListItem[], todayLimit = 5): SalesDashboardMetrics {
  return {
    summary: deriveSalesSummary(sales),
    productSalesTotals: deriveProductSalesTotals(sales),
    todaySales: deriveTodaySales(sales, todayLimit),
  };
}

export function deriveSalesSummary(sales: SaleListItem[]): SalesSummary {
  const todayRange = getManilaTodayRange();
  const completedToday = sales.filter((item) => isCompletedInRange(item, todayRange));
  return {
    soldToday: completedToday.reduce((sum, item) => sum + item.quantity, 0),
    salesToday: completedToday.reduce((sum, item) => sum + Number(item.sale.total_amount ?? 0), 0),
    ordersToday: completedToday.length,
    directDeductionsToday: completedToday.reduce((sum, item) => sum + item.totalDirectDeductions, 0),
    netAfterDirectDeductionsToday: completedToday.reduce((sum, item) => sum + item.netAfterDeductions, 0),
  };
}

function deriveSalesMetrics(records: SaleMetricsRecord[]): SalesMetrics {
  const todayRange = getManilaTodayRange();
  const overall = records.reduce<SalesOverallMetrics>((totals, sale) => {
    const totalSales = Number(sale.total_amount ?? 0);
    const totalDeductions = (sale.expenses ?? []).reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);

    totals.totalSold += (sale.item ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    totals.totalOrders += 1;
    totals.totalSales += totalSales;
    totals.totalDeductions += totalDeductions;
    totals.totalNetAfterDeductions += totalSales - totalDeductions;
    return totals;
  }, emptyOverallSalesMetrics());

  const today = records
    .filter((sale) => isCompletedAtInRange(sale.completed_at, todayRange))
    .reduce<SalesSummary>((totals, sale) => {
      const salesToday = Number(sale.total_amount ?? 0);
      const directDeductionsToday = (sale.expenses ?? []).reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);

      totals.soldToday += (sale.item ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
      totals.salesToday += salesToday;
      totals.ordersToday += 1;
      totals.directDeductionsToday += directDeductionsToday;
      totals.netAfterDirectDeductionsToday += salesToday - directDeductionsToday;
      return totals;
    }, emptySalesSummary());

  return { today, overall };
}

function emptySalesSummary(): SalesSummary {
  return {
    soldToday: 0,
    salesToday: 0,
    ordersToday: 0,
    directDeductionsToday: 0,
    netAfterDirectDeductionsToday: 0,
  };
}

function emptyOverallSalesMetrics(): SalesOverallMetrics {
  return {
    totalSold: 0,
    totalOrders: 0,
    totalSales: 0,
    totalDeductions: 0,
    totalNetAfterDeductions: 0,
  };
}

export function deriveProductSalesTotals(sales: SaleListItem[]): ProductSalesTotals {
  const todayRange = getManilaTodayRange();
  return sales
    .filter((sale) => sale.sale.status === "completed")
    .reduce<ProductSalesTotals>((totals, sale) => {
      for (const item of sale.items) {
        const current = totals[item.productId] ?? { soldToday: 0, totalSold: 0 };
        totals[item.productId] = {
          soldToday: isCompletedInRange(sale, todayRange) ? current.soldToday + item.quantity : current.soldToday,
          totalSold: current.totalSold + item.quantity,
        };
      }
      return totals;
    }, {});
}

export function deriveTodaySales(sales: SaleListItem[], limit = 5) {
  const todayRange = getManilaTodayRange();
  return sales
    .filter((item) => isCompletedInRange(item, todayRange))
    .slice(0, limit);
}

export async function getSalesList(filters: SalesFilters = {}) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [] as SaleListItem[];

  const sort = filters.sort ?? "newest";
  let query = supabase
    .from("sales")
    .select(`
      *,
      item:sale_items(
        product_id,
        product_name_snapshot,
        sku_snapshot,
        package_label,
        quantity,
        unit_regular_price,
        bulk_unit_price,
        pricing_tier_label,
        gross_amount,
        discount_amount,
        final_amount,
        unit_cost_snapshot
      ),
      payment:payments(payment_method, reference_number),
      expenses:sale_expenses(
        id,
        sale_id,
        expense_type,
        amount,
        description,
        created_by_profile_id,
        created_at
      ),
      handler:profiles!sales_handled_by_profile_id_fkey(email),
      movement:inventory_movements(id)
    `)
    .limit(200);

  query = query.is("deleted_at", null);

  if (filters.date === "today") {
    const range = getManilaTodayRange();
    query = query.gte("completed_at", range.start.toISOString()).lt("completed_at", range.end.toISOString());
  }

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  if (sort === "amount_asc") query = query.order("total_amount", { ascending: true });
  if (sort === "amount_desc") query = query.order("total_amount", { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load sales", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to load sales.");
  }

  const rows = ((data ?? []) as unknown as SaleRecord[]).map(mapSaleRecord);
  if (sort === "newest" || sort === "oldest") {
    rows.sort((a, b) => {
      const aTime = getSaleSortTime(a);
      const bTime = getSaleSortTime(b);
      return sort === "newest" ? bTime - aTime : aTime - bTime;
    });
  }

  const search = filters.query?.trim().toLowerCase();
  if (!search) return rows;

  return rows.filter((item) =>
    [
      item.sale.sale_number,
      item.productName,
      item.items.map((saleItem) => `${saleItem.productName} ${saleItem.sku ?? ""}`).join(" "),
      item.sku,
      item.paymentMethod,
      item.paymentReference,
      item.handledByEmail,
      item.sale.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search),
  );
}

export function getManilaTodayRange(now = new Date()) {
  const manilaOffsetMs = 8 * 60 * 60 * 1000;
  const manilaNow = new Date(now.getTime() + manilaOffsetMs);
  const startUtc = Date.UTC(
    manilaNow.getUTCFullYear(),
    manilaNow.getUTCMonth(),
    manilaNow.getUTCDate(),
  ) - manilaOffsetMs;

  return {
    start: new Date(startUtc),
    end: new Date(startUtc + 24 * 60 * 60 * 1000),
  };
}

export function revalidateSalesAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/history");
  revalidatePath("/admin/sales");
}

function mapSaleRecord(record: SaleRecord): SaleListItem {
  const items = (record.item ?? []).map((item) => ({
    productId: item.product_id ?? "",
    productName: item.product_name_snapshot ?? "Unknown product",
    sku: item.sku_snapshot ?? null,
    packageLabel: item.package_label ?? record.package_type,
    pricingTierLabel: item.pricing_tier_label ?? null,
    quantity: Number(item.quantity ?? 0),
    regularUnitPrice: Number(item.unit_regular_price ?? 0),
    bulkUnitPrice: item.bulk_unit_price == null ? null : Number(item.bulk_unit_price),
    grossAmount: Number(item.gross_amount ?? 0),
    discountAmount: Number(item.discount_amount ?? 0),
    finalAmount: Number(item.final_amount ?? 0),
    unitCostSnapshot: Number(item.unit_cost_snapshot ?? 0),
  }));
  const item = items[0];
  const payment = record.payment?.[0];
  const movement = record.movement?.find((entry) => Boolean(entry.id));
  const expenses = record.expenses ?? [];
  const totalDirectDeductions = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const finalAmount = Number(record.total_amount ?? items.reduce((sum, entry) => sum + entry.finalAmount, 0));
  const grossAmount = Number(record.gross_product_amount ?? items.reduce((sum, entry) => sum + entry.grossAmount, 0));
  const discountAmount = Number(record.discount_total ?? items.reduce((sum, entry) => sum + entry.discountAmount, 0));
  const quantity = items.reduce((sum, entry) => sum + entry.quantity, 0);
  const isCombo = items.length > 1 || record.package_type === "combo";
  const isMixMatch = isCombo && items.length > 1 && items.every((entry) => entry.packageLabel === "Mix & Match");

  return {
    sale: record,
    items,
    productId: item?.productId ?? "",
    productName: isCombo ? productSummary(items) : item?.productName ?? "Unknown product",
    sku: isCombo ? null : item?.sku ?? null,
    packageLabel: isMixMatch ? "Mix & Match" : isCombo ? "Combo" : item?.packageLabel ?? record.package_type,
    pricingTierLabel: isMixMatch ? item?.pricingTierLabel ?? null : isCombo ? null : item?.pricingTierLabel ?? null,
    quantity,
    regularUnitPrice: isCombo ? 0 : item?.regularUnitPrice ?? 0,
    bulkUnitPrice: isCombo ? null : item?.bulkUnitPrice ?? null,
    grossAmount,
    discountAmount,
    finalAmount,
    unitCostSnapshot: isCombo ? items.reduce((sum, entry) => sum + entry.unitCostSnapshot * entry.quantity, 0) : item?.unitCostSnapshot ?? 0,
    paymentMethod: payment?.payment_method ?? "other",
    paymentReference: payment?.reference_number ?? null,
    handledByEmail: record.handler?.email ?? null,
    movementId: movement?.id ?? null,
    expenses,
    totalDirectDeductions,
    netAfterDeductions: finalAmount - totalDirectDeductions,
  };
}

function productSummary(items: SaleLineItem[]) {
  if (items.length === 0) return "Unknown product";
  if (items.length === 1) return items[0].productName;
  if (items.length === 2) return `${items[0].productName} + ${items[1].productName}`;
  return `${items[0].productName} + ${items.length - 1} more`;
}

function isCompletedInRange(item: SaleListItem, range: ReturnType<typeof getManilaTodayRange>) {
  if (item.sale.status !== "completed") return false;
  return isCompletedAtInRange(item.sale.completed_at, range);
}

function isCompletedAtInRange(completedAt: string | null, range: ReturnType<typeof getManilaTodayRange>) {
  if (!completedAt) return false;
  const completed = new Date(completedAt).getTime();
  return completed >= range.start.getTime() && completed < range.end.getTime();
}

function getSaleSortTime(item: SaleListItem) {
  const value = item.sale.status === "completed" ? item.sale.completed_at : item.sale.created_at;
  return new Date(value ?? item.sale.created_at).getTime();
}

function logRpcError(label: string, error: SupabaseRpcError) {
  console.error(label, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function mapSaleError(error: string | SupabaseRpcError) {
  const message = typeof error === "string" ? error : error.message;
  const searchText = typeof error === "string"
    ? error
    : `${error.message} ${error.code ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  const lower = searchText.toLowerCase();
  if (
    lower.includes("p_sale_items") ||
    lower.includes("schema cache") ||
    lower.includes("could not find the function") ||
    lower.includes("pgrst202")
  ) {
    return "The sales database migration has not been applied. Run supabase/migrations/202609060001_combo_quick_sales.sql, then retry this sale.";
  }
  if (lower.includes("insufficient stock")) return "Insufficient stock for this sale.";
  if (lower.includes("bulk pricing starts")) return "Bulk pricing starts at 10 units.";
  if (lower.includes("bulk pricing is not enabled")) return "Bulk pricing is not enabled for this product.";
  if (lower.includes("bulk pricing is not fully configured")) return "Bulk pricing is not fully configured for this product.";
  if (lower.includes("bulk quantity")) return "Bulk quantity must be a positive whole number.";
  if (lower.includes("cancelled sales cannot be marked sold")) return "Cancelled sales cannot be marked sold.";
  if (lower.includes("future")) return "Sold date and time cannot be in the future.";
  if (lower.includes("payment reference already exists")) return message;
  if (lower.includes("idempotency key")) return "This request key was already used for a different sale.";
  if (lower.includes("payment reference is required")) return "Payment reference is required for GCash or Bank Transfer.";
  if (lower.includes("inventory tracking is disabled")) return "Inventory tracking is disabled for this product.";
  if (lower.includes("invalid sale package")) return "Invalid sale package.";
  if (lower.includes("invalid sale status")) return "Invalid sale status.";
  if (lower.includes("custom quantity")) return "Custom quantity must be a positive whole number.";
  if (lower.includes("custom amount")) return "Custom amount must be zero or greater.";
  if (lower.includes("product not found")) return "Product not found.";
  if (lower.includes("admin profile")) return "You do not have permission to record this sale.";
  if (lower.includes("sale not found")) return "Sale not found.";
  return "Sale operation failed. Please check the details and try again.";
}
