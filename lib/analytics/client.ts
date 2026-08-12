"use client";

import type { AnalyticsEventName } from "@/types/database";
import { isAdminPath } from "@/lib/analytics/shared";

const visitorKey = "taptaptap-visitor-id";
const sentEvents = new Set<string>();

type TrackOptions = {
  productId?: string | null;
  metadata?: Record<string, string | number | boolean | undefined>;
  pagePath?: string;
  dedupeKey?: string;
};

export function getVisitorSessionId() {
  try {
    const existing = localStorage.getItem(visitorKey);
    if (existing) return existing;

    const next = crypto.randomUUID();
    localStorage.setItem(visitorKey, next);
    return next;
  } catch {
    return "";
  }
}

export function trackEvent(eventName: AnalyticsEventName, options: TrackOptions = {}) {
  if (typeof window === "undefined") return;

  const pagePath = options.pagePath ?? `${window.location.pathname}${window.location.search}`;
  if (isAdminPath(window.location.pathname) || isAdminPath(pagePath)) return;

  const sessionId = getVisitorSessionId();
  if (!sessionId) return;

  const dedupeKey = options.dedupeKey ?? `${eventName}:${pagePath}:${options.productId ?? ""}`;
  if (sentEvents.has(dedupeKey)) return;
  sentEvents.add(dedupeKey);

  const payload = {
    eventName,
    sessionId,
    pagePath,
    productId: options.productId,
    metadata: options.metadata,
    referrer: document.referrer || undefined,
  };

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/event", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
