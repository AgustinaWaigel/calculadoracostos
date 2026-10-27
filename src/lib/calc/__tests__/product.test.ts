import { describe, expect, it } from "vitest";
import { computeProductCost, costSlices } from "@/lib/calc/product";
import { supplyUnitCost } from "@/lib/calc/supply";
import { formatMoney } from "@/lib/money";

// Caso real del seed: "Foto plastificada A4" = 1 pouch + 1 hoja + 1 impresión
const pouch = { id: "pouch", name: "Pouch plastificado A4", packPrice: "28949", packQuantity: "100" };
const papel = { id: "papel", name: "Papel fotográfico A4", packPrice: "300", packQuantity: "1" };
const impresion = { id: "impresion", name: "Impresión A4 color", packPrice: "600", packQuantity: "1" };

describe("Foto plastificada A4 (seed)", () => {
  it("el pouch cuesta $289,49 c/u", () => {
    expect(supplyUnitCost(pouch).toString()).toBe("289.49");
  });

  it("cuesta $1.189,49 sin mano de obra ni fijos", () => {
    const cost = computeProductCost({
      supplies: [
        { ...pouch, quantity: 1 },
        { ...papel, quantity: 1 },
        { ...impresion, quantity: 1 },
      ],
    });
    expect(cost.total.toString()).toBe("1189.49");
    expect(cost.materials.toString()).toBe("1189.49");
    expect(formatMoney(cost.total)).toMatch(/1\.189,49/);
  });
});

describe("computeProductCost", () => {
  it("divide el lote por el rinde (1 hoja A4 → 4 tarjetas)", () => {
    const cost = computeProductCost({
      supplies: [{ packPrice: "300", packQuantity: "1", quantity: 1 }],
      labor: [{ hourlyRate: "6000", minutes: 10 }],
      batchYield: 4,
    });
    // materiales 300/4 = 75; mano de obra 6000*10/60 = 1000 → /4 = 250
    expect(cost.materials.toString()).toBe("75");
    expect(cost.labor.toString()).toBe("250");
    expect(cost.total.toString()).toBe("325");
  });

  it("acepta fracciones (0,25 hoja) y aplica merma solo a materiales", () => {
    const cost = computeProductCost({
      supplies: [{ packPrice: "300", packQuantity: "1", quantity: "0.25" }],
      labor: [{ hourlyRate: "6000", minutes: 1 }],
      wastePercent: 10,
    });
    expect(cost.materials.toString()).toBe("75");
    expect(cost.waste.toString()).toBe("7.5");
    expect(cost.labor.toString()).toBe("100");
    expect(cost.total.toString()).toBe("182.5");
  });

  it("suma máquinas y fijos prorrateados", () => {
    const cost = computeProductCost({
      supplies: [],
      machines: [
        { price: "500000", usefulLife: "1000", lifeUnit: "HOURS", usage: 6 }, // 500/h * 6 min = 50
        { price: "100000", usefulLife: "10000", lifeUnit: "UNITS", usage: 1 }, // 10 por uso
      ],
      fixedCostPerUnit: "40",
    });
    expect(cost.machines.toString()).toBe("60");
    expect(cost.variable.toString()).toBe("60");
    expect(cost.total.toString()).toBe("100");
    const slices = costSlices(cost);
    expect(slices.find((s) => s.key === "fixed")?.value.toString()).toBe("100");
  });

  it("rechaza un rinde de 0", () => {
    expect(() => computeProductCost({ supplies: [], batchYield: 0 })).toThrow();
  });
});

describe("mano de obra propia", () => {
  it("separa lo que hacés vos de lo que le pagás a otro, sin cambiar el costo", () => {
    const cost = computeProductCost({
      supplies: [],
      labor: [
        { hourlyRate: 6000, minutes: 30 }, // propia por defecto
        { hourlyRate: 4000, minutes: 30, isOwn: false },
      ],
      batchYield: 2,
    });
    expect(cost.labor.toNumber()).toBe(2500);
    expect(cost.ownLabor.toNumber()).toBe(1500);
    expect(cost.total.toNumber()).toBe(2500);
  });
});

describe("reparto de costos fijos", () => {
  it("por tamaño: multiplica lo de una unidad normal", () => {
    const grande = computeProductCost({ supplies: [], fixedCostPerUnit: 500, fixedWeight: 3 });
    const chico = computeProductCost({ supplies: [], fixedCostPerUnit: 500, fixedWeight: "0.5" });
    expect(grande.fixed.toNumber()).toBe(1500);
    expect(chico.fixed.toNumber()).toBe(250);
  });

  it("por tiempo: $/minuto × minutos de trabajo por unidad (ignora el tamaño)", () => {
    const cost = computeProductCost({
      supplies: [],
      labor: [
        { hourlyRate: 6000, minutes: 40 },
        { hourlyRate: 4000, minutes: 20 },
      ],
      batchYield: 2,
      fixedCostPerUnit: 500,
      fixedWeight: 3,
      fixedCostPerMinute: 10,
    });
    expect(cost.laborMinutes.toNumber()).toBe(30);
    expect(cost.fixed.toNumber()).toBe(300);
  });
});
