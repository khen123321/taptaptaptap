export type AdminRole = "admin" | "customer";
export type ProductStatus = "draft" | "published" | "archived";
export type DbProductType = "standard" | "custom";
export type InventoryMovementType =
  | "initial_stock"
  | "restock"
  | "manual_adjustment"
  | "damage"
  | "lost"
  | "promotional_giveaway"
  | "sample_unit"
  | "inventory_correction"
  | "returned_item"
  | "other"
  | "sale_commit"
  | "sale_cancel_restore"
  | "refund_restore";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  product_type: DbProductType;
  category: string | null;
  price_single: number;
  price_bundle: number;
  bundle_savings: number;
  card_image_url?: string | null;
  detail_image_url: string | null;
  mockup_image_url?: string | null;
  included_features: string[];
  cta_label: string | null;
  cta_href: string | null;
  status: ProductStatus;
  display_order: number;
  sku: string | null;
  current_stock: number;
  current_unit_cost: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  default_online_price: number | null;
  default_physical_price: number | null;
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  product_type: DbProductType;
  category: string;
  price_single: number;
  price_bundle: number;
  bundle_savings: number;
  card_image_url?: string;
  detail_image_url: string;
  mockup_image_url?: string;
  included_features: string[];
  cta_label: string;
  cta_href: string;
  status: ProductStatus;
  display_order: number;
  sku: string;
  current_unit_cost: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  default_online_price: number | null;
  default_physical_price: number | null;
};

export type InventoryMovementRow = {
  id: string;
  product_id: string;
  movement_type: InventoryMovementType;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  notes: string | null;
  actor_profile_id: string | null;
  related_sale_id: string | null;
  reference_id: string | null;
  idempotency_key: string | null;
  created_at: string;
};

export type InventoryReceiptRow = {
  id: string;
  movement_id: string;
  product_id: string;
  quantity_received: number;
  unit_cost: number;
  supplier: string | null;
  freight_cost: number | null;
  received_at: string;
  notes: string | null;
  actor_profile_id: string | null;
  created_at: string;
};

export type AnalyticsEventName =
  | "page_view"
  | "product_view"
  | "product_details_open"
  | "customizer_open"
  | "customizer_upload"
  | "customizer_request"
  | "contact_click"
  | "facebook_click"
  | "email_click"
  | "shop_click"
  | "reseller_modal_open"
  | "reseller_email_click"
  | "reseller_facebook_click";

export type AnalyticsPeriod = "today" | "7d" | "30d" | "all";

export type AnalyticsSummary = {
  totalViews: number;
  uniqueVisitors: number;
  productViews: number;
  detailOpens: number;
  customizerOpens: number;
  ctaClicks: number;
  products: number;
};

export type AnalyticsPoint = {
  label: string;
  views: number;
};

export type AnalyticsDashboardData = {
  summary: AnalyticsSummary;
  comparisons: Record<keyof Omit<AnalyticsSummary, "products">, string | null>;
  traffic: AnalyticsPoint[];
  topPages: Array<{ page: string; views: number }>;
  topProducts: Array<{ product: string; views: number; detailOpens: number }>;
  topActions: Array<{ action: string; count: number }>;
  trafficSources: Array<{ source: string; count: number; percentage: number }>;
  funnel: Array<{ label: string; count: number }>;
  hasEvents: boolean;
  rangeLabel: string;
};
