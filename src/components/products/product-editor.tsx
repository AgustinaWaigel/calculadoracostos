"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, InfoTooltip } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { Combobox } from "@/components/shared/combobox";
import { useAction } from "@/components/shared/use-action";
import { CostBreakdownPie } from "./cost-breakdown-pie";
import { MarginTooltip } from "./margin-tooltip";
import { computeLive } from "./live-costing";
import { saveProduct } from "@/actions/products";
import { productSchema, type ProductData, type ProductInput } from "@/lib/schemas";
import { formatMoney, formatPercent, toInputString } from "@/lib/money";
import type { EditorOptions, ProductFormValues } from "./types";

export function ProductEditor({ options, defaults }: { options: EditorOptions; defaults?: ProductFormValues }) {
  const router = useRouter();
  const form = useForm<ProductInput, unknown, ProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: defaults?.id,
      name: defaults?.name ?? "",
      description: defaults?.description ?? "",
      category: defaults?.category ?? "",
      batchYield: toInputString(defaults?.batchYield ?? "1"),
      wastePercent: toInputString(defaults?.wastePercent ?? "0"),
      includeFixedCosts: defaults?.includeFixedCosts ?? true,
      marginPercent: toInputString(defaults?.marginPercent ?? null),
      pricingMode: defaults?.pricingMode ?? null,
      supplies: defaults?.supplies.map((s) => ({ ...s, quantity: toInputString(s.quantity) })) ?? [
        { supplyId: "", quantity: "1" },
      ],
      labor: defaults?.labor.map((l) => ({ ...l, minutes: toInputString(l.minutes) })) ?? [],
      machines: defaults?.machines.map((m) => ({ ...m, usage: toInputString(m.usage) })) ?? [],
    },
  });
  const { control, register, formState, getValues, setError } = form;
  const errors = formState.errors;
  const supplies = useFieldArray({ control, name: "supplies" });
  const labor = useFieldArray({ control, name: "labor" });
  const machines = useFieldArray({ control, name: "machines" });
  const { pending, run } = useAction<ProductInput>(setError);

  const values = useWatch({ control });
  const live = computeLive(values, options);
  const supplyById = new Map(options.supplies.map((s) => [s.id, s]));
  const machineById = new Map(options.machines.map((m) => [m.id, m]));
  const lineCost = (list: { id?: string; batchCost: { toString(): string } }[] | undefined, id?: string) =>
    list?.find((l) => l.id === id)?.batchCost.toString();

  const mode = values.pricingMode ?? options.settings.pricingMode;
  const ref = live.summary?.reference;

  const onSubmit = form.handleSubmit(() => {
    // Sacamos las líneas vacías antes de mandar.
    const raw = getValues();
    run(
      () =>
        saveProduct({
          ...raw,
          supplies: (raw.supplies ?? []).filter((s) => s.supplyId),
          labor: (raw.labor ?? []).filter((l) => l.profileId),
          machines: (raw.machines ?? []).filter((m) => m.machineId),
        }),
      (data) => {
        if (!defaults?.id) router.push(`/productos/${data.id}`);
        else router.refresh();
      },
    );
  });

  // Validamos ignorando líneas vacías (el usuario puede dejar una fila sin completar).
  const submit = (e: React.FormEvent) => {
    const raw = getValues();
    form.setValue("supplies", (raw.supplies ?? []).filter((s) => s.supplyId));
    form.setValue("labor", (raw.labor ?? []).filter((l) => l.profileId));
    form.setValue("machines", (raw.machines ?? []).filter((m) => m.machineId));
    void onSubmit(e);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Producto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="p-name" error={errors.name?.message}>
              <Input id="p-name" placeholder="Ej: Foto plastificada A4" {...register("name")} />
            </Field>
            <Field label="Categoría" htmlFor="p-category" error={errors.category?.message}>
              <Input id="p-category" list="product-categories" placeholder="Opcional" {...register("category")} />
              <datalist id="product-categories">
                {options.categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Descripción" htmlFor="p-desc" className="sm:col-span-2">
              <Textarea id="p-desc" rows={2} placeholder="Opcional" {...register("description")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rinde y merma</CardTitle>
            <CardDescription>Las cantidades de abajo son para un lote completo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field
              label={
                <span className="flex items-center gap-1">
                  Unidades por lote
                  <InfoTooltip>
                    Si de 1 hoja A4 salen 4 tarjetas, poné 4: el costo de la hoja se divide entre las 4.
                  </InfoTooltip>
                </span>
              }
              htmlFor="p-yield"
              error={errors.batchYield?.message}
            >
              <Input id="p-yield" inputMode="decimal" {...register("batchYield")} />
            </Field>
            <Field
              label={
                <span className="flex items-center gap-1">
                  Merma (%)
                  <InfoTooltip>Material que se pierde: impresiones fallidas, recortes, pruebas.</InfoTooltip>
                </span>
              }
              htmlFor="p-waste"
              error={errors.wastePercent?.message}
            >
              <Input id="p-waste" inputMode="decimal" {...register("wastePercent")} />
            </Field>
            <Field label="Costos fijos">
              <Controller
                control={control}
                name="includeFixedCosts"
                render={({ field }) => (
                  <label className="flex h-8 items-center gap-2 text-sm">
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    Incluir <Money value={options.fixedPerUnit} className="font-medium" />/u
                  </label>
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insumos</CardTitle>
            <CardDescription>Se aceptan fracciones: 0,25 hoja, 1,5 m…</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {options.supplies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No tenés insumos cargados.{" "}
                <Link href="/insumos/nuevo" className="font-medium text-primary underline">
                  Cargar uno
                </Link>
              </p>
            )}
            {supplies.fields.map((f, i) => {
              const sel = supplyById.get(values.supplies?.[i]?.supplyId ?? "");
              return (
                <div key={f.id} className="grid grid-cols-[1fr_auto_auto] items-start gap-2 sm:grid-cols-[1fr_120px_110px_auto]">
                  <Controller
                    control={control}
                    name={`supplies.${i}.supplyId`}
                    render={({ field }) => (
                      <Combobox
                        ariaLabel="Insumo"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Elegí un insumo"
                        searchPlaceholder="Buscar insumo…"
                        options={options.supplies.map((s) => ({
                          value: s.id,
                          label: s.name,
                          hint: `${formatMoney(s.unitCost)}/${s.usageUnit}`,
                        }))}
                        className="col-span-3 sm:col-span-1"
                      />
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Input inputMode="decimal" aria-label="Cantidad" {...register(`supplies.${i}.quantity`)} />
                      <span className="w-12 truncate text-xs text-muted-foreground">{sel?.usageUnit}</span>
                    </div>
                    <FieldError message={errors.supplies?.[i]?.quantity?.message} />
                  </div>
                  <div className="self-center text-right text-sm">
                    <Money value={lineCost(live.cost?.lines.supplies, sel?.id) ?? 0} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="self-center"
                    aria-label="Quitar insumo"
                    onClick={() => supplies.remove(i)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              );
            })}
            <FieldError message={errors.supplies?.message ?? errors.supplies?.root?.message} />
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => supplies.append({ supplyId: "", quantity: "1" })}
              >
                <PlusIcon /> Agregar insumo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mano de obra</CardTitle>
            <CardDescription>Minutos de trabajo por lote para cada perfil.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {options.profiles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Primero creá un perfil en{" "}
                <Link href="/mano-de-obra" className="font-medium text-primary underline">
                  Mano de obra
                </Link>
                .
              </p>
            )}
            {labor.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_120px_auto] items-start gap-2 sm:grid-cols-[1fr_120px_110px_auto]">
                <Controller
                  control={control}
                  name={`labor.${i}.profileId`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-label="Perfil">
                        <SelectValue placeholder="Perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} · {formatMoney(p.hourlyRate, "ARS", 0)}/h
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Input inputMode="decimal" aria-label="Minutos" {...register(`labor.${i}.minutes`)} />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                  <FieldError message={errors.labor?.[i]?.minutes?.message} />
                </div>
                <div className="hidden self-center text-right text-sm sm:block">
                  <Money value={lineCost(live.cost?.lines.labor, values.labor?.[i]?.profileId) ?? 0} />
                </div>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar" onClick={() => labor.remove(i)}>
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <FieldError message={errors.labor?.message ?? errors.labor?.root?.message} />
            {options.profiles.length > 0 && (
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => labor.append({ profileId: options.profiles[0].id, minutes: "10" })}
                >
                  <PlusIcon /> Agregar tiempo de trabajo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {options.machines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Máquinas</CardTitle>
              <CardDescription>Amortización según el uso por lote.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {machines.fields.map((f, i) => {
                const m = machineById.get(values.machines?.[i]?.machineId ?? "");
                return (
                  <div key={f.id} className="grid grid-cols-[1fr_120px_auto] items-start gap-2 sm:grid-cols-[1fr_140px_110px_auto]">
                    <Controller
                      control={control}
                      name={`machines.${i}.machineId`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" aria-label="Máquina">
                            <SelectValue placeholder="Máquina" />
                          </SelectTrigger>
                          <SelectContent>
                            {options.machines.map((mm) => (
                              <SelectItem key={mm.id} value={mm.id}>
                                {mm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Input inputMode="decimal" aria-label="Uso" {...register(`machines.${i}.usage`)} />
                        <span className="text-xs text-muted-foreground">{m?.lifeUnit === "HOURS" ? "min" : "usos"}</span>
                      </div>
                      <FieldError message={errors.machines?.[i]?.usage?.message} />
                    </div>
                    <div className="hidden self-center text-right text-sm sm:block">
                      <Money value={lineCost(live.cost?.lines.machines, m?.id) ?? 0} />
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar" onClick={() => machines.remove(i)}>
                      <Trash2Icon />
                    </Button>
                  </div>
                );
              })}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => machines.append({ machineId: options.machines[0].id, usage: "1" })}
                >
                  <PlusIcon /> Agregar máquina
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resumen en vivo */}
      <div className="grid content-start gap-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Costo por unidad</CardTitle>
            {live.cost && !live.cost.batchYield.eq(1) && (
              <CardDescription>
                Lote de {live.cost.batchYield.toString().replace(".", ",")} unidades:{" "}
                <Money value={live.cost.batchVariable.toString()} /> sin fijos
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-3xl font-semibold text-primary">
              <Money value={live.cost?.total.toString() ?? 0} />
            </p>
            <CostBreakdownPie slices={live.slices} />
            {live.cost && live.cost.waste.gt(0) && (
              <p className="text-xs text-muted-foreground">
                Incluye <Money value={live.cost.waste.toString()} /> de merma.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              Ganancia
              <MarginTooltip />
            </CardTitle>
            <CardDescription>
              Por defecto: {formatPercent(options.settings.defaultMarginPercent, 0)} de{" "}
              {options.settings.pricingMode === "MARGIN" ? "margen" : "markup"} (Ajustes).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-[1fr_100px] gap-2">
              <Controller
                control={control}
                name="pricingMode"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "DEFAULT"}
                    onValueChange={(v) => field.onChange(v === "DEFAULT" ? null : v)}
                  >
                    <SelectTrigger className="w-full" aria-label="Tipo de ganancia">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEFAULT">Usar el de Ajustes</SelectItem>
                      <SelectItem value="MARGIN">Margen sobre el precio</SelectItem>
                      <SelectItem value="MARKUP">Markup sobre el costo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <div className="flex items-center gap-1">
                <Input
                  inputMode="decimal"
                  placeholder={toInputString(options.settings.defaultMarginPercent)}
                  aria-label="Porcentaje"
                  {...register("marginPercent")}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <FieldError message={errors.marginPercent?.message} />
            {live.error && <p className="text-xs text-destructive">{live.error}</p>}
            {live.summary && ref && (
              <dl className="grid gap-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ganancia por unidad</dt>
                  <dd>
                    <Money value={live.summary.targetProfit.toString()} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{ref.channelName}</dt>
                  <dd className="text-lg font-semibold">
                    <Money value={ref.price.toString()} />
                  </dd>
                </div>
                <p className="text-xs text-muted-foreground">
                  {mode === "MARGIN" ? "Margen" : "Markup"} de {formatPercent(live.summary.percent, 0)}
                  {defaults?.id && (
                    <>
                      {" · "}
                      <Link href={`/productos/${defaults.id}/precio`} className="text-primary underline">
                        ver todos los canales
                      </Link>
                    </>
                  )}
                </p>
              </dl>
            )}
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              {defaults?.id ? "Guardar cambios" : "Crear producto"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
