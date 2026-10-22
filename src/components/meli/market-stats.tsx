"use client";

import { TrendingDownIcon, TrendingUpIcon, MinusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/shared/ui-bits";
import { useMoneyFormatter } from "@/components/shared/money";
import { comparePriceToMarket } from "@/lib/calc/market-stats";
import { D, formatPercent } from "@/lib/money";
import type { MeliMarketStats } from "@/lib/meli/types";

export function MarketStats({
  stats,
  myPrice,
  myPriceLabel = "Tu precio",
}: {
  stats: MeliMarketStats;
  /** Precio propio a comparar contra la mediana (mismo "paquete" que las publicaciones). */
  myPrice?: string | null;
  myPriceLabel?: string;
}) {
  const fmt = useMoneyFormatter();
  const cmp = myPrice && D(myPrice).gt(0) ? comparePriceToMarket(myPrice, stats.median) : null;

  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
      <div className="mb-2 flex items-center gap-1.5 font-medium">
        Precios parecidos en Mercado Libre
        <InfoTooltip>
          Calculado sobre {stats.used} publicaciones. Descartamos {stats.discarded} con precios atípicos (muy por
          encima o por debajo del resto, método IQR) para que no distorsionen el promedio.
        </InfoTooltip>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["Mínimo", stats.min],
            ["Mediana", stats.median],
            ["Promedio", stats.average],
            ["Máximo", stats.max],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">{fmt(value)}</dd>
          </div>
        ))}
      </dl>
      {cmp && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {myPriceLabel}: <span className="font-medium text-foreground">{fmt(myPrice)}</span>
          </span>
          {cmp.position === "above" && (
            <Badge variant="outline" className="border-kraft/70 text-[#8a4f12] dark:text-[#f0c27a]">
              <TrendingUpIcon /> {formatPercent(cmp.diffPercent)} sobre la mediana
            </Badge>
          )}
          {cmp.position === "below" && (
            <Badge variant="outline" className="border-menta text-tinta dark:text-menta">
              <TrendingDownIcon /> {formatPercent(cmp.diffPercent.abs())} debajo de la mediana
            </Badge>
          )}
          {cmp.position === "equal" && (
            <Badge variant="outline">
              <MinusIcon /> En línea con el mercado
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
