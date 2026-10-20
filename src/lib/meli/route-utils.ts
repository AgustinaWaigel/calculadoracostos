import "server-only";
import { NextResponse } from "next/server";
import { MeliError } from "./errors";

/** Respuesta JSON de error uniforme para las Route Handlers de ML. */
export function meliErrorResponse(e: unknown) {
  const err = e instanceof MeliError ? e : new MeliError("UNKNOWN");
  if (!(e instanceof MeliError)) console.error("[meli]", e);
  return NextResponse.json(err.toBody(), { status: err.httpStatus });
}
