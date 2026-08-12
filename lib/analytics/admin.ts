import { ctaEventNames, getSourceCategory } from "@/lib/analytics/shared";
import { createSupabaseSecretClient } from "@/lib/supabase/server";
import type {
  AnalyticsDashboardData,
  AnalyticsEventName,
  AnalyticsPeriod,
  AnalyticsPoint,
  AnalyticsSummary,
} from "@/types/database";

type AnalyticsEventRow = {
  id: string;
  session_id: string;
  event_name: AnalyticsEventName;
  page_path: string | null;
  product_id: string | null;
  referrer: string | null;
  created_at: string;
};

type ProductNameRow = {
  id: string;
  name: string;
};

const actionLabels: Partial<Record<AnalyticsEventName, string>> = {
  product_details_open: "Product Details Opened",
  customizer_open: "Customizer Opened",
  customizer_upload: "Artwork Uploaded",
  customizer_request: "Customizer Requests",
  contact_click: "Contact Clicks",
  facebook_click: "Facebook Clicks",
  email_click: "Email Clicks",
  shop_click: "Shop Clicks",
};

export async function getAnalyticsDashboard(period: AnalyticsPeriod): Promise<AnalyticsDashboardData> {
  const range = getAnalyticsRange(period);
  const [events, previousEvents, productNames, publishedProducts] = await Promise.all([
    loadEvents(range.start, range.end),
    range.previousStart ? loadEvents(range.previousStart, range.start) : Promise.resolve([]),
    loadProductNames(),
    countPublishedProducts(),
  ]);

  const summary = getSummary(events, publishedProducts);
  const previousSummary = getSummary(previousEvents, publishedProducts);

  return {
    summary,
    comparisons: getComparisons(summary, previousSummary),
    traffic: getTrafficPoints(events, period, range.start, range.end),
    topPages: getTopPages(events),
    topProducts: getTopProducts(events, productNames),
    topActions: getTopActions(events),
    trafficSources: getTrafficSources(events),
    funnel: getFunnel(events),
    hasEvents: events.length > 0,
    rangeLabel: range.label,
  };
}

async function loadEvents(start: Date | null, end: Date) {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return [];

  let query = supabase
    .from("analytics_events")
    .select("id, session_id, event_name, page_path, product_id, referrer, created_at")
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: true });

  if (start) query = query.gte("created_at", start.toISOString());

  const { data, error } = await query;
  if (error) throw new Error("Failed to load analytics events.");
  return (data ?? []) as AnalyticsEventRow[];
}

async function loadProductNames() {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return new Map<string, string>();

  const { data, error } = await supabase.from("products").select("id, name");
  if (error) return new Map<string, string>();

  return new Map((data as ProductNameRow[]).map((product) => [product.id, product.name]));
}

async function countPublishedProducts() {
  const supabase = createSupabaseSecretClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  return count ?? 0;
}

function getSummary(events: AnalyticsEventRow[], products: number): AnalyticsSummary {
  return {
    totalViews: countEvents(events, "page_view"),
    uniqueVisitors: new Set(events.map((event) => event.session_id)).size,
    productViews: countEvents(events, "product_view"),
    detailOpens: countEvents(events, "product_details_open"),
    customizerOpens: countEvents(events, "customizer_open"),
    ctaClicks: events.filter((event) => ctaEventNames.includes(event.event_name)).length,
    products,
  };
}

function getComparisons(current: AnalyticsSummary, previous: AnalyticsSummary) {
  return {
    totalViews: formatChange(current.totalViews, previous.totalViews),
    uniqueVisitors: formatChange(current.uniqueVisitors, previous.uniqueVisitors),
    productViews: formatChange(current.productViews, previous.productViews),
    detailOpens: formatChange(current.detailOpens, previous.detailOpens),
    customizerOpens: formatChange(current.customizerOpens, previous.customizerOpens),
    ctaClicks: formatChange(current.ctaClicks, previous.ctaClicks),
  };
}

