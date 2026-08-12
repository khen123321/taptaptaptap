"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { isAdminPath, isAnalyticsEventName } from "@/lib/analytics/shared";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef("");

  useEffect(() => {
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    if (!pagePath || isAdminPath(pathname) || previousPath.current === pagePath) return;

    previousPath.current = pagePath;
    trackEvent("page_view", {
      pagePath,
      dedupeKey: `page_view:${pagePath}`,
    });

    if (pathname === "/customize") {
      trackEvent("customizer_open", {
        pagePath,
        dedupeKey: `customizer_open:${pagePath}`,
      });
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const trackClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-analytics-event]")
        : null;
      const eventName = target?.dataset.analyticsEvent;
      if (!target || !isAnalyticsEventName(eventName)) return;

      trackEvent(eventName, {
        metadata: {
          cta: target.dataset.analyticsCta,
          source: target.dataset.analyticsSource,
        },
        dedupeKey: `${eventName}:${target.dataset.analyticsCta ?? ""}:${Date.now()}`,
      });
    };

    document.addEventListener("click", trackClick);
    return () => document.removeEventListener("click", trackClick);
  }, []);

  return null;
}
