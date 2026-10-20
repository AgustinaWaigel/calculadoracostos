import "server-only";
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
