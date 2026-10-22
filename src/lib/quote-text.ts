import { quoteTotals } from "@/lib/calc/quote";
import { D, formatMoney, formatNumber, formatPercent, type DecimalInput } from "@/lib/money";

export interface QuoteForText {
  number: number;
  clientName: string;
  validUntil: Date;
  discountPercent: DecimalInput;
  notes?: string | null;
  items: { description: string; quantity: DecimalInput; unitPrice: DecimalInput }[];
}

const dateFmt = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export const formatQuoteNumber = (n: number) => `#${String(n).padStart(4, "0")}`;

/** Resumen del presupuesto para mandar por WhatsApp (con *negritas* de WhatsApp). */
export function buildQuoteMessage(q: QuoteForText, businessName: string): string {
  const t = quoteTotals(q.items, q.discountPercent);
  const firstName = q.clientName.trim().split(/\s+/)[0];
  const out = [
    `¡Hola, ${firstName}! Te paso el presupuesto que me pediste de *${businessName}*.`,
    "",
    `*Presupuesto ${formatQuoteNumber(q.number)}*`,
  ];

  for (const [idx, i] of q.items.entries()) {
    out.push(`• ${formatNumber(i.quantity, 2)} × ${i.description}`);
    // Con una sola unidad, el precio unitario y el subtotal son lo mismo.
    out.push(
      D(i.quantity).eq(1)
        ? `   ${formatMoney(t.lines[idx])}`
        : `   ${formatMoney(i.unitPrice)} c/u → ${formatMoney(t.lines[idx])}`,
    );
  }

  out.push("");
  if (!D(q.discountPercent).isZero()) {
    out.push(`Subtotal: ${formatMoney(t.subtotal)}`);
    out.push(`Descuento ${formatPercent(q.discountPercent, 0)}: −${formatMoney(t.discount)}`);
  }
  out.push(`*Total: ${formatMoney(t.total)}*`);
  out.push("", `El precio se mantiene hasta el ${dateFmt.format(q.validUntil)}.`);
  if (q.notes) out.push("", q.notes);
  out.push("", "Si te cierra, respondeme por acá y lo arrancamos. Y si querés cambiar algo, también.");
  return out.join("\n");
}
