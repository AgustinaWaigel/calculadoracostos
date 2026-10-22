"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { useAction } from "@/components/shared/use-action";
import { savePrintAsSupply } from "@/actions/print";
import { COVERAGE_LEVELS, PAPER_SIZES, areaFactor, jobInks, printCost } from "@/lib/calc/print";
import { parseMoneyInput, toInputString } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { EditorOptions } from "@/components/products/types";
import type { CreatedSupply } from "@/components/supplies/quick-supply-dialog";

/** Calculadora de impresión resumida: crea el insumo "Impresión …" sin salir del producto. */
export function QuickPrintDialog({
  open,
  onOpenChange,
  inks,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inks: EditorOptions["inks"];
  onCreated: (supply: CreatedSupply) => void;
}) {
  const [color, setColor] = useState(true);
  const [level, setLevel] = useState<number>(25);
  const [sizeId, setSizeId] = useState("A4");
  const [doubleSided, setDoubleSided] = useState(false);
  const [waste, setWaste] = useState("10");
  const { pending, run } = useAction();

  const size = PAPER_SIZES.find((s) => s.id === sizeId)!;
  // Con punto para calcular y mostrar; con coma (como lo escribirías) para guardar.
  let cost: string | null = null;
  let error: string | null = null;
  try {
    if (inks.length > 0) {
      const r = printCost({
        inks: jobInks(inks, color, level),
        areaFactor: areaFactor(size.widthMm, size.heightMm),
        wastePercent: parseMoneyInput(waste) ?? 0,
        sides: doubleSided ? 2 : 1,
      });
      cost = r.ink.toDecimalPlaces(4).toString();
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Revisá los datos";
  }
  const name = `Impresión ${size.id.replace("FOTO", "foto ")} ${color ? "color" : "B/N"} ${level}%${doubleSided ? " doble faz" : ""}`;

  const save = (e: React.FormEvent) => {
    // El diálogo vive dentro del formulario del producto: que este submit no lo dispare.
    e.preventDefault();
    e.stopPropagation();
    if (!cost) return;
    const costPerSheet = cost;
    run(
      () => savePrintAsSupply({ name, costPerSheet: toInputString(costPerSheet) }),
      (data) => {
        onCreated({
          id: data.id,
          name,
          kind: "SERVICE",
          usageUnit: "hoja",
          packPrice: costPerSheet,
          packQuantity: "1",
          unitCost: costPerSheet,
        });
        onOpenChange(false);
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar impresión</DialogTitle>
          <DialogDescription>Calculamos la tinta por hoja con tus tintas y la sumamos como insumo.</DialogDescription>
        </DialogHeader>

        {inks.length === 0 ? (
          <p className="rounded-md bg-muted px-3 py-3 text-sm">
            Todavía no cargaste tus tintas.{" "}
            <Link href="/impresion" target="_blank" className="inline-flex items-center gap-1 font-semibold text-primary underline">
              Cargalas en Impresión <ExternalLinkIcon className="size-3.5" />
            </Link>{" "}
            (se abre en otra pestaña, así no perdés este producto) y después volvé a abrir esta ventana.
          </p>
        ) : (
          <form id="quick-print-form" className="grid gap-4" onSubmit={save}>
            <div className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1" role="radiogroup" aria-label="Color">
              {[
                { value: false, label: "Blanco y negro" },
                { value: true, label: "A color" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={color === o.value}
                  onClick={() => setColor(o.value)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
                    color === o.value ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <Field label="Ocupación de tinta">
              <div className="grid grid-cols-5 gap-1 rounded-xl border bg-muted/40 p-1" role="radiogroup" aria-label="Ocupación de tinta">
                {COVERAGE_LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={level === l}
                    onClick={() => setLevel(l)}
                    className={cn(
                      "rounded-lg py-2 text-sm font-semibold tabular-nums transition-colors duration-150",
                      level === l ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted",
                    )}
                  >
                    {l}%
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tamaño">
                <Select value={sizeId} onValueChange={setSizeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SIZES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Merma (%)" htmlFor="qp-waste">
                <Input id="qp-waste" inputMode="decimal" value={waste} onChange={(e) => setWaste(e.target.value)} />
              </Field>
              <label className="flex h-9 items-center justify-between gap-3 self-end rounded-lg border bg-muted/40 px-3 text-sm font-medium">
                Doble cara
                <Switch checked={doubleSided} onCheckedChange={setDoubleSided} />
              </label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {cost && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                <span className="font-semibold">{name}</span>:{" "}
                <span className="resalte font-bold">
                  <Money value={cost} />
                </span>{" "}
                de tinta por hoja.
              </p>
            )}
          </form>
        )}

        {inks.length > 0 && (
          <DialogFooter>
            <Button type="submit" form="quick-print-form" disabled={pending || !cost}>
              {pending && <Loader2Icon className="animate-spin" />}
              Guardar y usar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
