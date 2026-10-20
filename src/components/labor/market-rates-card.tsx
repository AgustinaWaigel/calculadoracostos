"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, InfoTooltip } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useAction } from "@/components/shared/use-action";
import { deleteMarketRate, saveMarketRate } from "@/actions/labor";
import { marketRateSchema, type MarketRateInput } from "@/lib/schemas";

export function MarketRatesCard({
  rates }: {
  rates: { id: string; label: string; hourlyRate: string; source: string | null }[];
}) {
  const form = useForm<MarketRateInput, unknown, z.output<typeof marketRateSchema>>({
    resolver: zodResolver(marketRateSchema),
    defaultValues: { label: "", hourlyRate: "", source: "" } });
  const { pending, run } = useAction<MarketRateInput>(form.setError);
  const errors = form.formState.errors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Valores hora de referencia
          <InfoTooltip>
            Cargá lo que cobran otros por hora (colegas, grupos de emprendedores, tarifarios de diseño) para ver si
            estás por debajo del mercado.
          </InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rates.length === 0 && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Ej: “Diseñadora freelance (grupo de Facebook)” · $9.000 por hora
          </p>
        )}
        <ul className="grid gap-1">
          {rates.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">{r.label}</p>
                {r.source && <p className="truncate text-xs text-muted-foreground">{r.source}</p>}
              </div>
              <Money value={r.hourlyRate} className="font-medium" />
              <ConfirmDelete title="¿Eliminar esta referencia?" onConfirm={() => deleteMarketRate(r.id)} />
            </li>
          ))}
        </ul>
        <form
          className="grid gap-2 border-t pt-3 sm:grid-cols-[1fr_120px_auto]"
          onSubmit={form.handleSubmit(() =>
            run(() => saveMarketRate(form.getValues()), () => form.reset()),
          )}
        >
          <div>
            <Input placeholder="Descripción" aria-label="Descripción" {...form.register("label")} />
            <FieldError message={errors.label?.message} />
          </div>
          <div>
            <Input placeholder="$ / hora" inputMode="decimal" aria-label="Valor hora" {...form.register("hourlyRate")} />
            <FieldError message={errors.hourlyRate?.message} />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            <PlusIcon /> Agregar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
