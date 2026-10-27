"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangleIcon, SearchIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Money } from "@/components/shared/money";
import { ProductRowActions } from "./product-row-actions";
import { formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface ProductListRow {
  id: string;
  name: string;
  category: string | null;
  cost: string;
  price: string | null;
  channelName: string | null;
  /** Margen real sobre el precio sin IVA, en %. */
  margin: string | null;
  /** Lo que te queda por unidad: margen + tu propio trabajo. */
  takeHome: string | null;
  error: string | null;
  isLoss: boolean;
  updatedAt: string;
}

const NO_CATEGORY = "__none";
const REVIEW = "__review";

const SORTS = {
  recent: { label: "Últimos editados", compare: (a: ProductListRow, b: ProductListRow) => b.updatedAt.localeCompare(a.updatedAt) },
  name: { label: "Nombre (A–Z)", compare: (a: ProductListRow, b: ProductListRow) => a.name.localeCompare(b.name, "es") },
  priceDesc: { label: "Precio: mayor a menor", compare: byNumber("price", -1) },
  priceAsc: { label: "Precio: menor a mayor", compare: byNumber("price", 1) },
  takeHome: { label: "Te queda: mayor a menor", compare: byNumber("takeHome", -1) },
  marginAsc: { label: "Margen: menor a mayor", compare: byNumber("margin", 1) },
} as const;
type SortKey = keyof typeof SORTS;

function byNumber(key: "price" | "takeHome" | "margin", dir: 1 | -1) {
  // Los que no tienen valor (error de precio) van siempre al final.
  return (a: ProductListRow, b: ProductListRow) => {
    if (a[key] === null) return b[key] === null ? 0 : 1;
    if (b[key] === null) return -1;
    return (Number(a[key]) - Number(b[key])) * dir;
  };
}

/** Minúsculas y sin tildes, para buscar "cuadro" y encontrar "Cuádro". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const needsReview = (r: ProductListRow) => !!r.error || r.isLoss;

/** Listado de productos con búsqueda, filtro por categoría y orden (guardados en la URL). */
export function ProductList({ rows }: { rows: ProductListRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const category = params.get("cat");
  const sort: SortKey = (params.get("orden") as SortKey) in SORTS ? (params.get("orden") as SortKey) : "recent";

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Categorías sin repetir aunque estén escritas distinto ("Tazas" y "tazas ").
  const categories = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const r of rows) {
      if (!r.category?.trim()) continue;
      const key = fold(r.category);
      const entry = map.get(key) ?? { label: r.category.trim(), count: 0 };
      entry.count++;
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [rows]);
  const uncategorized = rows.filter((r) => !r.category?.trim()).length;
  const toReview = rows.filter(needsReview).length;

  const q = fold(query);
  const visible = rows
    .filter((r) => {
      if (category === REVIEW) return needsReview(r);
      if (category === NO_CATEGORY) return !r.category?.trim();
      if (category) return r.category ? fold(r.category) === category : false;
      return true;
    })
    .filter((r) => !q || fold(r.name).includes(q) || (r.category && fold(r.category).includes(q)))
    .sort(SORTS[sort].compare);

  const chips = [
    { value: null, label: "Todas", count: rows.length },
    ...categories.map((c) => ({ value: c.key, label: c.label, count: c.count })),
    ...(uncategorized > 0 && categories.length > 0
      ? [{ value: NO_CATEGORY, label: "Sin categoría", count: uncategorized }]
      : []),
  ];
  const filtered = !!q || !!category;

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setParam("q", e.target.value.trim() || null);
            }}
            placeholder="Buscar por nombre o categoría…"
            aria-label="Buscar productos"
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setParam("orden", v === "recent" ? null : v)}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Ordenar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([key, s]) => (
              <SelectItem key={key} value={key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filtrar por categoría">
        {chips.map((c) => (
          <Chip key={c.label} active={category === c.value} onClick={() => setParam("cat", c.value)}>
            {c.label} <span className="opacity-70">{c.count}</span>
          </Chip>
        ))}
        {toReview > 0 && (
          <Chip
            active={category === REVIEW}
            onClick={() => setParam("cat", category === REVIEW ? null : REVIEW)}
            className={category === REVIEW ? "bg-destructive text-white" : "text-destructive"}
          >
            <AlertTriangleIcon className="size-3.5" /> Para revisar <span className="opacity-70">{toReview}</span>
          </Chip>
        )}
      </div>

      {visible.length === 0 ? (
        <Card className="items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          No hay productos que coincidan.
          {filtered && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                router.replace(pathname, { scroll: false });
              }}
            >
              <XIcon /> Limpiar filtros
            </Button>
          )}
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          {filtered && (
            <p className="border-b px-4 py-2 text-xs text-muted-foreground">
              {visible.length} de {rows.length} productos
            </p>
          )}
          <ul className="divide-y">
            {visible.map((r) => (
              <li key={r.id} className="flex items-center gap-2 pr-2 transition-colors hover:bg-muted/50">
                <Link href={`/productos/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{r.name}</span>
                      {r.category && <Badge variant="secondary">{r.category}</Badge>}
                      {r.isLoss && <Badge variant="destructive">Pérdida</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Costo <Money value={r.cost} />
                      {r.margin && <> · margen {formatPercent(r.margin, 0)}</>}
                      {r.takeHome && (
                        <>
                          {" "}
                          · te queda <Money value={r.takeHome} />
                        </>
                      )}
                      {r.error && <span className="text-destructive"> · {r.error}</span>}
                    </p>
                  </div>
                  {r.price && (
                    <div className="text-right">
                      <Money value={r.price} className="font-semibold" />
                      <p className="text-xs text-muted-foreground">{r.channelName}</p>
                    </div>
                  )}
                </Link>
                <ProductRowActions id={r.id} name={r.name} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-150",
        active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}
