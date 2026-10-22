import { describe, expect, it } from "vitest";
import { quoteTotals } from "@/lib/calc/quote";
import { buildQuoteMessage } from "@/lib/quote-text";

describe("presupuestos", () => {
  const items = [
    { description: "Foto plastificada A4", quantity: "10", unitPrice: "1890" },
    { description: "Tarjetas x 100", quantity: "2", unitPrice: "12500.5" },
  ];

  it("totales con descuento", () => {
    const t = quoteTotals(items, 10);
    expect(t.subtotal.toString()).toBe("43901");
    expect(t.discount.toString()).toBe("4390.1");
    expect(t.total.toString()).toBe("39510.9");
  });

  it("mensaje de WhatsApp", () => {
    const msg = buildQuoteMessage(
      {
        number: 7,
        clientName: "Lucía Pérez",
        validUntil: new Date("2026-10-27T00:00:00Z"),
        discountPercent: 10,
        notes: "Seña del 50%.",
        items,
      },
      "Mi Emprendimiento",
    );
    expect(msg).toContain("¡Hola, Lucía!");
    expect(msg).toContain("*Presupuesto #0007*");
    expect(msg).toContain("• 10 × Foto plastificada A4");
    expect(msg).toMatch(/\$\s?1\.890,00 c\/u → \$\s?18\.900,00/);
    expect(msg).toMatch(/\*Total: \$\s?39\.510,90\*/);
    expect(msg).toContain("martes, 27 de octubre");
    expect(msg).toContain("Seña del 50%.");
  });
});
