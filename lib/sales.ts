import { revalidatePath } from "next/cache";
import { createSupabaseSecretClient } from "@/lib/supabase/server";
import type { PaymentMethod, SalePackageType, SaleRow } from "@/types/database";

export type QuickSaleInput = {
  productId: string;
  packageType: SalePackageType;
  customQuantity?: number | null;
  customAmount?: number | null;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  actorProfileId: string;
  idempotencyKey?: string;
};

export type SaleResult = {
  saleId: string;
  saleNumber: string;
  status: string;
  productId: string;
  productName: string;
  packageLabel: string;
  quantity: number;
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
  unitCostSnapshot: number;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  previousStock: number;
  newStock: number;
  movementId: string;
  createdAt: string;
};

export type SalesSummary = {
  soldToday: number;
  salesToday: number;
  ordersToday: number;
};

export type ProductSalesTotals = Record<string, { soldToday: number; totalSold: number }>;

export type SaleListItem = {
  sale: SaleRow;
  productId: string;
  productName: string;
  sku: string | null;
  packageLabel: string;
  quantity: number;
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
  unitCostSnapshot: number;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  handledByEmail: string | null;
  movementId: string | null;
};

export type SalesFilters = {
  query?: string;
  date?: "today" | "all";
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
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
  }[] | null;
  payment?: {
    payment_method?: PaymentMethod | null;
    reference_number?: string | null;
  }[] | null;
  handler?: { email?: string | null } | null;
  movement?: { id?: string | null }[] | null;
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
  });

  if (error) {
    console.error("Quick sale failed.", error);
    throw new Error(mapSaleError(error.message));
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
    console.error("Sale cancellation failed.", error);
    throw new Error(mapSaleError(error.message));
  }

  revalidateSalesAdmin();
  return data as unknown as SaleResult;
}

export async function getSalesSummary(): Promise<SalesSummary> {
  const sales = await getSalesList({ date: "today", sort: "newest" });
  const completed = sales.filter((item) => item.sale.status === "completed");
  return {
    soldToday: completed.reduce((sum, item) => sum + item.quantity, 0),
    salesToday: completed.reduce((sum, item) => sum + Number(item.sale.total_amount ?? 0), 0),
    ordersToday: completed.length,
  };
}

export async function getProductSalesTotals(): Promise<ProductSalesTotals> {
  const sales = await getSalesList({ date: "all", sort: "newest" });
  return sales
    .filter((item) => item.sale.status === "completed")
    .reduce<ProductSalesTotals>((totals, item) => {
      const current = totals[item.productId] ?? { soldToday: 0, totalSold: 0 };
      const todayRange = getManilaTodayRange();
      const created = new Date(item.sale.created_at).getTime();
      totals[item.productId] = {
        soldToday:
          created >= todayRange.start.getTime() && created < todayRange.end.getTime()
            ? current.soldToday + item.quantity
            : current.soldToday,
        totalSold: current.totalSold + item.quantity,
      };
      return totals;
    }, {});
}

export async function getTodaySales(limit = 5) {
  return (await getSalesList({ date: "today", sort: "newest" }))
    .filter((item) => item.sale.status === "completed")
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
        gross_amount,
        discount_amount,
        final_amount,
        unit_cost_snapshot
      ),
      payment:payments(payment_method, reference_number),
      handler:profiles!sales_handled_by_profile_id_fkey(email),
      movement:inventory_movements(id)
    `)
    .limit(200);

  if (filters.date === "today") {
    const range = getManilaTodayRange();
    query = query.gte("created_at", range.start.toISOString()).lt("created_at", range.end.toISOString());
  }

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  if (sort === "amount_asc") query = query.order("total_amount", { ascending: true });
  if (sort === "amount_desc") query = query.order("total_amount", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error("Failed to load sales.");

  const rows = ((data ?? []) as unknown as SaleRecord[]).map(mapSaleRecord);
  const search = filters.query?.trim().toLowerCase();
  if (!search) return rows;

  return rows.filter((item) =>
    [
      item.sale.sale_number,
      item.productName,
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
  const item = record.item?.[0];
  const payment = record.payment?.[0];
  const movement = record.movement?.find((entry) => Boolean(entry.id));

  return {
    sale: record,
    productId: item?.product_id ?? "",
    productName: item?.product_name_snapshot ?? "Unknown product",
    sku: item?.sku_snapshot ?? null,
    packageLabel: item?.package_label ?? record.package_type,
    quantity: Number(item?.quantity ?? 0),
    grossAmount: Number(item?.gross_amount ?? record.gross_product_amount ?? 0),
    discountAmount: Number(item?.discount_amount ?? record.discount_total ?? 0),
    finalAmount: Number(item?.final_amount ?? record.total_amount ?? 0),
    unitCostSnapshot: Number(item?.unit_cost_snapshot ?? 0),
    paymentMethod: payment?.payment_method ?? "other",
    paymentReference: payment?.reference_number ?? null,
    handledByEmail: record.handler?.email ?? null,
    movementId: movement?.id ?? null,
  };
}

function mapSaleError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("insufficient stock")) return "Insufficient stock for this sale.";
  if (lower.includes("payment reference already exists")) return message;
  if (lower.includes("idempotency key")) return "This request key was already used for a different sale.";
  if (lower.includes("payment reference is required")) return "Payment reference is required for GCash or Bank Transfer.";
  if (lower.includes("inventory tracking is disabled")) return "Inventory tracking is disabled for this product.";
  if (lower.includes("invalid sale package")) return "Invalid sale package.";
  if (lower.includes("custom quantity")) return "Custom quantity must be a positive whole number.";
  if (lower.includes("custom amount")) return "Custom amount must be zero or greater.";
  if (lower.includes("product not found")) return "Product not found.";
  if (lower.includes("admin profile")) return "You do not have permission to record this sale.";
  if (lower.includes("sale not found")) return "Sale not found.";
  return "Sale operation failed. Please check the details and try again.";
}
