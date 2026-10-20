"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore } from "@/stores/currency";
import { useDolarRates } from "@/components/providers";
import { arsToUsd, formatMoney, type DecimalInput } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Hook: convierte y formatea según la moneda elegida en el header. */
export function useMoneyFormatter() {
  const { currency, dolarType } = useCurrencyStore();
  const rates = useDolarRates();
  // Evita diferencias de hidratación: el store persistido solo existe en el cliente.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const rate = rates[dolarType]?.sell;
  const showUsd = hydrated && currency === "USD" && !!rate;

  return (value: DecimalInput | null | undefined, decimals = 2) =>
    showUsd ? formatMoney(arsToUsd(value ?? 0, rate!), "USD", decimals) : formatMoney(value, "ARS", decimals);
}

export function Money({
  value,
  className,
  decimals = 2,
}: {
  /** string/number: un Decimal no puede cruzar de Server a Client Component (usá .toString()). */
  value: string | number | null | undefined;
  className?: string;
  decimals?: number;
}) {
  const format = useMoneyFormatter();
  return <span className={cn("tabular-nums whitespace-nowrap", className)}>{format(value, decimals)}</span>;
}
