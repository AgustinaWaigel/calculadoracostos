import Link from "next/link";
import { PlusIcon, ShapesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { ProductRowActions } from "@/components/products/product-row-actions";
import { getAllProductsWithPricing } from "@/server/costing";
import { formatPercent } from "@/lib/money";
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
        <Card className="gap-0 overflow-hidden py-0">
          <ul className="divide-y">
            {items.map(({ product, cost, pricing, pricingError }) => {
              const ref = pricing?.reference;
              const margin = ref ? marginOf(ref.netOfVat, cost.total) : null;
              return (
                <li key={product.id} className="flex items-center gap-2 pr-2 transition-colors hover:bg-muted/50">
                  <Link href={`/productos/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{product.name}</span>
                        {product.category && <Badge variant="secondary">{product.category}</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Costo <Money value={cost.total.toString()} />
                        {margin && <> · margen {formatPercent(margin, 0)}</>}
                        {pricingError && <span className="text-destructive"> · {pricingError}</span>}
                      </p>
                    </div>
                    {ref && (
                      <div className="text-right">
                        <Money value={ref.price.toString()} className="font-semibold" />
                        <p className="text-xs text-muted-foreground">{ref.channelName}</p>
                      </div>
                    )}
                  </Link>
                  <ProductRowActions id={product.id} name={product.name} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
