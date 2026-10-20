import { D, Decimal, HUNDRED, ZERO, type DecimalInput } from "@/lib/money";

export interface SupplyPriceInput {
  packPrice: DecimalInput;
  packQuantity: DecimalInput;
}

/** Costo por unidad de uso: pack de 100 pouches a $28.949 → $289,49 c/u. */
export function supplyUnitCost({ packPrice, packQuantity }: SupplyPriceInput): Decimal {
  const qty = D(packQuantity);
  if (qty.lte(0)) throw new RangeError("La cantidad por paquete tiene que ser mayor a 0");
  return D(packPrice).div(qty);
}

/** Variación porcentual entre dos precios (ej: 1000 → 1250 = 25). */
export function priceChangePercent(before: DecimalInput, after: DecimalInput): Decimal {
  const b = D(before);
  if (b.isZero()) return ZERO;
  return D(after).minus(b).div(b).times(HUNDRED);
}

export const STALE_DAYS = 30;

/** ¿El precio no se actualiza hace más de `days` días? */
export function isPriceStale(updatedAt: Date, now: Date = new Date(), days = STALE_DAYS): boolean {
  return daysSince(updatedAt, now) > days;
}

export function daysSince(date: Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

export interface PricePoint {
  packPrice: DecimalInput;
  packQuantity: DecimalInput;
  usdRate?: DecimalInput | null;
  recordedAt: Date;
}

export interface PriceIncrease {
  /** Suba del costo unitario en pesos, en %. */
  arsPercent: Decimal;
  /** Suba en dólares (si hay cotización en ambos puntos), en %. */
  usdPercent: Decimal | null;
}

/**
 * Compara el primer y el último punto del historial dentro de una ventana.
 * Sirve para "insumos que más subieron" y para detectar subas reales en USD.
 */
export function priceIncrease(history: PricePoint[], since?: Date): PriceIncrease | null {
  const points = [...history]
    .filter((p) => !since || p.recordedAt >= since)
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const firstUnit = supplyUnitCost(first);
  const lastUnit = supplyUnitCost(last);
  const arsPercent = priceChangePercent(firstUnit, lastUnit);
  let usdPercent: Decimal | null = null;
  if (first.usdRate && last.usdRate && D(first.usdRate).gt(0) && D(last.usdRate).gt(0)) {
    usdPercent = priceChangePercent(firstUnit.div(D(first.usdRate)), lastUnit.div(D(last.usdRate)));
  }
  return { arsPercent, usdPercent };
}
