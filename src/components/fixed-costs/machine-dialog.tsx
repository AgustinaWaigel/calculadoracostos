"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Money } from "@/components/shared/money";
import { useAction } from "@/components/shared/use-action";
import { saveMachine } from "@/actions/fixed-costs";
import { machineSchema, type MachineInput } from "@/lib/schemas";
import { parseMoneyInput, toInputString } from "@/lib/money";

export interface MachineValues {
  id: string;
  name: string;
  price: string;
  usefulLife: string;
  lifeUnit: "UNITS" | "HOURS";
}

export function MachineDialog({ trigger, machine }: { trigger: React.ReactNode; machine?: MachineValues }) {
  const [open, setOpen] = useState(false);
  const form = useForm<MachineInput, unknown, z.output<typeof machineSchema>>({
    resolver: zodResolver(machineSchema),
    values: {
      id: machine?.id,
      name: machine?.name ?? "",
      price: toInputString(machine?.price ?? ""),
      usefulLife: toInputString(machine?.usefulLife ?? ""),
      lifeUnit: machine?.lifeUnit ?? "UNITS",
    },
  });
  const { pending, run } = useAction<MachineInput>(form.setError);
  const errors = form.formState.errors;
  const [price, life, unit] = useWatch({ control: form.control, name: ["price", "usefulLife", "lifeUnit"] });
  const p = parseMoneyInput(String(price ?? ""));
  const l = parseMoneyInput(String(life ?? ""));
  const rate = p && l && l.gt(0) ? p.div(l) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{machine ? "Editar máquina" : "Nueva máquina"}</DialogTitle>
          <DialogDescription>
            Se amortiza en cada producto según cuánto la usa: precio ÷ vida útil.
          </DialogDescription>
        </DialogHeader>
        <form
          id="machine-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(() => run(() => saveMachine(form.getValues()), () => setOpen(false)))}
        >
          <Field label="Nombre" htmlFor="m-name" error={errors.name?.message} className="sm:col-span-2">
            <Input id="m-name" placeholder="Plastificadora A4, plancha sublimadora…" {...form.register("name")} />
          </Field>
          <Field label="Precio de la máquina" htmlFor="m-price" error={errors.price?.message}>
            <Input id="m-price" inputMode="decimal" placeholder="120.000" {...form.register("price")} />
          </Field>
          <Field label="Vida útil medida en" error={errors.lifeUnit?.message}>
            <Controller
              control={form.control}
              name="lifeUnit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNITS">Unidades producidas</SelectItem>
                    <SelectItem value="HOURS">Horas de uso</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label={unit === "HOURS" ? "Vida útil (horas)" : "Vida útil (unidades)"}
            htmlFor="m-life"
            error={errors.usefulLife?.message}
            hint={unit === "HOURS" ? "Ej: 2.000 horas" : "Ej: 20.000 plastificados"}
            className="sm:col-span-2"
          >
            <Input id="m-life" inputMode="decimal" {...form.register("usefulLife")} />
          </Field>
        </form>
        {rate && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            Amortización: <Money value={rate.toString()} className="font-semibold" /> por{" "}
            {unit === "HOURS" ? "hora de uso" : "unidad producida"}
          </p>
        )}
        <DialogFooter>
          <Button type="submit" form="machine-form" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
