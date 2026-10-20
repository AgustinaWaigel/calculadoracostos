"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useMoneyFormatter } from "@/components/shared/money";
import { formatPercent } from "@/lib/money";

export interface PieSlice {
  key: string;
  label: string;
  /** Monto en ARS. */
  value: number;
}

const COLORS: Record<string, string> = {
  materials: "var(--chart-1)",
  labor: "var(--chart-2)",
  fixed: "var(--chart-3)",
};

export function CostBreakdownPie({ slices }: { slices: PieSlice[] }) {
  const fmt = useMoneyFormatter();
  const total = slices.reduce((a, s) => a + s.value, 0);
  const data = slices.filter((s) => s.value > 0);

  if (total <= 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Agregá insumos o mano de obra.</p>;
  }

  return (
    <div className="grid items-center gap-4">
      <div className="mx-auto size-40">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={76}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="var(--background)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.key} fill={COLORS[s.key] ?? "var(--chart-4)"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
              }}
              formatter={(v, name) => [fmt(Number(v)), String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid gap-2 text-sm">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: COLORS[s.key] }} />
            <span className="flex-1">{s.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatPercent((s.value / total) * 100, 0)}
            </span>
            <span className="w-24 text-right font-medium tabular-nums">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
