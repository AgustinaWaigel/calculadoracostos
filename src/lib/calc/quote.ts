import { D, Decimal, ZERO, pct, roundCents, sum, type DecimalInput } from "@/lib/money";
import { discountForQuantity, type VolumeTierInput } from "./pricing";

export interface QuoteLine {
  quantity: DecimalInput;
  unitPrice: DecimalInput;
}

export interface QuoteTotals {
  lines: Decimal[];
  subtotal: Decimal;
  discount: Decimal;
  total: Decimal;
}

export function quoteTotals(items: QuoteLine[], discountPercent: DecimalInput = 0): QuoteTotals {
  const lines = items.map((i) => D(i.quantity).times(D(i.unitPrice)));
  const subtotal = sum(lines);
  const discount = subtotal.times(pct(discountPercent));
  return { lines, subtotal, discount, total: subtotal.minus(discount) };
}

export interface VolumePrice {
  listPrice: Decimal;
  /** Descuento por cantidad que corresponde (0 si no llega a ningún tramo). */
  discountPercent: Decimal;
  /** Precio por unidad con ese descuento, redondeado a centavos. */
  unitPrice: Decimal;
  /** Desde cuántas unidades rige el tramo aplicado. */
  tierMin: number | null;
  /** El próximo tramo, para avisar "llevando X tiene Y% off". */
  next: { minQuantity: number; discountPercent: Decimal } | null;
}

/** Precio de un producto para una cantidad, según los descuentos por volumen de Ajustes. */
export function volumePrice(listPrice: DecimalInput, quantity: number, tiers: VolumeTierInput[]): VolumePrice {
  const list = D(listPrice);
  const discountPercent = discountForQuantity(quantity, tiers);
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  const current = [...sorted].reverse().find((t) => quantity >= t.minQuantity && D(t.discountPercent).gt(0));
  const next = sorted.find((t) => t.minQuantity > quantity && D(t.discountPercent).gt(discountPercent));
  return {
    listPrice: list,
    discountPercent,
    unitPrice: roundCents(list.times(D(1).minus(pct(discountPercent)))),
    tierMin: current?.minQuantity ?? null,
    next: next ? { minQuantity: next.minQuantity, discountPercent: D(next.discountPercent) } : null,
  };
}

export interface QuoteBreakdown extends QuoteTotals {
  /** Lo que sumaría todo a precio de lista. */
  atList: Decimal;
  /** Cuánto bajó por los descuentos por cantidad de cada ítem. */
  volumeDiscount: Decimal;
}

/**
 * Totales con el desglose completo: precio de lista → descuento por cantidad (ya incluido en el
 * precio de cada ítem) → subtotal → descuento extra sobre el total → total.
 * `listPrice` va solo en los ítems que tienen el descuento por cantidad aplicado.
 */
export function quoteBreakdown(
  items: (QuoteLine & { listPrice?: DecimalInput | null })[],
  extraDiscountPercent: DecimalInput = 0,
): QuoteBreakdown {
  const totals = quoteTotals(items, extraDiscountPercent);
  const volumeDiscount = sum(
    items.map((i) => {
      if (i.listPrice == null) return ZERO;
      const saved = D(i.listPrice).minus(D(i.unitPrice)).times(D(i.quantity));
      return saved.gt(0) ? saved : ZERO;
    }),
  );
  return { ...totals, atList: totals.subtotal.plus(volumeDiscount), volumeDiscount };
}
