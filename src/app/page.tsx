import Link from "next/link";
import {
  AlertTriangleIcon,
  CalculatorIcon,
  FileTextIcon,
  PackageIcon,
  PercentIcon,
  PrinterIcon,
  ShapesIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { DolarCard } from "@/components/dashboard/dolar-card";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { ACCENTS, type Accent } from "@/components/layout/nav-items";
import { getAllProductsWithPricing } from "@/server/costing";
import { db } from "@/lib/db";
import { average } from "@/lib/calc/stats";
import { daysSince, isPriceStale, priceIncrease, supplyUnitCost } from "@/lib/calc/supply";
import { formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

const WINDOW_DAYS = 90;

const QUICK_ACTIONS: { href: string; label: string; icon: LucideIcon; accent: Accent }[] = [
  { href: "/insumos/nuevo", label: "Cargar insumo", icon: PackageIcon, accent: "sky" },
  { href: "/productos/nuevo", label: "Nuevo producto", icon: ShapesIcon, accent: "violet" },
  { href: "/presupuestos/nuevo", label: "Presupuesto", icon: FileTextIcon, accent: "emerald" },
  { href: "/impresion", label: "Tinta por hoja", icon: PrinterIcon, accent: "cyan" },
  { href: "/calculadora", label: "Cuenta rápida", icon: CalculatorIcon, accent: "orange" },
];

export default async function DashboardPage() {
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [{ items }, supplies, quotesThisMonth] = await Promise.all([
    getAllProductsWithPricing(),
    db.supply.findMany({ include: { priceHistory: { orderBy: { recordedAt: "asc" } } } }),
    db.quote.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const priced = items.filter((i) => i.pricing?.reference);
  const avgMargin = priced.length ? average(priced.map((i) => i.pricing!.reference!.netMarginPercent)) : null;
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

  return (
    <>
      <PageHeader title="Inicio" />

      <div className="grid gap-4">
        {/* Accesos directos */}
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="Accesos rápidos">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 font-medium transition-transform hover:-translate-y-0.5",
                ACCENTS[a.accent].bg,
                ACCENTS[a.accent].border,
              )}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", ACCENTS[a.accent].solid)}>
                <a.icon className="size-5" />
              </span>
              {a.label}
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Productos" icon={ShapesIcon} accent="violet" value={items.length} />
          <StatCard
            label="Margen promedio"
            icon={PercentIcon}
            accent="green"
            value={avgMargin ? formatPercent(avgMargin, 0) : "—"}
          />
          <StatCard
            label="Precios viejos"
            icon={AlertTriangleIcon}
            accent="amber"
            value={stale.length}
            hint="+30 días sin actualizar"
          />
          <StatCard label="Presupuestos del mes" icon={FileTextIcon} accent="emerald" value={quotesThisMonth} />
        </div>

        {stale.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">Revisá estos precios:</span>
            {stale.slice(0, 8).map((s) => (
              <Badge key={s.id} asChild variant="outline" className="h-7 bg-background px-2.5">
                <Link href={`/insumos/${s.id}`}>
                  {s.name} · {daysSince(s.priceUpdatedAt)} d
                </Link>
              </Badge>
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_300px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={cn("grid size-7 place-items-center rounded-lg", ACCENTS.violet.solid)}>
                  <ShapesIcon className="size-4" />
                </span>
                Lo que más te deja
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <EmptyState
                  icon={ShapesIcon}
                  title="Sin productos"
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
                <span className={cn("grid size-7 place-items-center rounded-lg", ACCENTS.rose.solid)}>
                  <TrendingUpIcon className="size-4" />
                </span>
                Lo que más subió
              </CardTitle>
            </CardHeader>
            <CardContent>
              {increases.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Sin subas en los últimos 90 días.</p>
              ) : (
                <ul className="grid gap-1">
                  {increases.map((s) => (
                    <li key={s.id}>
                      <Link href={`/insumos/${s.id}`} className="flex items-center gap-3 rounded-md p-1.5 hover:bg-muted/50">
                        <span className="min-w-0 flex-1 truncate">{s.name}</span>
                        <Money value={s.unitCost.toString()} className="text-sm text-muted-foreground" />
                        {s.usdPercent && s.usdPercent.gt(10) && (
                          <Badge variant="destructive" title="Subió más que el dólar">
                            USD +{formatPercent(s.usdPercent, 0)}
                          </Badge>
                        )}
                        <Badge className="bg-rose-600 text-white">+{formatPercent(s.arsPercent, 0)}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <DolarCard />
        </div>
      </div>
    </>
  );
}
