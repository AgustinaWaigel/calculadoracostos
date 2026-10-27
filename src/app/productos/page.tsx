import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon, ShapesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/shared/ui-bits";
import { ProductList } from "@/components/products/product-list";
import { getAllProductsWithPricing } from "@/server/costing";
import { marginOf } from "@/lib/calc/pricing";

export const metadata = { title: "Productos" };

export default async function ProductosPage() {
  const { items } = await getAllProductsWithPricing();

  return (
    <>
      <PageHeader
        title="Productos"
        actions={
          <Button asChild>
            <Link href="/productos/nuevo">
              <PlusIcon /> Nuevo producto
            </Link>
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={ShapesIcon}
          title="Todavía no armaste productos"
          description="Combiná insumos y minutos de trabajo para saber cuánto te cuesta cada unidad."
          example={<>Ej: Foto plastificada A4 = 1 pouch + 1 hoja + 1 impresión → $1.189,49</>}
          action={{ label: "Armar el primero", href: "/productos/nuevo" }}
        />
      ) : (
        <Suspense>
          <ProductList
            rows={items.map(({ product, cost, pricing, pricingError }) => {
              const ref = pricing?.reference;
              return {
                id: product.id,
                name: product.name,
                category: product.category,
                cost: cost.total.toString(),
                price: ref?.price.toString() ?? null,
                channelName: ref?.channelName ?? null,
                margin: ref ? marginOf(ref.netOfVat, cost.total).toString() : null,
                takeHome: ref && pricing ? ref.netProfit.plus(pricing.ownLabor).toString() : null,
                error: pricingError,
                isLoss: ref?.isLoss ?? false,
                updatedAt: product.updatedAt.toISOString(),
              };
            })}
          />
        </Suspense>
      )}
    </>
  );
}
