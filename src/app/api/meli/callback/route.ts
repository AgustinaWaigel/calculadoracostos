import { NextResponse, type NextRequest } from "next/server";
import { handleCallback } from "@/lib/meli/oauth";
import { MeliError } from "@/lib/meli/errors";

/** Mercado Libre vuelve acá con ?code=...&state=... (o con ?error=...&error_description=... si algo falló). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const back = (qs: Record<string, string>) =>
    NextResponse.redirect(new URL(`/ajustes?${new URLSearchParams(qs)}`, request.url));

  // ML informa el motivo del rechazo: lo mostramos tal cual para poder corregirlo.
  const mlError = params.get("error");
  if (mlError) {
    const detail = params.get("error_description") ?? mlError;
    console.error("[meli] autorización rechazada:", mlError, detail);
    return back({ meli: "error", code: "UNAUTHORIZED", detail: `Mercado Libre respondió: ${detail}` });
  }
  if (!code || !state) {
    return back({ meli: "error", code: "UNAUTHORIZED", detail: "Mercado Libre no devolvió el código de autorización." });
  }

  try {
    await handleCallback(code, state);
    return back({ meli: "ok" });
  } catch (e) {
    console.error("[meli] callback", e);
    return back({
      meli: "error",
      code: e instanceof MeliError ? e.code : "UNKNOWN",
      detail: e instanceof Error ? e.message : "Error inesperado",
    });
  }
}
