import { D, Decimal, type DecimalInput } from "@/lib/money";

export interface BreakEvenInput {
  /** Costos fijos del mes. */
  monthlyFixedCosts: DecimalInput;
  /** Lo que te queda por unidad vendida antes de costos (precio neto de IVA y comisiones). */
  unitNetRevenue: DecimalInput;
  /** Costo variable por unidad (materiales + mano de obra + máquinas, SIN fijos). */
  unitVariableCost: DecimalInput;
}

export interface BreakEvenResult {
  /** Margen de contribución por unidad. */
  contribution: Decimal;
  /** Unidades por mes para cubrir los fijos (redondeado hacia arriba). */
  units: number;
  /** Facturación neta necesaria. */
  revenue: Decimal;
}

/**
 * Punto de equilibrio: unidades = fijos del mes ÷ (ingreso neto por unidad − costo variable).
 * Devuelve null si cada unidad no deja contribución (nunca se cubren los fijos).
 */
export function breakEven(input: BreakEvenInput): BreakEvenResult | null {
  const contribution = D(input.unitNetRevenue).minus(D(input.unitVariableCost));
  if (contribution.lte(0)) return null;
  const units = D(input.monthlyFixedCosts).div(contribution).ceil();
  return {
    contribution,
    units: units.toNumber(),
    revenue: units.times(D(input.unitNetRevenue)),
  };
}
