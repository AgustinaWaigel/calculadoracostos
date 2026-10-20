import { NextResponse } from "next/server";
import { createAuthorizationUrl } from "@/lib/meli/oauth";
import { MeliError } from "@/lib/meli/errors";

/** Inicia el OAuth: redirige a Mercado Libre para autorizar la app. */
export async function GET(request: Request) {
  try {
    return NextResponse.redirect(await createAuthorizationUrl());
  } catch (e) {
    const code = e instanceof MeliError ? e.code : "UNKNOWN";
    return NextResponse.redirect(new URL(`/ajustes?meli=error&code=${code}`, request.url));
  }
}
