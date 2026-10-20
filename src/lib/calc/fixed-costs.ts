import { D, Decimal, ZERO, sum, type DecimalInput } from "@/lib/money";

export interface FixedCostInput {
  monthlyAmount: DecimalInput;
  active?: boolean;
}

export function totalMonthlyFixedCosts(costs: FixedCostInput[]): Decimal {
  return sum(costs.filter((c) => c.active !== false).map((c) => c.monthlyAmount));
}

/** Prorrateo: total de fijos del mes ÷ unidades que estimás producir en el mes. */
export function fixedCostPerUnit(totalMonthly: DecimalInput, monthlyUnits: DecimalInput): Decimal {
  const units = D(monthlyUnits);
  if (units.lte(0)) return ZERO;
  return D(totalMonthly).div(units);
}

export type LifeUnit = "UNITS" | "HOURS";

export interface MachineInput {
  price: DecimalInput;
  /** Vida útil en unidades producidas o en horas de uso. */
  usefulLife: DecimalInput;
  lifeUnit: LifeUnit;
}

/** Amortización por unidad de vida útil (por unidad o por hora). */
export function machineAmortizationRate({ price, usefulLife }: MachineInput): Decimal {
  const life = D(usefulLife);
  if (life.lte(0)) throw new RangeError("La vida útil tiene que ser mayor a 0");
  return D(price).div(life);
}

/**
 * Costo de amortización por uso en un producto.
 * `usage` está en unidades (lifeUnit UNITS) o en minutos (lifeUnit HOURS).
 */
export function machineUsageCost(machine: MachineInput, usage: DecimalInput): Decimal {
  const rate = machineAmortizationRate(machine);
  return machine.lifeUnit === "HOURS" ? rate.times(D(usage)).div(60) : rate.times(D(usage));
}
