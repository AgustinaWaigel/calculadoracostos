import { NextResponse, type NextRequest } from "next/server";
import { getListing } from "@/lib/meli/api";
import { meliErrorResponse } from "@/lib/meli/route-utils";

/** GET /api/meli/item?url=https://articulo.mercadolibre.com.ar/MLA-... (o ?id=MLA123) */
export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("url") ?? request.nextUrl.searchParams.get("id") ?? "";
  try {
    return NextResponse.json(await getListing(input));
  } catch (e) {
    return meliErrorResponse(e);
  }
}
