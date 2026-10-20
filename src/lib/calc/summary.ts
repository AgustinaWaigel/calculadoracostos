import { D, Decimal, type DecimalInput } from "@/lib/money";
import { breakEven, type BreakEvenResult } from "./break-even";
import type { ProductCostBreakdown } from "./product";
import {
  channelPrice,
  priceFromCost,
  volumeTable,
  type ChannelConfig,
  type ChannelPriceResult,
  type PricingMode,
  type TaxCondition,
  type VolumeRow,
  type VolumeTierInput,
} from "./pricing";

export interface PricingSettings {
  taxCondition: TaxCondition;
  ivaPercent: DecimalInput;
  defaultMarginPercent: DecimalInput;
  pricingMode: PricingMode;
  roundTo?: DecimalInput;
}

export interface ChannelWithType extends ChannelConfig {
  type?: string;
}

export type ChannelOutcome =
  | ({ ok: true; type?: string } & ChannelPriceResult)
  | { ok: false; type?: string; channelName: string; error: string };

export interface ProductPricingSummary {
  mode: PricingMode;
  percent: Decimal;
  /** Precio base (sin IVA ni comisiones) según margen/markup. */
  basePrice: Decimal;
  /** Ganancia neta por unidad que se busca mantener en todos los canales. */
  targetProfit: Decimal;
  channels: ChannelOutcome[];
  /** Canal de referencia (venta directa o el primero que funcione). */
  reference: (ChannelPriceResult & { ok: true; type?: string }) | null;
  breakEven: BreakEvenResult | null;
  volume: VolumeRow[];
}

/**
 * Junta todo: costo → precio base → precios por canal → equilibrio → volumen.
 * El margen/markup del producto pisa el default del emprendimiento.
 */
export function summarizeProductPricing(args: {
  cost: ProductCostBreakdown;
  settings: PricingSettings;
  product?: { marginPercent?: DecimalInput | null; pricingMode?: PricingMode | null };
  channels: ChannelWithType[];
  tiers: VolumeTierInput[];
  monthlyFixedCosts: DecimalInput;
}): ProductPricingSummary {
  const { cost, settings } = args;
  const mode = args.product?.pricingMode ?? settings.pricingMode;
  const percent = D(args.product?.marginPercent ?? settings.defaultMarginPercent);
  const basePrice = priceFromCost(cost.total, percent, mode);
  const targetProfit = basePrice.minus(cost.total);

  const channels: ChannelOutcome[] = args.channels.map((channel) => {
    try {
      const result = channelPrice({
        unitCost: cost.total,
        targetProfit,
        channel,
        taxCondition: settings.taxCondition,
        ivaPercent: settings.ivaPercent,
        roundTo: settings.roundTo,
      });
      return { ok: true as const, type: channel.type, ...result };
    } catch (e) {
      return {
        ok: false as const,
        type: channel.type,
        channelName: channel.name,
        error: e instanceof Error ? e.message : "No se pudo calcular",
      };
    }
  });

  const okChannels = channels.filter((c): c is Extract<ChannelOutcome, { ok: true }> => c.ok);
  const reference = okChannels.find((c) => c.type === "DIRECT") ?? okChannels[0] ?? null;

  let be: BreakEvenResult | null = null;
  let volume: VolumeRow[] = [];
  if (reference) {
    // Lo que queda por unidad después de IVA y comisiones (antes de costos).
    const unitNetRevenue = reference.netProfit.plus(cost.total);
    be = breakEven({
      monthlyFixedCosts: args.monthlyFixedCosts,
      unitNetRevenue,
      unitVariableCost: cost.variable,
    });
    volume = volumeTable(reference.price, cost.total, args.tiers);
  }

  return { mode, percent, basePrice, targetProfit, channels, reference, breakEven: be, volume };
}
