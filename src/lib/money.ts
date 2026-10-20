import Decimal from "decimal.js";

// Toda la plata pasa por Decimal: nunca operamos con floats sueltos.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };
export type DecimalInput = Decimal.Value | { toString(): string };

export type Currency = "ARS" | "USD";

/** Convierte cualquier valor numérico (incluido Prisma.Decimal) a Decimal. */
export function D(value: DecimalInput | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  if (Decimal.isDecimal(value)) return value as Decimal;
  if (typeof value === "number" || typeof value === "string") return new Decimal(value);
  return new Decimal(value.toString());
}

export const ZERO = new Decimal(0);
export const HUNDRED = new Decimal(100);

/** Redondea a centavos (2 decimales, mitad hacia arriba). */
export function roundCents(value: DecimalInput): Decimal {
  return D(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Pasa un porcentaje (21) a fracción (0.21). */
export function pct(value: DecimalInput): Decimal {
  return D(value).div(HUNDRED);
}

export function sum(values: DecimalInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(D(v)), ZERO);
}

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: Currency, decimals: number): Intl.NumberFormat {
  const key = `${currency}-${decimals}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(key, f);
  }
  return f;
}

/**
 * Formatea en es-AR: 1189.49 → "$ 1.189,49" (ARS) o "US$ 1,19" (USD).
 * Intl recibe un string, así no perdemos precisión con montos grandes.
 */
export function formatMoney(
  value: DecimalInput | null | undefined,
  currency: Currency = "ARS",
  decimals = 2,
): string {
  const rounded = D(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  // Intl.NumberFormat acepta strings numéricos ("string decimal") en runtimes modernos.
  return getFormatter(currency, decimals).format(rounded.toFixed(decimals) as unknown as number);
}

/** Convierte ARS → USD con la cotización dada (pesos por dólar). */
export function arsToUsd(ars: DecimalInput, rate: DecimalInput): Decimal {
  const r = D(rate);
  if (r.lte(0)) return ZERO;
  return D(ars).div(r);
}

export function formatNumber(value: DecimalInput, maxDecimals = 2): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: maxDecimals }).format(
    D(value).toDecimalPlaces(maxDecimals).toString() as unknown as number,
  );
}

export function formatPercent(value: DecimalInput, decimals = 1): string {
  return `${formatNumber(D(value).toDecimalPlaces(decimals), decimals)}%`;
}

/**
 * Interpreta lo que tipea un usuario argentino:
 * "28.949" → 28949, "289,49" → 289.49, "1.189,49" → 1189.49, "$ 600" → 600.
 * Si hay un solo punto y 1-2 decimales detrás ("12.5") se toma como decimal.
 */
export function parseMoneyInput(raw: string): Decimal | null {
  let s = raw.trim().replace(/\s|\$|US\$|ARS|USD/gi, "");
  if (!s) return null;
  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s)) return null;

  const hasComma = s.includes(",");
  const dots = (s.match(/\./g) ?? []).length;
  if (hasComma) {
    // Formato es-AR: los puntos son de miles, la coma es decimal.
    s = s.replace(/\./g, "").replace(",", ".");
    if ((s.match(/\./g) ?? []).length > 1) return null;
  } else if (dots === 1) {
    const [, dec] = s.split(".");
    // "28.949" → miles; "12.5" / "12.50" → decimal
    if (dec.length === 3) s = s.replace(".", "");
  } else if (dots > 1) {
    s = s.replace(/\./g, "");
  }
  try {
    const d = new Decimal(s);
    return negative ? d.neg() : d;
  } catch {
    return null;
  }
}

/**
 * Valor para precargar un input: usa coma decimal ("0,125") para que
 * parseMoneyInput lo interprete igual que si lo tipeara el usuario.
 */
export function toInputString(value: DecimalInput | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return D(value).toString().replace(".", ",");
}

/** Serializa un Decimal para cruzar la frontera servidor → cliente. */
export function toPlain(value: DecimalInput | null | undefined): string {
  return D(value).toString();
}
