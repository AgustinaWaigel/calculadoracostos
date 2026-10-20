import {
  computeProductCost,
  costSlices,
  summarizeProductPricing,
  type ProductCostBreakdown,
  type ProductPricingSummary,
} from "@/lib/calc";
import { parseMoneyInput, type Decimal } from "@/lib/money";
import type { PricingMode } from "@/lib/calc/pricing";
import type { EditorOptions } from "./types";

export interface LiveValues {
  batchYield?: unknown;
  wastePercent?: unknown;
  includeFixedCosts?: boolean;
  marginPercent?: unknown;
  pricingMode?: PricingMode | null;
  supplies?: { supplyId?: string; quantity?: unknown }[];
  labor?: { profileId?: string; minutes?: unknown }[];
  machines?: { machineId?: string; usage?: unknown }[];
}

const num = (v: unknown): Decimal | null =>
  v === null || v === undefined || v === "" ? null : parseMoneyInput(String(v));

export interface LiveResult {
  cost: ProductCostBreakdown | null;
  summary: ProductPricingSummary | null;
  slices: { key: string; label: string; value: number }[];
  error: string | null;
}

/** Calcula costo y precio en el navegador mientras se edita (ignora líneas incompletas). */
export function computeLive(values: LiveValues, options: EditorOptions): LiveResult {
  try {
    const supplyById = new Map(options.supplies.map((s) => [s.id, s]));
    const profileById = new Map(options.profiles.map((p) => [p.id, p]));
    const machineById = new Map(options.machines.map((m) => [m.id, m]));

    const cost = computeProductCost({
      supplies: (values.supplies ?? []).flatMap((line) => {
        const s = line.supplyId ? supplyById.get(line.supplyId) : undefined;
        const q = num(line.quantity);
        return s && q && q.gt(0)
          ? [{ id: s.id, name: s.name, packPrice: s.packPrice, packQuantity: s.packQuantity, quantity: q }]
          : [];
      }),
      labor: (values.labor ?? []).flatMap((line) => {
        const p = line.profileId ? profileById.get(line.profileId) : undefined;
        const m = num(line.minutes);
        return p && m && m.gt(0) ? [{ id: p.id, name: p.name, hourlyRate: p.hourlyRate, minutes: m }] : [];
      }),
      machines: (values.machines ?? []).flatMap((line) => {
        const m = line.machineId ? machineById.get(line.machineId) : undefined;
        const u = num(line.usage);
        return m && u && u.gt(0) ? [{ ...m, usage: u }] : [];
      }),
      batchYield: num(values.batchYield)?.gt(0) ? num(values.batchYield)! : 1,
      wastePercent: num(values.wastePercent) ?? 0,
      fixedCostPerUnit: values.includeFixedCosts === false ? 0 : options.fixedPerUnit,
    });

    let summary: ProductPricingSummary | null = null;
    let error: string | null = null;
    try {
      summary = summarizeProductPricing({
        cost,
        settings: options.settings,
        product: { marginPercent: num(values.marginPercent), pricingMode: values.pricingMode ?? null },
        channels: options.channels,
        tiers: options.tiers,
        monthlyFixedCosts: options.monthlyFixed,
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "No se pudo calcular el precio";
    }

    return {
      cost,
      summary,
      error,
      slices: costSlices(cost).map((s) => ({ key: s.key, label: s.label, value: s.value.toNumber() })),
    };
  } catch (e) {
    return { cost: null, summary: null, slices: [], error: e instanceof Error ? e.message : "Error de cálculo" };
  }
}
