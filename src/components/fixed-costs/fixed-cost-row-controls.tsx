"use client";

import { useState } from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/components/shared/use-action";
import { toggleFixedCost, updateMonthlyUnits } from "@/actions/fixed-costs";

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

export function MonthlyUnitsInput({ value }: { value: number }) {
  const [units, setUnits] = useState(String(value));
  const { pending, run } = useAction();
  const dirty = units !== String(value);
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateMonthlyUnits(units));
      }}
    >
      <Input
        type="number"
        min={1}
        step={1}
        value={units}
        onChange={(e) => setUnits(e.target.value)}
        className="w-28"
        aria-label="Unidades por mes"
      />
      <span className="text-sm text-muted-foreground">unidades por mes</span>
      {dirty && (
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
          Guardar
        </Button>
      )}
    </form>
  );
}
