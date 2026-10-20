"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { Combobox } from "@/components/shared/combobox";
import { useAction } from "@/components/shared/use-action";
import { saveQuote } from "@/actions/quotes";
import { quoteSchema, type QuoteData, type QuoteInput } from "@/lib/schemas";
import { quoteTotals } from "@/lib/calc/quote";
import { discountForQuantity } from "@/lib/calc/pricing";
import { D, formatMoney, parseMoneyInput, pct, roundCents, toInputString } from "@/lib/money";
import type { QuoteFormValues, QuoteProductOption } from "./types";

const CUSTOM = "__custom__";

export function QuoteEditor({
  products,
  tiers,
  defaults,
}: {
  products: QuoteProductOption[];
  tiers: { minQuantity: number; discountPercent: string }[];
  defaults: QuoteFormValues;
}) {
  const router = useRouter();
  const form = useForm<QuoteInput, unknown, QuoteData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      ...defaults,
      clientPhone: defaults.clientPhone ?? "",
      clientEmail: defaults.clientEmail ?? "",
      notes: defaults.notes ?? "",
      discountPercent: toInputString(defaults.discountPercent),
      items: defaults.items.map((i) => ({
        ...i,
        quantity: toInputString(i.quantity),
        unitPrice: toInputString(i.unitPrice),
      })),
    },
  });
  const { control, register, formState, getValues, setValue, setError } = form;
  const errors = formState.errors;
  const items = useFieldArray({ control, name: "items" });
  const { pending, run } = useAction<QuoteInput>(setError);
  const productById = new Map(products.map((p) => [p.id, p]));

  const watched = useWatch({ control });
  const parsedItems = (watched.items ?? []).map((i) => ({
    quantity: parseMoneyInput(String(i?.quantity ?? "")) ?? D(0),
    unitPrice: parseMoneyInput(String(i?.unitPrice ?? "")) ?? D(0),
  }));
  const totals = quoteTotals(parsedItems, parseMoneyInput(String(watched.discountPercent ?? "")) ?? 0);

  /** Precio sugerido para esa cantidad (aplica el tramo de volumen). */
  function suggestedPrice(productId: string, quantity: string) {
    const p = productById.get(productId);
    if (!p) return null;
    const q = parseMoneyInput(quantity)?.toNumber() ?? 1;
    const disc = discountForQuantity(q, tiers);
    return roundCents(D(p.price).times(D(1).minus(pct(disc)))).toString();
  }

  function onProductChange(index: number, productId: string) {
    if (productId === CUSTOM) {
      setValue(`items.${index}.productId`, null);
      return;
    }
    const p = productById.get(productId);
    if (!p) return;
    setValue(`items.${index}.productId`, productId);
    setValue(`items.${index}.description`, p.name, { shouldValidate: true });
    const price = suggestedPrice(productId, String(getValues(`items.${index}.quantity`)));
    if (price) setValue(`items.${index}.unitPrice`, toInputString(price), { shouldValidate: true });
  }

  function onQuantityBlur(index: number) {
    const productId = getValues(`items.${index}.productId`);
    if (!productId) return;
    const price = suggestedPrice(productId, String(getValues(`items.${index}.quantity`)));
    if (price) setValue(`items.${index}.unitPrice`, toInputString(price));
  }

  const onSubmit = form.handleSubmit(() =>
    run(
      () => saveQuote(getValues()),
      (data) => {
        if (!defaults.id) router.push(`/presupuestos/${data.id}`);
        else router.refresh();
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="q-client" error={errors.clientName?.message} className="sm:col-span-2">
              <Input id="q-client" placeholder="Ej: Lucía Pérez" {...register("clientName")} />
            </Field>
            <Field label="WhatsApp" htmlFor="q-phone" error={errors.clientPhone?.message} hint="Para mandarle el presupuesto">
              <Input id="q-phone" type="tel" placeholder="11 1234-5678" {...register("clientPhone")} />
            </Field>
            <Field label="Email" htmlFor="q-email" error={errors.clientEmail?.message}>
              <Input id="q-email" type="email" {...register("clientEmail")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ítems</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {items.fields.map((f, i) => {
              const productId = watched.items?.[i]?.productId;
              return (
                <div key={f.id} className="grid gap-2 rounded-lg border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Combobox
                      ariaLabel="Producto"
                      value={productId ?? CUSTOM}
                      onChange={(v) => onProductChange(i, v)}
                      options={[
                        { value: CUSTOM, label: "Ítem libre (sin producto)" },
                        ...products.map((p) => ({ value: p.id, label: p.name, hint: formatMoney(p.price, "ARS", 0) })),
                      ]}
                      searchPlaceholder="Buscar producto…"
                    />
                    <div>
                      <Input placeholder="Descripción" aria-label="Descripción" {...register(`items.${i}.description`)} />
                      <FieldError message={errors.items?.[i]?.description?.message} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_auto] items-start gap-2 sm:grid-cols-[120px_160px_1fr_auto]">
                    <div>
                      <Controller
                        control={control}
                        name={`items.${i}.quantity`}
                        render={({ field }) => (
                          <Input
                            inputMode="decimal"
                            aria-label="Cantidad"
                            placeholder="Cant."
                            value={String(field.value ?? "")}
                            onChange={field.onChange}
                            onBlur={() => {
                              field.onBlur();
                              onQuantityBlur(i);
                            }}
                          />
                        )}
                      />
                      <FieldError message={errors.items?.[i]?.quantity?.message} />
                    </div>
                    <div>
                      <Input inputMode="decimal" aria-label="Precio unitario" placeholder="Precio c/u" {...register(`items.${i}.unitPrice`)} />
                      <FieldError message={errors.items?.[i]?.unitPrice?.message} />
                    </div>
                    <div className="hidden self-center text-right font-medium sm:block">
                      <Money value={totals.lines[i]?.toString() ?? 0} />
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar ítem" onClick={() => items.remove(i)}>
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              );
            })}
            <FieldError message={errors.items?.message ?? errors.items?.root?.message} />
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => items.append({ productId: null, description: "", quantity: "1", unitPrice: "" })}
              >
                <PlusIcon /> Agregar ítem
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={3} placeholder="Ej: seña del 50%, entrega en 5 días hábiles." {...register("notes")} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Válido hasta" htmlFor="q-valid" error={errors.validUntil?.message}>
              <Input id="q-valid" type="date" {...register("validUntil")} />
            </Field>
            <Field label="Descuento general (%)" htmlFor="q-disc" error={errors.discountPercent?.message}>
              <Input id="q-disc" inputMode="decimal" {...register("discountPercent")} />
            </Field>
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>
                  <Money value={totals.subtotal.toString()} />
                </dd>
              </div>
              {totals.discount.gt(0) && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Descuento</dt>
                  <dd>
                    − <Money value={totals.discount.toString()} />
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                <dt>Total</dt>
                <dd>
                  <Money value={totals.total.toString()} />
                </dd>
              </div>
            </dl>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              {defaults.id ? "Guardar cambios" : "Crear presupuesto"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
