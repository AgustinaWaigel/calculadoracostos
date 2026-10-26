"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon, SaveIcon, TagIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, InfoTooltip } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { Combobox } from "@/components/shared/combobox";
import { useAction } from "@/components/shared/use-action";
import { saveQuote } from "@/actions/quotes";
import { quoteSchema, type QuoteData, type QuoteInput } from "@/lib/schemas";
import { quoteBreakdown, volumePrice, type VolumePrice } from "@/lib/calc/quote";
import { D, formatMoney, formatPercent, parseMoneyInput, toInputString } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { QuoteFormValues, QuoteProductOption } from "./types";

const CUSTOM = "__custom__";
const EXTRA_CHIPS = [0, 5, 10, 15];

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
  const activeTiers = tiers.filter((t) => D(t.discountPercent).gt(0)).sort((a, b) => a.minQuantity - b.minQuantity);

  const qtyOf = (v: unknown) => parseMoneyInput(String(v ?? ""))?.toNumber() ?? 0;
  /** Precio sugerido de un producto para esa cantidad (con el descuento por cantidad que toque). */
  const suggest = (productId: string | null | undefined, quantity: unknown): VolumePrice | null => {
    const p = productId ? productById.get(productId) : undefined;
    return p ? volumePrice(p.price, Math.max(qtyOf(quantity), 1), tiers) : null;
  };

  // Ítems con el precio escrito a mano: no se lo pisamos al cambiar la cantidad.
  const [manual, setManual] = useState<Set<string>>(() => {
    const set = new Set<string>();
    defaults.items.forEach((item, i) => {
      const s = suggest(item.productId, item.quantity);
      const id = items.fields[i]?.id;
      if (id && s && !s.unitPrice.eq(D(item.unitPrice))) set.add(id);
    });
    return set;
  });
  const markManual = (id: string, on: boolean) =>
    setManual((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const watched = useWatch({ control });
  const lines = (watched.items ?? []).map((item, i) => {
    const id = items.fields[i]?.id ?? "";
    const quantity = parseMoneyInput(String(item?.quantity ?? "")) ?? D(0);
    const unitPrice = parseMoneyInput(String(item?.unitPrice ?? "")) ?? D(0);
    const suggested = suggest(item?.productId, item?.quantity);
    const isManual = manual.has(id);
    return { id, quantity, unitPrice, suggested, isManual };
  });
  const extraPercent = parseMoneyInput(String(watched.discountPercent ?? "")) ?? D(0);
  const totals = quoteBreakdown(
    lines.map((l) => ({
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      listPrice: !l.isManual && l.suggested?.discountPercent.gt(0) ? l.suggested.listPrice : null,
    })),
    extraPercent,
  );

  function setSuggestedPrice(index: number, productId: string | null | undefined, quantity: unknown) {
    const s = suggest(productId, quantity);
    if (s) setValue(`items.${index}.unitPrice`, toInputString(s.unitPrice), { shouldValidate: true });
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
    markManual(items.fields[index].id, false);
    setSuggestedPrice(index, productId, getValues(`items.${index}.quantity`));
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
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_340px]">
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
            <CardTitle>Qué le cotizás</CardTitle>
            {activeTiers.length > 0 && (
              <CardDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                Descuento por cantidad (se aplica solo al precio):
                {activeTiers.map((t) => (
                  <span key={t.minQuantity} className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                    {t.minQuantity}+ → −{formatPercent(t.discountPercent, 0)}
                  </span>
                ))}
                <Link href="/ajustes" className="text-xs text-primary underline">
                  cambiar
                </Link>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="grid gap-3">
            {items.fields.map((f, i) => {
              const productId = watched.items?.[i]?.productId;
              const line = lines[i];
              const s = line?.suggested;
              const volumeApplied = s && !line.isManual && s.discountPercent.gt(0);
              return (
                <div key={f.id} className="grid gap-2 rounded-xl border bg-background/50 p-3">
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
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[110px_150px_minmax(0,1fr)_auto]">
                    <Field label="Cantidad" className="gap-1">
                      <Controller
                        control={control}
                        name={`items.${i}.quantity`}
                        render={({ field }) => (
                          <Input
                            inputMode="decimal"
                            aria-label="Cantidad"
                            value={String(field.value ?? "")}
                            onChange={(e) => {
                              field.onChange(e);
                              // El precio acompaña la cantidad (tramos de descuento), salvo que lo hayas escrito vos.
                              if (!manual.has(f.id)) setSuggestedPrice(i, getValues(`items.${i}.productId`), e.target.value);
                            }}
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Precio c/u" className="gap-1">
                      <Input
                        inputMode="decimal"
                        aria-label="Precio por unidad"
                        placeholder="$"
                        {...register(`items.${i}.unitPrice`, { onChange: () => s && markManual(f.id, true) })}
                      />
                    </Field>
                    <div className="hidden pb-1.5 text-right sm:block">
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                      <Money value={totals.lines[i]?.toString() ?? 0} className="font-semibold" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="mb-1"
                      aria-label="Quitar ítem"
                      onClick={() => items.remove(i)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  <FieldError message={errors.items?.[i]?.quantity?.message ?? errors.items?.[i]?.unitPrice?.message} />

                  {/* Qué pasó con el precio de este ítem, en una línea. */}
                  {s && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      {volumeApplied ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-halo/35 px-2 py-0.5 font-semibold text-tinta dark:bg-halo/15 dark:text-halo">
                            <TagIcon className="size-3" />−{formatPercent(s.discountPercent, 0)} por cantidad ({s.tierMin} o más)
                          </span>
                          <span className="text-muted-foreground">
                            lista <Money value={s.listPrice.toString()} className="line-through" />
                          </span>
                        </>
                      ) : line.isManual ? (
                        <>
                          <span className="text-muted-foreground">
                            Precio a mano · sugerido <Money value={s.unitPrice.toString()} />
                          </span>
                          <button
                            type="button"
                            className="font-semibold text-primary underline-offset-2 hover:underline"
                            onClick={() => {
                              markManual(f.id, false);
                              setSuggestedPrice(i, productId, getValues(`items.${i}.quantity`));
                            }}
                          >
                            Usar sugerido
                          </button>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Precio de lista</span>
                      )}
                      {!line.isManual && s.next && (
                        <span className="text-muted-foreground">
                          · con {s.next.minQuantity} o más: −{formatPercent(s.next.discountPercent, 0)}
                        </span>
                      )}
                      <span className="ml-auto font-semibold sm:hidden">
                        <Money value={totals.lines[i]?.toString() ?? 0} />
                      </span>
                    </div>
                  )}
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
            <dl className="grid gap-1.5 text-sm">
              {totals.volumeDiscount.gt(0) && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">A precio de lista</dt>
                    <dd>
                      <Money value={totals.atList.toString()} />
                    </dd>
                  </div>
                  <div className="flex justify-between text-tinta dark:text-menta">
                    <dt>Descuento por cantidad</dt>
                    <dd>
                      − <Money value={totals.volumeDiscount.toString()} />
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between font-medium">
                <dt>Subtotal</dt>
                <dd>
                  <Money value={totals.subtotal.toString()} />
                </dd>
              </div>
            </dl>

            <Field
              label={
                <span className="flex items-center gap-1">
                  Descuento extra
                  <InfoTooltip>
                    Un descuento sobre el total, aparte del de cantidad (que ya está en el precio de cada ítem). Por
                    ejemplo, por pago en efectivo o cliente frecuente.
                  </InfoTooltip>
                </span>
              }
              htmlFor="q-disc"
              error={errors.discountPercent?.message}
            >
              <div className="flex items-center gap-1.5">
                <div className="grid flex-1 grid-cols-4 gap-1 rounded-lg border bg-muted/40 p-0.5" role="radiogroup" aria-label="Descuento extra rápido">
                  {EXTRA_CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={extraPercent.eq(c)}
                      onClick={() => setValue("discountPercent", String(c), { shouldValidate: true, shouldDirty: true })}
                      className={cn(
                        "rounded-md py-1 text-xs font-semibold tabular-nums transition-colors duration-150",
                        extraPercent.eq(c) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {c === 0 ? "No" : `${c}%`}
                    </button>
                  ))}
                </div>
                <div className="flex w-20 items-center gap-1">
                  <Input id="q-disc" inputMode="decimal" className="text-right" aria-label="Otro porcentaje" {...register("discountPercent")} />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </Field>

            <dl className="grid gap-1.5 text-sm">
              {totals.discount.gt(0) && (
                <div className="flex justify-between text-tinta dark:text-menta">
                  <dt>Descuento extra {formatPercent(extraPercent, 0)}</dt>
                  <dd>
                    − <Money value={totals.discount.toString()} />
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t pt-2">
                <dt className="text-base font-semibold">Total</dt>
                <dd className="text-2xl font-bold tracking-tight tabular-nums">
                  <span className="resalte">
                    <Money value={totals.total.toString()} />
                  </span>
                </dd>
              </div>
              {(totals.volumeDiscount.gt(0) || totals.discount.gt(0)) && (
                <p className="text-right text-xs text-muted-foreground">
                  Le ahorrás <Money value={totals.volumeDiscount.plus(totals.discount).toString()} /> en total.
                </p>
              )}
            </dl>

            <Field label="Válido hasta" htmlFor="q-valid" error={errors.validUntil?.message}>
              <Input id="q-valid" type="date" {...register("validUntil")} />
            </Field>
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
