import "server-only";
import type { Prisma } from "@prisma/client";
import { getAllProductsWithPricing } from "./costing";
import { roundCents } from "@/lib/money";
import type { QuoteProductOption } from "@/components/quotes/types";

export async function getQuoteOptions() {
  const { ctx, items } = await getAllProductsWithPricing();
  const products: QuoteProductOption[] = items
    .filter((i) => i.pricing?.reference)
    .map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: roundCents(i.pricing!.reference!.price).toString(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return {
    products,
    tiers: ctx.tiers.map((t) => ({ minQuantity: t.minQuantity, discountPercent: t.discountPercent.toString() })),
    business: ctx.business,
  };
}

/** Los descuentos por cantidad guardados en un presupuesto, listos para el editor. */
export function quoteTiersFromJson(json: Prisma.JsonValue): { minQuantity: string; discountPercent: string }[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((t) =>
    t && typeof t === "object" && !Array.isArray(t) && t.minQuantity != null && t.discountPercent != null
      ? [{ minQuantity: String(t.minQuantity), discountPercent: String(t.discountPercent) }]
      : [],
  );
}
