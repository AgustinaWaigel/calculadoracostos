"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/ui-bits";
import { useAction } from "@/components/shared/use-action";
import { saveFixedCost } from "@/actions/fixed-costs";
import {
  FIXED_COST_LABELS,
  fixedCostCategories,
  fixedCostSchema,
  type FixedCostInput,
} from "@/lib/schemas";
import { toInputString } from "@/lib/money";

export interface FixedCostValues {
  id: string;
  name: string;
  category: (typeof fixedCostCategories)[number];
  monthlyAmount: string;
  active: boolean;
}

export function FixedCostDialog({ trigger, cost }: { trigger: React.ReactNode; cost?: FixedCostValues }) {
  const [open, setOpen] = useState(false);
  const form = useForm<FixedCostInput, unknown, z.output<typeof fixedCostSchema>>({
    resolver: zodResolver(fixedCostSchema),
    values: {
      id: cost?.id,
      name: cost?.name ?? "",
      category: cost?.category ?? "OTROS",
      monthlyAmount: toInputString(cost?.monthlyAmount ?? ""),
      active: cost?.active ?? true,
    },
  });
  const { pending, run } = useAction<FixedCostInput>(form.setError);
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cost ? "Editar costo fijo" : "Nuevo costo fijo"}</DialogTitle>
          <DialogDescription>Lo que pagás todos los meses, vendas o no.</DialogDescription>
        </DialogHeader>
        <form
          id="fixed-cost-form"
          className="grid gap-4"
          onSubmit={form.handleSubmit(() => run(() => saveFixedCost(form.getValues()), () => setOpen(false)))}
        >
          <Field label="Nombre" htmlFor="fc-name" error={errors.name?.message}>
            <Input id="fc-name" placeholder="Alquiler, luz, Canva…" {...form.register("name")} />
          </Field>
          <Field label="Categoría" error={errors.category?.message}>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fixedCostCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {FIXED_COST_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label="Monto mensual"
            htmlFor="fc-amount"
            error={errors.monthlyAmount?.message}
            hint="Si es anual, dividilo por 12."
          >
            <Input id="fc-amount" inputMode="decimal" placeholder="25.000" {...form.register("monthlyAmount")} />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="fixed-cost-form" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
