import { describe, expect, it } from "vitest";
import { listingStats, normalizeItem, normalizeProduct, normalizeSearchResult } from "@/lib/meli/normalize";
import { guessPackQuantity } from "@/lib/meli/guess";
import { parseMoneyInput, toInputString } from "@/lib/money";

describe("guessPackQuantity", () => {
  it("lee la cantidad del título", () => {
    expect(guessPackQuantity("Pouch Para Plastificar A4 X 100 Unidades 125 Micrones")).toBe(100);
    expect(guessPackQuantity("Resma A4 75g 500 hojas")).toBe(500);
    expect(guessPackQuantity("Pack de 50 sobres")).toBe(50);
    expect(guessPackQuantity("Plastificadora A4")).toBeNull();
  });
});

describe("toInputString", () => {
  it("ida y vuelta sin ambigüedad", () => {
    expect(toInputString("0.125")).toBe("0,125");
    expect(parseMoneyInput(toInputString("0.125"))?.toString()).toBe("0.125");
    expect(parseMoneyInput(toInputString("28949"))?.toString()).toBe("28949");
  });
});

describe("normalización de respuestas de ML", () => {
  it("resultado de búsqueda", () => {
    const l = normalizeSearchResult({
      id: "MLA1",
      title: "Pouch A4 x100",
      price: 28949,
      currency_id: "ARS",
      thumbnail: "http://http2.mlstatic.com/foto.jpg",
      seller: { id: 9, nickname: "LIBRERIA" },
      shipping: { free_shipping: true },
      sold_quantity: 150,
    });
    expect(l).toMatchObject({ price: 28949, seller: "LIBRERIA", freeShipping: true, soldQuantity: 150 });
    expect(l?.thumbnail?.startsWith("https://")).toBe(true);
    expect(normalizeSearchResult({ id: "x", title: "sin precio", price: null })).toBeNull();
  });

  it("ítem y producto de catálogo", () => {
    expect(normalizeItem({ id: "MLA2", title: "Papel", price: 300, seller_id: 5 })?.seller).toBe("Vendedor #5");
    const p = normalizeProduct({
      id: "MLA99",
      name: "Pouch",
      buy_box_winner: { item_id: "MLA3", price: 27000 },
    });
    expect(p).toMatchObject({ id: "MLA3", title: "Pouch", price: 27000 });
    expect(normalizeProduct({ id: "MLA98", name: "Sin ganador" })).toBeNull();
  });

  it("estadísticas solo en pesos", () => {
    const base = { title: "x", thumbnail: null, permalink: null, seller: null, freeShipping: false, soldQuantity: null, condition: null };
    const s = listingStats([
      { ...base, id: "1", price: 100, currency: "ARS" },
      { ...base, id: "2", price: 200, currency: "ARS" },
      { ...base, id: "3", price: 5, currency: "USD" },
    ]);
    expect(s).toMatchObject({ total: 2, median: "150" });
  });
});
