import type { Prisma } from "@prisma/client";

/**
 * Tipo "plano" para pasar datos de Server → Client Components:
 * Decimal → string (sin perder precisión) y Date → string ISO.
 */
export type Plain<T> = T extends Prisma.Decimal
  ? string
  : T extends Date
    ? string
    : T extends (infer U)[]
      ? Plain<U>[]
      : T extends object
        ? { [K in keyof T]: Plain<T[K]> }
        : T;

function isDecimalLike(v: unknown): v is { toFixed: () => string; toString: () => string } {
  return (
    typeof v === "object" &&
    v !== null &&
    "toFixed" in v &&
    "d" in v &&
    "e" in v &&
    "s" in v
  );
}

export function plain<T>(value: T): Plain<T> {
  return convert(value) as Plain<T>;
}

function convert(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (isDecimalLike(value)) return value.toString();
  if (Array.isArray(value)) return value.map(convert);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = convert(v);
    return out;
  }
  return value;
}
