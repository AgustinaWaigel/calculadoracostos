"use client";

import { DollarSignIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDolarRates } from "@/components/providers";
import { DOLAR_LABELS, type DolarType } from "@/lib/dolar";
import { formatMoney } from "@/lib/money";

const timeFmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

export function DolarCard() {
  const rates = useDolarRates();
  const types = (Object.keys(DOLAR_LABELS) as DolarType[]).filter((t) => rates[t]);
  const updated = types.map((t) => rates[t]!.updatedAt).sort().at(-1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-halo text-[#0b3b29]">
            <DollarSignIcon className="size-4" />
          </span>
          Dólar hoy
        </CardTitle>
        {updated && <CardDescription>{timeFmt.format(new Date(updated))}</CardDescription>}
      </CardHeader>
      <CardContent>
        {types.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin conexión con dolarapi.com.</p>
        ) : (
          <dl className="grid grid-cols-3 gap-2">
            {types.map((t) => (
              <div key={t} className="rounded-lg bg-halo/20 p-2 text-center dark:bg-halo/10">
                <dt className="text-xs text-muted-foreground">{DOLAR_LABELS[t]}</dt>
                <dd className="font-semibold tabular-nums">{formatMoney(rates[t]!.sell, "ARS", 0)}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
