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
          <DollarSignIcon className="size-4" /> Dólar hoy
        </CardTitle>
        <CardDescription>
          {updated ? `Actualizado ${timeFmt.format(new Date(updated))} · dolarapi.com` : "Sin datos"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {types.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pudimos traer la cotización. Probá más tarde.</p>
        ) : (
          <dl className="grid grid-cols-3 gap-2">
            {types.map((t) => (
              <div key={t} className="rounded-lg bg-muted/50 p-2 text-center">
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
