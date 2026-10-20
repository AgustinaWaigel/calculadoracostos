import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { quoteTotals } from "@/lib/calc/quote";
import { D, formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { formatQuoteNumber } from "@/lib/quote-text";

export interface QuotePdfData {
  number: number;
  createdAt: Date;
  validUntil: Date;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  notes: string | null;
  discountPercent: string;
  items: { description: string; quantity: string; unitPrice: string }[];
  business: {
    name: string;
    logoUrl: string | null;
    phone: string | null;
    email: string | null;
    instagram: string | null;
    address: string | null;
  };
}

const ACCENT = "#15803d";
const MUTED = "#6b7280";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 52, height: 52, objectFit: "contain" },
  businessName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  contact: { color: MUTED, marginTop: 2 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ACCENT, textAlign: "right" },
  meta: { textAlign: "right", color: MUTED, marginTop: 2 },
  section: { marginBottom: 18 },
  label: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  table: { borderTopWidth: 1, borderColor: "#e5e7eb" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb", paddingVertical: 6 },
  headRow: { flexDirection: "row", paddingVertical: 6, backgroundColor: "#f3f4f6" },
  th: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  cDesc: { flex: 1, paddingHorizontal: 6 },
  cQty: { width: 50, textAlign: "right", paddingHorizontal: 6 },
  cPrice: { width: 90, textAlign: "right", paddingHorizontal: 6 },
  cTotal: { width: 90, textAlign: "right", paddingHorizontal: 6 },
  totals: { marginTop: 10, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: "#111827",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  notes: { marginTop: 24, padding: 10, backgroundColor: "#f9fafb", borderRadius: 4 },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, textAlign: "center", color: MUTED, fontSize: 8 },
});

const dateFmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeZone: "UTC" });

export function QuotePdf({ q }: { q: QuotePdfData }) {
  const t = quoteTotals(q.items, q.discountPercent);
  const contact = [q.business.phone, q.business.email, q.business.instagram, q.business.address].filter(Boolean);

  return (
    <Document title={`Presupuesto ${formatQuoteNumber(q.number)} - ${q.clientName}`} author={q.business.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt */}
            {q.business.logoUrl && <Image src={q.business.logoUrl} style={s.logo} />}
            <View>
              <Text style={s.businessName}>{q.business.name}</Text>
              {contact.map((c) => (
                <Text key={c} style={s.contact}>
                  {c}
                </Text>
              ))}
            </View>
          </View>
          <View>
            <Text style={s.title}>Presupuesto</Text>
            <Text style={s.meta}>{formatQuoteNumber(q.number)}</Text>
            <Text style={s.meta}>Fecha: {dateFmt.format(q.createdAt)}</Text>
            <Text style={s.meta}>Válido hasta: {dateFmt.format(q.validUntil)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.label}>Cliente</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>{q.clientName}</Text>
          {q.clientPhone && <Text style={s.contact}>{q.clientPhone}</Text>}
          {q.clientEmail && <Text style={s.contact}>{q.clientEmail}</Text>}
        </View>

        <View style={s.table}>
          <View style={s.headRow}>
            <Text style={[s.th, s.cDesc]}>Descripción</Text>
            <Text style={[s.th, s.cQty]}>Cant.</Text>
            <Text style={[s.th, s.cPrice]}>Precio unit.</Text>
            <Text style={[s.th, s.cTotal]}>Subtotal</Text>
          </View>
          {q.items.map((item, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={s.cDesc}>{item.description}</Text>
              <Text style={s.cQty}>{formatNumber(item.quantity)}</Text>
              <Text style={s.cPrice}>{formatMoney(item.unitPrice)}</Text>
              <Text style={s.cTotal}>{formatMoney(t.lines[i])}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          {!D(q.discountPercent).isZero() && (
            <>
              <View style={s.totalRow}>
                <Text>Subtotal</Text>
                <Text>{formatMoney(t.subtotal)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text>Descuento {formatPercent(q.discountPercent, 0)}</Text>
                <Text>-{formatMoney(t.discount)}</Text>
              </View>
            </>
          )}
          <View style={s.grandTotal}>
            <Text>Total</Text>
            <Text>{formatMoney(t.total)}</Text>
          </View>
        </View>

        {q.notes && (
          <View style={s.notes}>
            <Text style={s.label}>Notas</Text>
            <Text>{q.notes}</Text>
          </View>
        )}

        <Text style={s.footer} fixed>
          {q.business.name} · Presupuesto {formatQuoteNumber(q.number)} · Precios en pesos argentinos
        </Text>
      </Page>
    </Document>
  );
}
