"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAction } from "@/components/shared/use-action";
import { saveVolumeTiers } from "@/actions/settings";
import { toInputString } from "@/lib/money";

interface TierForm {
  tiers: { minQuantity: string; discountPercent: string }[];
}

export function VolumeTiersForm({ tiers }: { tiers: { minQuantity: number; discountPercent: string }[] }) {
  const form = useForm<TierForm>({
    defaultValues: {
      tiers: tiers.map((t) => ({ minQuantity: String(t.minQuantity), discountPercent: toInputString(t.discountPercent) })) } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "tiers" });
  const { pending, run } = useAction();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Descuentos por volumen</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-2"
          onSubmit={form.handleSubmit((v) => run(() => saveVolumeTiers(v.tiers)))}
        >
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
            <span>Desde (unidades)</span>
            <span>Descuento (%)</span>
            <span className="w-7" />
          </div>
          {fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input type="number" min={1} aria-label="Desde" {...form.register(`tiers.${i}.minQuantity`)} />
              <Input inputMode="decimal" aria-label="Descuento" {...form.register(`tiers.${i}.discountPercent`)} />
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar tramo" onClick={() => remove(i)}>
                <Trash2Icon />
              </Button>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => append({ minQuantity: "", discountPercent: "" })}>
              <PlusIcon /> Agregar tramo
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              Guardar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
