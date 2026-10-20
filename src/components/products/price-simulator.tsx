"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { breakdownForPrice } from "@/lib/calc/pricing";
import { D, ZERO, formatPercent, parseMoneyInput, pct } from "@/lib/money";
import type { EditorOptions } from "./types";

/** "¿Cuánto me queda si lo vendo a $X?" */
export function PriceSimulator({
  unitCost,
  channels,
  settings,
}: {
  unitCost: string;
  channels: EditorOptions["channels"];
  settings: EditorOptions["settings"];
}) {
  const [price, setPrice] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const channel = channels.find((c) => c.id === channelId);
  const p = parseMoneyInput(price);

  const result =
    p && p.gt(0) && channel
      ? breakdownForPrice({
          price: p,
          cost: unitCost,
          vatRate:
            settings.taxCondition === "RESPONSABLE_INSCRIPTO" && channel.applyIva ? pct(settings.ivaPercent) : ZERO,
          channel,
        })
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Cuánto me queda si lo vendo a…?</CardTitle>
        <CardDescription>Probá un precio y mirá la ganancia neta real.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Precio de venta" htmlFor="sim-price">
            <Input id="sim-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2.500" />
          </Field>
          <Field label="Canal">
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {result && (
          <dl className="grid gap-1 text-sm">
            {[
              ["IVA", result.vat],
              ["Comisión", result.commission],
              ["Pasarela de pago", result.paymentFee],
              ["Cuotas", result.installments],
              ["Cargo fijo", result.fixedFee],
              ["Envío", result.shipping],
              ["Costo del producto", result.unitCost],
            ]
              .filter(([, v]) => !D(v as string).isZero())
              .map(([label, v]) => (
                <div key={label as string} className="flex justify-between text-muted-foreground">
                  <dt>{label as string}</dt>
                  <dd>
                    − <Money value={(v as { toString(): string }).toString()} />
                  </dd>
                </div>
              ))}
            <div className="mt-1 flex justify-between border-t pt-2 font-semibold">
              <dt>Te queda</dt>
              <dd className={result.isLoss ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>
                <Money value={result.netProfit.toString()} /> ({formatPercent(result.netMarginPercent, 0)})
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
