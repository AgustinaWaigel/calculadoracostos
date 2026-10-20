import { describe, expect, it } from "vitest";
import { comparePriceToMarket, marketStats } from "@/lib/calc/market-stats";
import { median, quantile } from "@/lib/calc/stats";

describe("estadísticas", () => {
  it("mediana y cuantiles", () => {
    expect(median([3, 1, 2]).toString()).toBe("2");
    expect(median([1, 2, 3, 4]).toString()).toBe("2.5");
    expect(quantile([1, 2, 3, 4, 5], 0.25).toString()).toBe("2");
  });
});

describe("marketStats", () => {
  it("descarta atípicos con IQR", () => {
    const s = marketStats([25000, 27000, 28000, 28500, 29000, 30000, 31000, 250000, 1]);
    expect(s).not.toBeNull();
    expect(s!.total).toBe(9);
    expect(s!.discarded).toBe(2);
    expect(s!.max.toString()).toBe("31000");
    expect(s!.min.toString()).toBe("25000");
    expect(s!.median.toString()).toBe("28500");
  });

  it("con pocos datos no descarta", () => {
    const s = marketStats([100, 10000]);
    expect(s!.used).toBe(2);
    expect(marketStats([])).toBeNull();
  });

  it("compara con la mediana", () => {
    expect(comparePriceToMarket(1200, 1000).position).toBe("above");
    expect(comparePriceToMarket(800, 1000).position).toBe("below");
    expect(comparePriceToMarket(1030, 1000).position).toBe("equal");
    expect(comparePriceToMarket(800, 1000).diffPercent.toString()).toBe("-20");
  });
});
