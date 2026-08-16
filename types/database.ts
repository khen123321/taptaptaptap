export type AdminRole = "admin" | "customer";
export type ProductStatus = "draft" | "published" | "archived";
export type DbProductType = "standard" | "custom";

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
