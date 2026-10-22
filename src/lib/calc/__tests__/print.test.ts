import { describe, expect, it } from "vitest";
import { areaFactor, evenCoverage, inkCostPerReferencePage, jobInks, printCost } from "@/lib/calc/print";

// Botes tipo sistema continuo: negro $12.000 rinde 7.500 pág., colores $12.000 rinden 6.000 pág. (al 5%)
const K = { name: "Negro", bottlePrice: "12000", yieldPages: "7500" };
const C = { name: "Cian", bottlePrice: "12000", yieldPages: "6000" };
const M = { name: "Magenta", bottlePrice: "12000", yieldPages: "6000" };
const Y = { name: "Amarillo", bottlePrice: "12000", yieldPages: "6000" };

describe("calculadora de impresión", () => {
  it("costo de una página al 5%", () => {
    expect(inkCostPerReferencePage(12000, 7500).toString()).toBe("1.6");
    expect(() => inkCostPerReferencePage(1, 0)).toThrow();
  });

  it("factor de tamaño respecto de A4", () => {
    expect(areaFactor(210, 297).toString()).toBe("1");
    expect(areaFactor(297, 420).toDecimalPlaces(2).toString()).toBe("2");
  });

  it("texto en negro al 5% = el costo de referencia", () => {
    const r = printCost({ inks: [{ ...K, coverage: 5 }] });
    expect(r.ink.toString()).toBe("1.6");
    expect(r.sheetsPerSet).toBe(7500);
  });

  it("foto a sangre: escala por cobertura, merma, tamaño y papel", () => {
    const r = printCost({
      inks: [
        { ...K, coverage: 15 }, // 1,6 × 3 = 4,8
        { ...C, coverage: 40 }, // 2 × 8 = 16
        { ...M, coverage: 40 },
        { ...Y, coverage: 40 },
      ],
      wastePercent: 10,
      paperCost: 300,
      copies: 10,
    });
    // tinta = (4,8 + 48) × 1,1 = 58,08
    expect(r.ink.toString()).toBe("58.08");
    expect(r.perSheet.toString()).toBe("358.08");
    expect(r.total.toString()).toBe("3580.8");
    // el color se agota primero: 6000 / (8 × 1,1) = 681,8 → 681 hojas
    expect(r.sheetsPerSet).toBe(681);
  });

  it("A3 cuesta el doble de tinta que A4", () => {
    const a4 = printCost({ inks: [{ ...C, coverage: 20 }] });
    const a3 = printCost({ inks: [{ ...C, coverage: 20 }], areaFactor: 2 });
    expect(a3.ink.toString()).toBe(a4.ink.times(2).toString());
  });

  it("valida la cobertura", () => {
    expect(() => printCost({ inks: [{ ...K, coverage: 120 }] })).toThrow();
  });

  it("doble faz gasta el doble de tinta, no de papel", () => {
    const simple = printCost({ inks: [{ ...K, coverage: 10 }], paperCost: 300 });
    const doble = printCost({ inks: [{ ...K, coverage: 10 }], paperCost: 300, sides: 2 });
    expect(doble.ink.toString()).toBe(simple.ink.times(2).toString());
    expect(doble.paper.toString()).toBe("300");
    expect(doble.sheetsPerSet).toBe(1875); // 7500 / (2 × 2)
  });

  it("ocupación general: se reparte entre las tintas = promedio de las tintas", () => {
    const inks = [K, C, M, Y];
    const each = evenCoverage(50, inks.length); // 12,5% cada una
    expect(each.toString()).toBe("12.5");
    const r = printCost({ inks: inks.map((i) => ({ ...i, coverage: each })) });
    // promedio por página de referencia = (1,6 + 2 + 2 + 2) / 4 = 1,9 → × 50/5 = 19
    expect(r.ink.toString()).toBe("19");
    expect(() => evenCoverage(50, 0)).toThrow();
  });

  it("tintas del trabajo: B/N usa solo las negras, color todas", () => {
    const saved = [
      { ...K, channel: "K" as const },
      { ...C, channel: "C" as const },
      { ...M, channel: "M" as const },
      { ...Y, channel: "Y" as const },
    ];
    const bn = jobInks(saved, false, 10);
    expect(bn.map((i) => i.name)).toEqual(["Negro"]);
    expect(bn[0].coverage.toString()).toBe("10");
    const color = jobInks(saved, true, 50);
    expect(color).toHaveLength(4);
    expect(printCost({ inks: color }).ink.toString()).toBe("19"); // igual que el promedio de las tintas
    expect(() => jobInks(saved.slice(1), false, 10)).toThrow(/Negro/);
  });
});
