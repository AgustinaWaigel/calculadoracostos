"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoneyFormatter } from "@/components/shared/money";

/** Barras horizontales: ganancia neta por unidad de los productos más rentables. */
export function ProfitChart({ data }: { data: { name: string; profit: number; margin: number }[] }) {
  const fmt = useMoneyFormatter();
  return (
    <div style={{ height: Math.max(120, data.length * 44) }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
            tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
            }}
            formatter={(v, _n, item) => [
              `${fmt(Number(v))} (${(item.payload as { margin: number }).margin.toFixed(0)}% margen)`,
              "Ganancia por unidad",
            ]}
          />
          <Bar dataKey="profit" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
