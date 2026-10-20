import { D, Decimal, HUNDRED, ZERO, type DecimalInput } from "@/lib/money";
import { average, median, quantile } from "./stats";

export interface MarketStats {
  /** Cantidad total de precios recibidos. */
  total: number;
  /** Precios usados para las estadísticas (sin atípicos). */
  used: number;
  /** Precios descartados por atípicos. */
  discarded: number;
  min: Decimal;
  max: Decimal;
  median: Decimal;
  average: Decimal;
  q1: Decimal;
  q3: Decimal;
  lowerFence: Decimal;
  upperFence: Decimal;
}

/**
 * Estadísticas de precios de mercado descartando valores atípicos por IQR:
 * se excluye todo lo que esté fuera de [Q1 − k·IQR, Q3 + k·IQR] (k = 1,5).
 * Con menos de 4 precios no se descarta nada (no hay muestra suficiente).
 */
export function marketStats(prices: DecimalInput[], k = 1.5): MarketStats | null {
  const all = prices.map((p) => D(p)).filter((p) => p.gt(0));
  if (all.length === 0) return null;

  const q1 = quantile(all, 0.25);
  const q3 = quantile(all, 0.75);
  const iqr = q3.minus(q1);
  const lowerFence = q1.minus(iqr.times(k));
  const upperFence = q3.plus(iqr.times(k));

  const kept = all.length < 4 ? all : all.filter((p) => p.gte(lowerFence) && p.lte(upperFence));
  const values = kept.length > 0 ? kept : all;

  return {
    total: all.length,
    used: values.length,
    discarded: all.length - values.length,
    min: Decimal.min(...values),
    max: Decimal.max(...values),
    median: median(values),
    average: average(values),
    q1,
    q3,
    lowerFence,
    upperFence,
  };
}

export type PricePosition = "above" | "below" | "equal";

export interface PriceComparison {
  position: PricePosition;
  /** % de diferencia contra la mediana. */
  diffPercent: Decimal;
}

/**
 * Compara tu precio con la mediana del mercado.
 * Dentro de ±`tolerancePercent` se considera "en línea".
 */
export function comparePriceToMarket(
  myPrice: DecimalInput,
  marketMedian: DecimalInput,
  tolerancePercent = 5,
): PriceComparison {
  const med = D(marketMedian);
  if (med.isZero()) return { position: "equal", diffPercent: ZERO };
  const diffPercent = D(myPrice).minus(med).div(med).times(HUNDRED);
  const position: PricePosition = diffPercent.abs().lte(tolerancePercent)
    ? "equal"
    : diffPercent.gt(0)
      ? "above"
      : "below";
  return { position, diffPercent };
}
