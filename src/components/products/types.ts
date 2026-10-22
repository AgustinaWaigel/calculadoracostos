import type { PricingMode, TaxCondition } from "@/lib/calc/pricing";
import type { InkChannel } from "@/lib/calc/print";

/** Datos planos (strings) que el editor de productos necesita para calcular en vivo. */
export interface EditorOptions {
  supplies: {
    id: string;
    name: string;
    kind: "MATERIAL" | "SERVICE";
    usageUnit: string;
    packPrice: string;
    packQuantity: string;
    unitCost: string;
  }[];
  profiles: { id: string; name: string; hourlyRate: string; color: string | null }[];
  machines: { id: string; name: string; price: string; usefulLife: string; lifeUnit: "UNITS" | "HOURS" }[];
  fixedPerUnit: string;
  monthlyFixed: string;
  monthlyUnitsEstimate: number;
  settings: {
    taxCondition: TaxCondition;
    ivaPercent: string;
    defaultMarginPercent: string;
    pricingMode: PricingMode;
    roundTo: string;
  };
  channels: {
    id: string;
    name: string;
    type: string;
    commissionPercent: string;
    fixedFee: string;
    shippingCost: string;
    paymentFeePercent: string;
    installmentsPercent: string;
    priceAdjustPercent: string;
    applyIva: boolean;
  }[];
  tiers: { minQuantity: number; discountPercent: string }[];
  categories: string[];
  /** Tintas guardadas en Impresión, para calcular una impresión sin salir del producto. */
  inks: { name: string; channel: InkChannel; bottlePrice: string; yieldPages: number }[];
}

export interface ProductFormValues {
  id?: string;
  name: string;
  description: string | null;
  category: string | null;
  batchYield: string;
  wastePercent: string;
  includeFixedCosts: boolean;
  marginPercent: string | null;
  pricingMode: PricingMode | null;
  supplies: { supplyId: string; quantity: string }[];
  labor: { profileId: string; minutes: string }[];
  machines: { machineId: string; usage: string }[];
}
