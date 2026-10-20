"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export interface HistoryPoint {
  date: string;
  /** Costo unitario en ARS. */
  unitCost: number;
  /** Costo unitario en USD (si se guardó la cotización ese día). */
  unitCostUsd: number | null;
}

const dateFmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });
const fullDateFmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

export function PriceHistoryChart({ points }: { points: HistoryPoint[] }) {
  const hasUsd = points.filter((p) => p.unitCostUsd !== null).length >= 2;
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const key = currency === "USD" ? "unitCostUsd" : "unitCost";
  const data = points
    .filter((p) => currency === "ARS" || p.unitCostUsd !== null)
    .map((p) => ({ ...p, ts: new Date(p.date).getTime() }));

  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cuando actualices el precio vas a ver acá cómo evoluciona.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {hasUsd && (
        <div className="flex justify-end gap-1">
          {(["ARS", "USD"] as const).map((c) => (
            <Button
              key={c}
              type="button"
              size="xs"
              variant={currency === c ? "secondary" : "ghost"}
              onClick={() => setCurrency(c)}
            >
              {c === "ARS" ? "En pesos" : "En dólares (MEP)"}
            </Button>
          ))}
        </div>
      )}
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => dateFmt.format(new Date(v))}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
            />
            <YAxis
              width={72}
              tickFormatter={(v: number) => formatMoney(v, currency, currency === "USD" ? 2 : 0)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
              }}
              labelFormatter={(v) => fullDateFmt.format(new Date(Number(v)))}
              formatter={(v) => [formatMoney(Number(v), currency), "Costo por unidad"]}
            />
            <Line
              type="monotone"
              dataKey={key}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--chart-1)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
