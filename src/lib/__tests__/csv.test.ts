import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";

describe("csv", () => {
  it("ida y vuelta con comillas, separadores y tildes", () => {
    const csv = toCsv([
      { nombre: 'Pouch "A4"', precio: "28949", notas: "con; punto y coma" },
      { nombre: "Papel fotográfico", precio: "300", notas: "" },
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(parseCsv(csv)).toEqual([
      { nombre: 'Pouch "A4"', precio: "28949", notas: "con; punto y coma" },
      { nombre: "Papel fotográfico", precio: "300", notas: "" },
    ]);
  });

  it("acepta coma como separador y saltos de línea \\r\\n", () => {
    expect(parseCsv("Nombre,Precio\r\nHoja,300\r\n")).toEqual([{ nombre: "Hoja", precio: "300" }]);
  });
});
