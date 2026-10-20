import { D, Decimal, ZERO, type DecimalInput } from "@/lib/money";

function sorted(values: DecimalInput[]): Decimal[] {
  return values.map((v) => D(v)).sort((a, b) => a.comparedTo(b));
}

/** Cuantil con interpolación lineal (mismo criterio que Excel PERCENTIL.INC). */
export function quantile(values: DecimalInput[], q: number): Decimal {
  const s = sorted(values);
  if (s.length === 0) return ZERO;
  const pos = new Decimal(s.length - 1).times(q);
  const lower = pos.floor().toNumber();
  const upper = pos.ceil().toNumber();
  if (lower === upper) return s[lower];
  const weight = pos.minus(lower);
  return s[lower].plus(s[upper].minus(s[lower]).times(weight));
}

export function median(values: DecimalInput[]): Decimal {
  return quantile(values, 0.5);
}

export function average(values: DecimalInput[]): Decimal {
  if (values.length === 0) return ZERO;
  return values.reduce<Decimal>((acc, v) => acc.plus(D(v)), ZERO).div(values.length);
}
