"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon, Loader2Icon, SaveIcon, SearchIcon, StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { useAction } from "@/components/shared/use-action";
import { MeliSearchDialog } from "@/components/meli/meli-search-dialog";
import { MeliLinkInput } from "@/components/meli/meli-link-input";
import { saveSupply } from "@/actions/supplies";
import { supplySchema, type SupplyData, type SupplyInput } from "@/lib/schemas";
import { supplyUnitCost } from "@/lib/calc/supply";
import { parseMoneyInput, toInputString } from "@/lib/money";
import { guessPackQuantity } from "@/lib/meli/guess";
import type { MeliListing } from "@/lib/meli/types";

const PURCHASE_UNITS = ["paquete", "rollo", "resma", "caja", "hoja", "unidad", "litro", "kg", "metro"];

export interface SupplyFormDefaults {
  id?: string;
  name: string;
  kind: "MATERIAL" | "SERVICE";
  category: string | null;
  purchaseUnit: string;
  usageUnit: string;
  packQuantity: string;
  packPrice: string;
  supplier: string | null;
  url: string | null;
  meliItemId: string | null;
}

export function SupplyForm({ defaults, categories }: { defaults?: SupplyFormDefaults; categories: string[] }) {
  const router = useRouter();
  const form = useForm<SupplyInput, unknown, SupplyData>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      id: defaults?.id,
      name: defaults?.name ?? "",
      kind: defaults?.kind ?? "MATERIAL",
      category: defaults?.category ?? "",
      purchaseUnit: defaults?.purchaseUnit ?? "paquete",
      usageUnit: defaults?.usageUnit ?? "unidad",
      packQuantity: toInputString(defaults?.packQuantity ?? "1"),
      packPrice: toInputString(defaults?.packPrice ?? ""),
      supplier: defaults?.supplier ?? "",
      url: defaults?.url ?? "",
      meliItemId: defaults?.meliItemId ?? "",
      priceSource: "MANUAL" } });
  const { register, control, formState, setValue, getValues, setError } = form;
  const { pending, run } = useAction<SupplyInput>(setError);

  const [packPrice, packQuantity, usageUnit, name] = useWatch({
    control,
    name: ["packPrice", "packQuantity", "usageUnit", "name"],
  });
  const price = parseMoneyInput(String(packPrice ?? ""));
  const qty = parseMoneyInput(String(packQuantity ?? ""));
  const unitCost = price && qty && qty.gt(0) ? supplyUnitCost({ packPrice: price, packQuantity: qty }) : null;

  function applyListing(listing: MeliListing, source: "MELI_SEARCH" | "MELI_LINK", url?: string) {
    setValue("packPrice", toInputString(listing.price), { shouldDirty: true, shouldValidate: true });
    setValue("priceSource", source);
    setValue("meliItemId", listing.id, { shouldDirty: true });
    setValue("url", url ?? listing.permalink ?? "", { shouldDirty: true });
    if (!getValues("name")) setValue("name", listing.title.slice(0, 120), { shouldDirty: true });
    if (!getValues("supplier") && listing.seller) setValue("supplier", listing.seller, { shouldDirty: true });
    const guessed = guessPackQuantity(listing.title);
    if (guessed) {
      setValue("packQuantity", String(guessed), { shouldDirty: true, shouldValidate: true });
      toast.info(`Usamos el precio de ML. Detectamos ${guessed} unidades por paquete: revisalo.`);
    } else {
      toast.info("Usamos el precio de ML. Revisá la cantidad por paquete.");
    }
  }

  const onSubmit = form.handleSubmit(() => {
    // Mandamos lo tipeado (no lo transformado): el servidor valida con el mismo schema.
    run(
      () => saveSupply(getValues()),
      (data) => {
        if (!defaults?.id) router.push(`/insumos/${data.id}`);
        else router.refresh();
      },
    );
  });

  const errors = formState.errors;

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Datos del insumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="name" placeholder="Ej: Pouch plastificado A4" {...register("name")} />
            </Field>
            <Field label="Tipo" error={errors.kind?.message}>
              <Controller
                control={control}
                name="kind"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATERIAL">Material</SelectItem>
                      <SelectItem value="SERVICE">Servicio tercerizado (impresión, corte…)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Categoría" htmlFor="category" error={errors.category?.message}>
              <Input id="category" list="supply-categories" placeholder="Papel, Tintas…" {...register("category")} />
              <datalist id="supply-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Proveedor" htmlFor="supplier" error={errors.supplier?.message}>
              <Input id="supplier" placeholder="Opcional" {...register("supplier")} />
            </Field>
            <Field label="Link" htmlFor="url" error={errors.url?.message}>
              <Input id="url" type="url" placeholder="https://…" {...register("url")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Tabs defaultValue="manual">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="search">
                  <SearchIcon /> Buscar en ML
                </TabsTrigger>
                <TabsTrigger value="link">
                  <LinkIcon /> Link de ML
                </TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="pt-2 text-sm text-muted-foreground">
                Completá el precio del paquete y cuántas unidades trae.
              </TabsContent>
              <TabsContent value="search" className="pt-2">
                <MeliSearchDialog
                  defaultQuery={name ?? ""}
                  myPrice={price?.toString()}
                  myPriceLabel="Tu precio del paquete"
                  onPick={(l) => applyListing(l, "MELI_SEARCH")}
                  trigger={
                    <Button type="button" variant="secondary">
                      <StoreIcon /> Buscar “{name || "insumo"}” en Mercado Libre
                    </Button>
                  }
                />
              </TabsContent>
              <TabsContent value="link" className="pt-2">
                <MeliLinkInput onResult={(l, url) => applyListing(l, "MELI_LINK", url)} />
              </TabsContent>
            </Tabs>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Precio del paquete" htmlFor="packPrice" error={errors.packPrice?.message}>
                <Input id="packPrice" inputMode="decimal" placeholder="28.949" {...register("packPrice")} />
              </Field>
              <Field label="Unidad de compra" htmlFor="purchaseUnit" error={errors.purchaseUnit?.message}>
                <Input id="purchaseUnit" list="purchase-units" {...register("purchaseUnit")} />
                <datalist id="purchase-units">
                  {PURCHASE_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </Field>
              <Field
                label="Cantidad por paquete"
                htmlFor="packQuantity"
                error={errors.packQuantity?.message}
                hint="Ej: un pack de 100 pouches → 100"
              >
                <Input id="packQuantity" inputMode="decimal" {...register("packQuantity")} />
              </Field>
              <Field
                label="Unidad de uso"
                htmlFor="usageUnit"
                error={errors.usageUnit?.message}
                hint="Cómo lo contás en la receta: hoja, pouch, ml…"
              >
                <Input id="usageUnit" {...register("usageUnit")} />
              </Field>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Costo por {usageUnit || "unidad"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="text-3xl font-semibold text-primary">
              {unitCost ? <Money value={unitCost.toString()} /> : "—"}
            </div>
            {unitCost && price && qty && (
              <p className="text-xs text-muted-foreground">
                <Money value={price.toString()} /> ÷ {qty.toString().replace(".", ",")} {usageUnit}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              {defaults?.id ? "Guardar cambios" : "Crear insumo"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
