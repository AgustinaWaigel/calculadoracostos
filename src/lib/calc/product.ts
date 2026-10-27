import { D, Decimal, ZERO, pct, sum, type DecimalInput } from "@/lib/money";
import { laborCost } from "./labor";
import { machineUsageCost, type MachineInput } from "./fixed-costs";
import { supplyUnitCost, type SupplyPriceInput } from "./supply";

export interface RecipeSupplyLine extends SupplyPriceInput {
  id?: string;
  name?: string;
  /** Cantidad usada por LOTE (admite fracciones: 0,25 hoja). */
  quantity: DecimalInput;
}

export interface RecipeLaborLine {
  id?: string;
  name?: string;
  hourlyRate: DecimalInput;
  /** Minutos por LOTE. */
  minutes: DecimalInput;
  /** true (por defecto) = lo hacés vos: entra en el precio, pero es plata que te queda. */
  isOwn?: boolean;
}

export interface RecipeMachineLine extends MachineInput {
  id?: string;
  name?: string;
  /** Uso por LOTE: unidades o minutos según lifeUnit. */
  usage: DecimalInput;
}

export interface ProductCostInput {
  supplies: RecipeSupplyLine[];
  labor?: RecipeLaborLine[];
  machines?: RecipeMachineLine[];
  /** Unidades que salen de un lote ("de 1 hoja A4 salen 4 tarjetas"). */
  batchYield?: DecimalInput;
  /** Merma de materiales, en % (se suma al costo de materiales). */
  wastePercent?: DecimalInput;
  /** Costos fijos prorrateados por unidad normal (ya calculados). */
  fixedCostPerUnit?: DecimalInput;
  /** Cuántas unidades normales equivale este producto (chico 0,5 · grande 3). Multiplica a fixedCostPerUnit. */
  fixedWeight?: DecimalInput;
  /** Si viene, los fijos se reparten por tiempo: $/minuto × minutos de trabajo por unidad (ignora lo de arriba). */
  fixedCostPerMinute?: DecimalInput;
}

export interface LineCost {
  id?: string;
  name?: string;
  /** Costo de la línea por lote. */
  batchCost: Decimal;
  /** Costo de la línea por unidad terminada. */
  unitCost: Decimal;
}

export interface ProductCostBreakdown {
  /** Todo por UNIDAD terminada. */
  materials: Decimal;
  waste: Decimal;
  labor: Decimal;
  /** La parte de `labor` que hacés vos (te queda a vos, no se le paga a nadie). */
  ownLabor: Decimal;
  machines: Decimal;
  fixed: Decimal;
  /** Minutos de trabajo por unidad terminada (todas las tareas). */
  laborMinutes: Decimal;
  /** Costo variable = materiales + merma + mano de obra + máquinas. */
  variable: Decimal;
  total: Decimal;
  /** Costo total del lote (sin fijos). */
  batchVariable: Decimal;
  batchYield: Decimal;
  lines: {
    supplies: LineCost[];
    labor: LineCost[];
    machines: LineCost[];
  };
}

/**
 * Calcula el costo de un producto a partir de su receta (BOM).
 *
 * costo unitario = (materiales × (1 + merma) + mano de obra + máquinas) ÷ rinde + fijos por unidad
 */
export function computeProductCost(input: ProductCostInput): ProductCostBreakdown {
  const batchYield = D(input.batchYield ?? 1);
  if (batchYield.lte(0)) throw new RangeError("El rinde por lote tiene que ser mayor a 0");

  const toLine = (id: string | undefined, name: string | undefined, batchCost: Decimal): LineCost => ({
    id,
    name,
    batchCost,
    unitCost: batchCost.div(batchYield),
  });

  const supplies = input.supplies.map((s) =>
    toLine(s.id, s.name, supplyUnitCost(s).times(D(s.quantity))),
  );
  const labor = (input.labor ?? []).map((l) => toLine(l.id, l.name, laborCost(l.hourlyRate, l.minutes)));
  const machines = (input.machines ?? []).map((m) => toLine(m.id, m.name, machineUsageCost(m, m.usage)));

  const batchMaterials = sum(supplies.map((l) => l.batchCost));
  const batchWaste = batchMaterials.times(pct(input.wastePercent ?? 0));
  const batchLabor = sum(labor.map((l) => l.batchCost));
  const batchOwnLabor = sum(labor.filter((_, i) => input.labor![i].isOwn !== false).map((l) => l.batchCost));
  const batchMachines = sum(machines.map((l) => l.batchCost));
  const batchVariable = batchMaterials.plus(batchWaste).plus(batchLabor).plus(batchMachines);

  const materials = batchMaterials.div(batchYield);
  const waste = batchWaste.div(batchYield);
  const laborUnit = batchLabor.div(batchYield);
  const machinesUnit = batchMachines.div(batchYield);
  const laborMinutes = sum((input.labor ?? []).map((l) => l.minutes)).div(batchYield);
  const fixed =
    input.fixedCostPerMinute !== undefined
      ? D(input.fixedCostPerMinute).times(laborMinutes)
      : D(input.fixedCostPerUnit ?? ZERO).times(D(input.fixedWeight ?? 1));
  const variable = batchVariable.div(batchYield);

  return {
    materials,
    waste,
    labor: laborUnit,
    ownLabor: batchOwnLabor.div(batchYield),
    machines: machinesUnit,
    fixed,
    laborMinutes,
    variable,
    total: variable.plus(fixed),
    batchVariable,
    batchYield,
    lines: { supplies, labor, machines },
  };
}

export interface CostSlice {
  key: "materials" | "labor" | "fixed";
  label: string;
  value: Decimal;
}

/** Agrupa el desglose para el gráfico de torta: materiales / mano de obra / fijos. */
export function costSlices(b: ProductCostBreakdown): CostSlice[] {
  return [
    { key: "materials", label: "Materiales", value: b.materials.plus(b.waste) },
    { key: "labor", label: "Mano de obra", value: b.labor },
    { key: "fixed", label: "Fijos y amortización", value: b.fixed.plus(b.machines) },
  ];
}
