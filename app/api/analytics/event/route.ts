import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  isAnalyticsEventName,
  normalizePagePath,
  normalizeReferrer,
  sanitizeMetadata,
} from "@/lib/analytics/shared";
import { createSupabaseSecretClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status === "admin") {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const eventName = payload.eventName;
  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId.trim() : "";
  const pagePath = normalizePagePath(payload.pagePath);
  const productId = typeof payload.productId === "string" && uuidPattern.test(payload.productId)
    ? payload.productId
    : null;
  const referrer = normalizeReferrer(payload.referrer);
  const metadata = sanitizeMetadata(payload.metadata);

  if (!isAnalyticsEventName(eventName) || !sessionId || sessionId.length > 128 || !pagePath) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const supabase = createSupabaseSecretClient();
  if (!supabase) {
    return NextResponse.json({ success: false }, { status: 503 });
  }

  const { error } = await supabase.from("analytics_events").insert({
    session_id: sessionId,
    event_name: eventName,
    page_path: pagePath,
    product_id: productId,
    metadata,
    referrer,
  });

  if (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
