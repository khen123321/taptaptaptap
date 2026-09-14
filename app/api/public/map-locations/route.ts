import { NextResponse } from "next/server";
import { getPublicMapMarkers } from "@/lib/map-locations";

export async function GET() {
  const markers = await getPublicMapMarkers();

  return NextResponse.json(
    { markers },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
