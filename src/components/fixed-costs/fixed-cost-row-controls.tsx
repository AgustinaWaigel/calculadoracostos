"use client";

import { useState } from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/components/shared/use-action";
import { Money } from "@/components/shared/money";
import { toggleFixedCost, updateFixedAllocation } from "@/actions/fixed-costs";
import { fixedCostPerMinute, fixedCostPerUnit, type FixedAllocation } from "@/lib/calc/fixed-costs";
import { cn } from "@/lib/utils";

export function FixedCostToggle({ id, active, name }: { id: string; active: boolean; name: string }) {
  const { pending, run } = useAction();
  return (
    <Switch
      checked={active}
      disabled={pending}
      aria-label={`Incluir ${name} en el prorrateo`}
      onCheckedChange={(v) => run(() => toggleFixedCost(id, v))}
    />
  );
}

const METHODS = [
  { value: "SIZE", label: "Por tamaño", hint: "Cada producto dice cuántas unidades normales equivale" },
  { value: "TIME", label: "Por tiempo", hint: "Cada producto paga según sus minutos de trabajo" },
] as const;

/** Elegir cómo se reparten los fijos del mes y ver cuánto le toca a cada unidad u hora. */
export function FixedAllocationForm({
  total,
  method,
  units,
  hours,
}: {
  total: string;
  method: FixedAllocation;
  units: number;
  hours: number;
}) {
  const [values, setValues] = useState({ method, units: String(units), hours: String(hours) });
  const { pending, run } = useAction();
  const dirty = values.method !== method || values.units !== String(units) || values.hours !== String(hours);
  const isTime = values.method === "TIME";
  const amount = Number(isTime ? values.hours : values.units);
  const share = amount > 0 ? (isTime ? fixedCostPerMinute(total, amount).times(60) : fixedCostPerUnit(total, amount)) : null;

  return (
    <form
      className="grid gap-3 sm:col-span-2 sm:grid-cols-2 sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          updateFixedAllocation({
            fixedAllocation: values.method,
            monthlyUnitsEstimate: values.units,
            monthlyHoursEstimate: values.hours,
          }),
        );
      }}
    >
      <div className="grid gap-1.5 sm:col-span-2">
        <p className="text-xs text-muted-foreground">Cómo se reparten</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Cómo se reparten los fijos">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={values.method === m.value}
              onClick={() => setValues((v) => ({ ...v, method: m.value }))}
              className={cn(
                "rounded-md border px-3 py-2 text-left transition-colors duration-150",
                values.method === m.value ? "border-primary bg-primary/10" : "hover:bg-muted",
              )}
            >
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className="block text-xs text-muted-foreground">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-1.5">
        <p className="text-xs text-muted-foreground">
          {isTime ? "Horas que trabajás en un mes normal" : "Unidades normales que hacés en un mes"}
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            step={1}
            value={isTime ? values.hours : values.units}
            onChange={(e) => setValues((v) => (isTime ? { ...v, hours: e.target.value } : { ...v, units: e.target.value }))}
            className="w-28"
            aria-label={isTime ? "Horas por mes" : "Unidades por mes"}
          />
          <span className="text-sm text-muted-foreground">{isTime ? "horas por mes" : "unidades por mes"}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 rounded-lg bg-primary/5 p-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {isTime ? "Le toca a cada hora de trabajo" : "Le toca a cada unidad normal"}
          </p>
          <p className="text-2xl font-semibold text-primary">{share ? <Money value={share.toString()} /> : "—"}</p>
        </div>
        {dirty && (
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
            Guardar
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        {isTime
          ? "Un producto que lleva 30 minutos paga la mitad de una hora. Si un producto no tiene minutos cargados, no paga fijos."
          : "Un producto normal paga 1 vez esto; en cada producto podés decir si es más chico (×0,5) o más grande (×3)."}
      </p>
    </form>
  );
}
