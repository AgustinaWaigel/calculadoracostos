import { createElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { QuotePdf } from "@/components/quotes/quote-pdf";
import { db } from "@/lib/db";
import { getBusiness } from "@/server/costing";
import { formatQuoteNumber } from "@/lib/quote-text";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, business] = await Promise.all([
    db.quote.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } } } }),
    getBusiness(),
  ]);
  if (!quote) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });

  const element = createElement(QuotePdf, {
    q: {
      number: quote.number,
      createdAt: quote.createdAt,
      validUntil: quote.validUntil,
      clientName: quote.clientName,
      clientPhone: quote.clientPhone,
      clientEmail: quote.clientEmail,
      notes: quote.notes,
      discountPercent: quote.discountPercent.toString(),
      items: quote.items.map((i) => ({
        description: i.description,
        quantity: i.quantity.toString(),
        unitPrice: i.unitPrice.toString(),
      })),
      business: {
        name: business.name,
        logoUrl: business.logoUrl,
        phone: business.phone,
        email: business.email,
        instagram: business.instagram,
        address: business.address,
      },
    },
  }) as unknown as React.ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);
  const filename = `presupuesto-${formatQuoteNumber(quote.number).slice(1)}-${quote.clientName
    .normalize("NFD")
    .replace(/[^\w]+/g, "-")
    .toLowerCase()}.pdf`;
  const inline = new URL(request.url).searchParams.has("ver");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
