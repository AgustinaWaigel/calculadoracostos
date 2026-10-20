import { NextResponse, type NextRequest } from "next/server";
import { handleCallback } from "@/lib/meli/oauth";
import { MeliError } from "@/lib/meli/errors";

/** Mercado Libre vuelve acá con ?code=...&state=... */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const back = (qs: string) => NextResponse.redirect(new URL(`/ajustes?${qs}`, request.url));

  if (!code || !state) return back("meli=error&code=UNAUTHORIZED");
  try {
    await handleCallback(code, state);
    return back("meli=ok");
  } catch (e) {
    console.error("[meli] callback", e);
    return back(`meli=error&code=${e instanceof MeliError ? e.code : "UNKNOWN"}`);
  }
}