function formatChange(current: number, previous: number) {
  if (!previous) return null;
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function countEvents(events: AnalyticsEventRow[], eventName: AnalyticsEventName) {
  return events.filter((event) => event.event_name === eventName).length;
}

function getTopPages(events: AnalyticsEventRow[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.event_name !== "page_view" || !event.page_path) continue;
    counts.set(event.page_path, (counts.get(event.page_path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);
}

function getTopProducts(events: AnalyticsEventRow[], productNames: Map<string, string>) {
  const counts = new Map<string, { views: number; detailOpens: number }>();
  for (const event of events) {
    if (!event.product_id || (event.event_name !== "product_view" && event.event_name !== "product_details_open")) {
      continue;
    }
    const current = counts.get(event.product_id) ?? { views: 0, detailOpens: 0 };
    if (event.event_name === "product_view") current.views += 1;
    if (event.event_name === "product_details_open") current.detailOpens += 1;
    counts.set(event.product_id, current);
  }

  return [...counts.entries()]
    .map(([productId, countsForProduct]) => ({
      product: productNames.get(productId) ?? "Deleted product",
      views: countsForProduct.views,
      detailOpens: countsForProduct.detailOpens,
    }))
    .sort((a, b) => b.views + b.detailOpens - (a.views + a.detailOpens))
    .slice(0, 8);
}

function getTopActions(events: AnalyticsEventRow[]) {
  return Object.entries(actionLabels)
    .map(([eventName, label]) => ({
      action: label ?? eventName,
      count: countEvents(events, eventName as AnalyticsEventName),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function getTrafficSources(events: AnalyticsEventRow[]) {
  const pageViews = events.filter((event) => event.event_name === "page_view");
  const counts = new Map<string, number>();
  for (const event of pageViews) {
    const source = getSourceCategory(event.referrer);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  const total = pageViews.length || 1;
  return [...counts.entries()]
    .map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function getFunnel(events: AnalyticsEventRow[]) {
  return [
    { label: "Website Visitors", count: new Set(events.map((event) => event.session_id)).size },
    { label: "Product Views", count: countEvents(events, "product_view") },
    { label: "Product Detail Opens", count: countEvents(events, "product_details_open") },
    {
      label: "Customizer / Shop Intent",
      count: events.filter((event) =>
        event.event_name === "customizer_request" ||
        event.event_name === "shop_click" ||
        event.event_name === "contact_click"
      ).length,
    },
  ];
}

function getTrafficPoints(events: AnalyticsEventRow[], period: AnalyticsPeriod, start: Date | null, end: Date) {
  const pageViews = events.filter((event) => event.event_name === "page_view");
  const points = new Map<string, number>();

  if (period === "today") {
    const labels = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);
    labels.forEach((label) => points.set(label, 0));
    for (const event of pageViews) points.set(formatInManila(event.created_at, "hour"), (points.get(formatInManila(event.created_at, "hour")) ?? 0) + 1);
    return mapPoints(points);
  }

  if (period === "all") {
    for (const event of pageViews) {
      const label = formatInManila(event.created_at, "month");
      points.set(label, (points.get(label) ?? 0) + 1);
    }
    return mapPoints(points);
  }

  const cursor = new Date(start ?? end);
  while (cursor < end) {
    points.set(formatInManila(cursor.toISOString(), "day"), 0);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const event of pageViews) {
    const label = formatInManila(event.created_at, "day");
    points.set(label, (points.get(label) ?? 0) + 1);
  }
  return mapPoints(points);
}

function mapPoints(points: Map<string, number>): AnalyticsPoint[] {
  return [...points.entries()].map(([label, views]) => ({ label, views }));
}

function getAnalyticsRange(period: AnalyticsPeriod) {
  const now = new Date();
  if (period === "today") {
    const start = getManilaDayStart(now);
    const previousStart = new Date(start);
    previousStart.setUTCDate(previousStart.getUTCDate() - 1);
    return { start, previousStart, end: now, label: "Today" };
  }
  if (period === "30d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);
    const previousStart = new Date(start);
    previousStart.setUTCDate(previousStart.getUTCDate() - 30);
    return { start, previousStart, end: now, label: "Last 30 days" };
  }
  if (period === "all") {
    return { start: null, previousStart: null, end: now, label: "All time" };
  }

  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 7);
  const previousStart = new Date(start);
  previousStart.setUTCDate(previousStart.getUTCDate() - 7);
  return { start, previousStart, end: now, label: "Last 7 days" };
}

function getManilaDayStart(date: Date) {
  const manilaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return new Date(`${manilaDate}T00:00:00+08:00`);
}

function formatInManila(value: string, unit: "hour" | "day" | "month") {
  const date = new Date(value);
  if (unit === "hour") {
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      hour12: false,
    }).format(date) + ":00";
  }
  if (unit === "month") {
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      year: "numeric",
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).format(date);
}
