import { NextResponse, type NextRequest } from "next/server";
import { searchListings } from "@/lib/meli/api";
import { meliErrorResponse } from "@/lib/meli/route-utils";

/** GET /api/meli/search?q=pouch+a4 → publicaciones + estadísticas de mercado (cache 30 min). */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  try {
    return NextResponse.json(await searchListings(q));
  } catch (e) {
    return meliErrorResponse(e);
  }
}
