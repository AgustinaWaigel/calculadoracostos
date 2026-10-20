import { NextResponse } from "next/server";
import { getDolarRates } from "@/lib/dolar";

/** Cotizaciones oficial / blue / MEP (dolarapi.com, cache 15 min). */
export async function GET() {
  const rates = await getDolarRates();
  if (Object.keys(rates).length === 0) {
    return NextResponse.json({ error: "No pudimos obtener la cotización del dólar" }, { status: 502 });
  }
  return NextResponse.json(rates);
}
