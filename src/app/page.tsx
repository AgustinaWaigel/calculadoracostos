import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  FileTextIcon,
  PackageIcon,
  PercentIcon,
  ShapesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { QuickCalculator } from "@/components/dashboard/quick-calculator";
import { DolarCard } from "@/components/dashboard/dolar-card";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { getAllProductsWithPricing } from "@/server/costing";
import { db } from "@/lib/db";
import { average } from "@/lib/calc/stats";
import { daysSince, isPriceStale, priceIncrease, supplyUnitCost } from "@/lib/calc/supply";
import { quoteTotals } from "@/lib/calc/quote";
import { formatPercent, sum } from "@/lib/money";

const WINDOW_DAYS = 90;

export default async function DashboardPage() {
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [{ items }, supplies, quotes] = await Promise.all([
    getAllProductsWithPricing(),
    db.supply.findMany({ include: { priceHistory: { orderBy: { recordedAt: "asc" } } } }),
    db.quote.findMany({ where: { createdAt: { gte: monthStart } }, include: { items: true } }),
  ]);

  // Rentabilidad (sobre el canal de referencia).
  const priced = items.filter((i) => i.pricing?.reference);
  const avgMargin = priced.length
    ? average(priced.map((i) => i.pricing!.reference!.netMarginPercent))
    : null;
  const topProducts = [...priced]
    .sort((a, b) => b.pricing!.reference!.netProfit.comparedTo(a.pricing!.reference!.netProfit))
    .slice(0, 5)
    .map((i) => ({
      id: i.product.id,
      name: i.product.name,
      profit: i.pricing!.reference!.netProfit.toNumber(),
      margin: i.pricing!.reference!.netMarginPercent.toNumber(),
    }));

  // Insumos que más subieron: desde el último precio anterior a la ventana hasta hoy.
  const increases = supplies
    .map((s) => {
      const before = s.priceHistory.filter((h) => h.recordedAt < since).at(-1);
      const window = s.priceHistory.filter((h) => h.recordedAt >= since);
      const inc = priceIncrease(before ? [before, ...window] : window);
      return inc ? { id: s.id, name: s.name, ...inc, unitCost: supplyUnitCost(s) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.arsPercent.gt(0))
    .sort((a, b) => b.arsPercent.comparedTo(a.arsPercent))
    .slice(0, 5);

  const stale = supplies
    .filter((s) => isPriceStale(s.priceUpdatedAt))
    .sort((a, b) => a.priceUpdatedAt.getTime() - b.priceUpdatedAt.getTime());
  const pendingQuotes = quotes.filter((q) => q.status === "SENT").length;
  const acceptedTotal = sum(
    quotes.filter((q) => q.status === "ACCEPTED").map((q) => quoteTotals(q.items, q.discountPercent).total),
  );

  return (
    <>
      <PageHeader
        title="Inicio"
        description="Cómo vienen tus costos y precios."
        actions={
          <Button asChild variant="outline">
            <Link href="/productos/nuevo">
              <ShapesIcon /> Nuevo producto
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Productos" icon={ShapesIcon} value={items.length} hint={`${supplies.length} insumos cargados`} />
          <StatCard
            label="Margen neto promedio"
            icon={PercentIcon}
            value={avgMargin ? formatPercent(avgMargin, 0) : "—"}
            tone={avgMargin ? (avgMargin.lt(15) ? "warn" : "good") : "default"}
            hint="después de comisiones"
          />
          <StatCard
            label="Precios desactualizados"
            icon={AlertTriangleIcon}
            value={stale.length}
            tone={stale.length > 0 ? "warn" : "good"}
            hint="más de 30 días"
          />
          <StatCard
            label="Presupuestos del mes"
            icon={FileTextIcon}
            value={quotes.length}
            hint={
              <>
                {pendingQuotes} esperando respuesta · <Money value={acceptedTotal.toString()} decimals={0} /> aceptados
              </>
            }
          />
        </div>

        {stale.length > 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangleIcon className="size-4" /> Revisá estos precios
              </CardTitle>
              <CardDescription>
                No se actualizan hace más de 30 días. Con la inflación, tu costo real puede ser mayor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-2">
                {stale.slice(0, 8).map((s) => (
                  <li key={s.id}>
                    <Badge asChild variant="outline" className="h-7 px-2.5">
                      <Link href={`/insumos/${s.id}`}>
                        {s.name} · {daysSince(s.priceUpdatedAt)} días
                      </Link>
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos más rentables</CardTitle>
              <CardDescription>Ganancia neta por unidad en venta directa.</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <EmptyState
                  icon={ShapesIcon}
                  title="Sin productos todavía"
                  description="Armá tu primer producto para ver cuánto te deja cada uno."
                  action={{ label: "Crear producto", href: "/productos/nuevo" }}
                />
              ) : (
                <ProfitChart data={topProducts} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="size-4" /> Insumos que más subieron
              </CardTitle>
              <CardDescription>Últimos {WINDOW_DAYS} días. En dólares, si hay cotización guardada.</CardDescription>
            </CardHeader>
            <CardContent>
              {increases.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                  <PackageIcon className="size-6" />
                  Cuando actualices precios vas a ver acá cuáles subieron más.
                </div>
              ) : (
                <ul className="grid gap-2">
                  {increases.map((s) => (
                    <li key={s.id}>
                      <Link href={`/insumos/${s.id}`} className="flex items-center gap-3 rounded-md p-1 hover:bg-muted/50">
                        <span className="min-w-0 flex-1 truncate">{s.name}</span>
                        <Money value={s.unitCost.toString()} className="text-sm text-muted-foreground" />
                        {s.usdPercent && s.usdPercent.gt(10) && (
                          <Badge variant="destructive" title="Subió más que el dólar">
                            USD +{formatPercent(s.usdPercent, 0)}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-red-500/40 text-red-700 dark:text-red-400">
                          +{formatPercent(s.arsPercent, 0)}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <QuickCalculator compact={false} />
          <div className="grid content-start gap-4">
            <DolarCard />
            <Card>
              <CardHeader>
                <CardTitle>Atajos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                {[
                  { href: "/insumos/nuevo", label: "Cargar un insumo" },
                  { href: "/presupuestos/nuevo", label: "Hacer un presupuesto" },
                  { href: "/mano-de-obra", label: "Calcular mi valor hora" },
                  { href: "/impresion", label: "Calcular la tinta por hoja" },
                  { href: "/ajustes#canales", label: "Configurar comisiones de ML" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    {l.label} <ArrowRightIcon className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
