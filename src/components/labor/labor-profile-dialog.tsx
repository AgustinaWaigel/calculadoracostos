"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { saveLaborProfile } from "@/actions/labor";
import { laborProfileSchema, type LaborProfileInput } from "@/lib/schemas";
import { toInputString } from "@/lib/money";
import type { z } from "zod";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#0ea5e9", "#a855f7"];

export function LaborProfileDialog({
  trigger,
  profile,
  suggestedRate,
}: {
  trigger: React.ReactNode;
  profile?: { id: string; name: string; hourlyRate: string; color: string | null };
  suggestedRate?: string;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<LaborProfileInput, unknown, z.output<typeof laborProfileSchema>>({
    resolver: zodResolver(laborProfileSchema),
    values: {
      id: profile?.id,
      name: profile?.name ?? "",
      hourlyRate: toInputString(profile?.hourlyRate ?? suggestedRate ?? ""),
      color: profile?.color ?? COLORS[0],
    },
  });
  const { pending, run } = useAction<LaborProfileInput>(form.setError);
  const color = form.watch("color");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{profile ? "Editar perfil" : "Nuevo perfil de trabajo"}</DialogTitle>
          <DialogDescription>Cada tipo de tarea puede tener su propio valor hora.</DialogDescription>
        </DialogHeader>
        <form
          id="labor-profile-form"
          className="grid gap-4"
          onSubmit={form.handleSubmit(() =>
            run(() => saveLaborProfile(form.getValues()), () => setOpen(false)),
          )}
        >
          <Field label="Nombre" htmlFor="lp-name" error={form.formState.errors.name?.message}>
            <Input id="lp-name" placeholder="Diseño, Producción, Armado…" {...form.register("name")} />
          </Field>
          <Field label="Valor de la hora" htmlFor="lp-rate" error={form.formState.errors.hourlyRate?.message}>
            <Input id="lp-rate" inputMode="decimal" placeholder="6.000" {...form.register("hourlyRate")} />
          </Field>
          <Field label="Color">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => form.setValue("color", c)}
                  className="size-7 rounded-full ring-offset-2 ring-offset-background data-[active=true]:ring-2 data-[active=true]:ring-foreground"
                  data-active={color === c}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="labor-profile-form" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
