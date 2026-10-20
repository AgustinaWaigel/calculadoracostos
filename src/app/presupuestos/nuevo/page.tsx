import { PageHeader } from "@/components/shared/ui-bits";
import { QuoteEditor } from "@/components/quotes/quote-editor";
import { getQuoteOptions } from "@/server/quote-options";

export const metadata = { title: "Nuevo presupuesto" };

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string }>;
}) {
  const { producto } = await searchParams;
  const { products, tiers, business } = await getQuoteOptions();
  const validUntil = new Date(Date.now() + business.quoteValidityDays * 86_400_000).toISOString().slice(0, 10);
  const preselected = products.find((p) => p.id === producto);

  return (
    <>
      <PageHeader title="Nuevo presupuesto" description="Elegí productos: el precio sugerido se completa solo." />
      <QuoteEditor
        products={products}
        tiers={tiers}
        defaults={{
          clientName: "",
          clientPhone: null,
          clientEmail: null,
          notes: null,
          validUntil,
          status: "DRAFT",
          discountPercent: "0",
          items: [
            preselected
              ? { productId: preselected.id, description: preselected.name, quantity: "1", unitPrice: preselected.price }
              : { productId: null, description: "", quantity: "1", unitPrice: "" },
          ],
        }}
      />
    </>
  );
}
