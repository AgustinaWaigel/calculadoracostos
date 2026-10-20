import { D, Decimal, pct, sum, type DecimalInput } from "@/lib/money";

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
