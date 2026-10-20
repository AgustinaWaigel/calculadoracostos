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

const dateFmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeZone: "UTC" });

export const formatQuoteNumber = (n: number) => `#${String(n).padStart(4, "0")}`;

/** Resumen del presupuesto para mandar por WhatsApp (con *negritas* de WhatsApp). */
export function buildQuoteMessage(q: QuoteForText, businessName: string): string {
  const t = quoteTotals(q.items, q.discountPercent);
  const lines = q.items.map(
    (i, idx) =>
      `• ${formatNumber(i.quantity, 2)} × ${i.description} — ${formatMoney(t.lines[idx])}`,
  );
  const out = [
    `Hola ${q.clientName.split(" ")[0]}! Te paso el presupuesto ${formatQuoteNumber(q.number)} de *${businessName}*:`,
    "",
    ...lines,
    "",
  ];
  if (!D(q.discountPercent).isZero()) {
    out.push(`Subtotal: ${formatMoney(t.subtotal)}`);
    out.push(`Descuento ${formatPercent(q.discountPercent, 0)}: −${formatMoney(t.discount)}`);
  }
  out.push(`*Total: ${formatMoney(t.total)}*`);
  out.push(`Válido hasta el ${dateFmt.format(q.validUntil)}.`);
  if (q.notes) out.push("", q.notes);
  return out.join("\n");
}
