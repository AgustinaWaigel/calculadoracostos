"use client";

import { useEffect, useState } from "react";
import { DollarSignIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDolarRates } from "@/components/providers";
import { useCurrencyStore } from "@/stores/currency";
import { DOLAR_LABELS, type DolarType } from "@/lib/dolar";
import { formatMoney } from "@/lib/money";

export function CurrencySwitcher() {
  const { currency, dolarType, setCurrency, setDolarType } = useCurrencyStore();
  const rates = useDolarRates();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const hasRates = Object.keys(rates).length > 0;
  const current = hydrated ? currency : "ARS";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Moneda">
          <DollarSignIcon />
          {current === "USD" ? `USD ${DOLAR_LABELS[dolarType]}` : "ARS"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Ver montos en</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current} onValueChange={(v) => setCurrency(v as "ARS" | "USD")}>
          <DropdownMenuRadioItem value="ARS">Pesos (ARS)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="USD" disabled={!hasRates}>
            Dólares (USD)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Cotización</DropdownMenuLabel>
        {hasRates ? (
          <DropdownMenuRadioGroup value={dolarType} onValueChange={(v) => setDolarType(v as DolarType)}>
            {(Object.keys(DOLAR_LABELS) as DolarType[]).map((t) =>
              rates[t] ? (
                <DropdownMenuRadioItem key={t} value={t} className="justify-between">
                  <span>{DOLAR_LABELS[t]}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {formatMoney(rates[t]!.sell, "ARS", 0)}
                  </span>
                </DropdownMenuRadioItem>
              ) : null,
            )}
          </DropdownMenuRadioGroup>
        ) : (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            No pudimos traer la cotización. Probá de nuevo en un rato.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
