import { describe, expect, it } from "vitest";
import { isPriceStale, priceChangePercent, priceIncrease, supplyUnitCost } from "@/lib/calc/supply";
import { compareHourlyRate, laborCost, suggestedHourlyRate } from "@/lib/calc/labor";
import {
  fixedCostPerUnit,
  machineAmortizationRate,
  machineUsageCost,
  totalMonthlyFixedCosts,
} from "@/lib/calc/fixed-costs";

describe("insumos", () => {
  it("costo por unidad", () => {
    expect(supplyUnitCost({ packPrice: 5000, packQuantity: 500 }).toString()).toBe("10");
    expect(() => supplyUnitCost({ packPrice: 1, packQuantity: 0 })).toThrow();
  });

  it("variación de precio", () => {
    expect(priceChangePercent(1000, 1250).toString()).toBe("25");
    expect(priceChangePercent(0, 10).toString()).toBe("0");
  });

  it("detecta precios viejos (> 30 días)", () => {
    const now = new Date("2026-10-20T12:00:00Z");
    expect(isPriceStale(new Date("2026-09-10T12:00:00Z"), now)).toBe(true);
    expect(isPriceStale(new Date("2026-10-01T12:00:00Z"), now)).toBe(false);
  });

  it("calcula la suba en pesos y en dólares", () => {
    const inc = priceIncrease([
      { packPrice: 1000, packQuantity: 1, usdRate: 1000, recordedAt: new Date("2026-01-01") },
      { packPrice: 1500, packQuantity: 1, usdRate: 1500, recordedAt: new Date("2026-06-01") },
    ]);
    expect(inc?.arsPercent.toString()).toBe("50");
    expect(inc?.usdPercent?.toString()).toBe("0");
  });
});

describe("mano de obra", () => {
  it("valor hora sugerido", () => {
    expect(suggestedHourlyRate({ monthlyIncome: 800000, hoursPerMonth: 160 }).toString()).toBe("5000");
  });
  it("costo por minutos", () => {
    expect(laborCost(6000, 15).toString()).toBe("1500");
  });
  it("avisa si cobrás por debajo del mercado", () => {
    const cmp = compareHourlyRate(4000, [5000, 6000, 7000]);
    expect(cmp?.median.toString()).toBe("6000");
    expect(cmp?.isBelowMarket).toBe(true);
    expect(cmp?.diffPercent.toDecimalPlaces(2).toString()).toBe("-33.33");
    expect(compareHourlyRate(1, [])).toBeNull();
  });
});

describe("costos fijos", () => {
  it("prorratea solo los activos", () => {
    const total = totalMonthlyFixedCosts([
      { monthlyAmount: 300000 },
      { monthlyAmount: 50000 },
      { monthlyAmount: 99999, active: false },
    ]);
    expect(total.toString()).toBe("350000");
    expect(fixedCostPerUnit(total, 500).toString()).toBe("700");
    expect(fixedCostPerUnit(total, 0).toString()).toBe("0");
  });
  it("amortiza máquinas por unidad u hora", () => {
    const plastificadora = { price: 120000, usefulLife: 20000, lifeUnit: "UNITS" as const };
    expect(machineAmortizationRate(plastificadora).toString()).toBe("6");
    const plancha = { price: 600000, usefulLife: 2000, lifeUnit: "HOURS" as const };
    expect(machineUsageCost(plancha, 30).toString()).toBe("150");
  });
});
