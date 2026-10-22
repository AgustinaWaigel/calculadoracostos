import { describe, expect, it } from "vitest";
import { prepareQuery, rankByRelevance, relevance, searchTerms } from "@/lib/meli/relevance";

describe("relevancia de búsquedas en ML", () => {
  it("separa número y unidad para la búsqueda", () => {
    expect(prepareQuery("papel obra 90gr")).toBe("papel obra 90 gr");
    expect(prepareQuery("  Tinta  70ml ")).toBe("Tinta 70 ml");
    expect(prepareQuery("hoja a4")).toBe("hoja a4"); // "a4" no es número + unidad
  });

  it("unifica unidades, acentos y saca palabras vacías", () => {
    expect(searchTerms("Papel de obra 90 gramos")).toEqual(["papel", "obra", "90", "g"]);
    expect(searchTerms("Húsares")).toEqual(["husares"]);
  });

  it("cuenta plurales y unidades pegadas", () => {
    const terms = searchTerms("resma obra 90gr");
    expect(relevance("Kit X 4 Resmas A4 Boreal 90 Gr Papel Obra", terms)).toBe(1);
    expect(relevance("Resma Papel Obra A4 90g", terms)).toBe(1);
    expect(relevance("Resma Papel Obra A4 80g", terms)).toBe(0.75);
    expect(relevance("Cinta Enmascarar Azul", terms)).toBe(0);
  });

  it("ordena por relevancia y descarta lo que no tiene que ver", () => {
    const titles = [
      "Cinta Papel Obra Enmascarar Azul",
      "Rollo Plotter Papel Obra 90gr",
      "Resma Papel Obra A4 90 Gr",
      "Manteles Individuales",
    ];
    const ranked = rankByRelevance(titles, "resma papel obra 90gr", (t) => t, 1);
    expect(ranked).toEqual(["Resma Papel Obra A4 90 Gr"]);
    // Si casi nada tiene todas las palabras, suma lo que tiene al menos la mitad.
    expect(rankByRelevance(titles, "resma papel obra 90gr", (t) => t)).toEqual([
      "Resma Papel Obra A4 90 Gr",
      "Rollo Plotter Papel Obra 90gr", // 4 de 5 palabras; la cinta tiene 2 de 5 y queda afuera
    ]);
  });
});
