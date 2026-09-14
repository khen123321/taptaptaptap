import { NextResponse } from "next/server";
import { getPublicBusinessLogos } from "@/lib/business-logos";

export async function GET() {
  const logos = await getPublicBusinessLogos();

  return NextResponse.json(
    { logos },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
