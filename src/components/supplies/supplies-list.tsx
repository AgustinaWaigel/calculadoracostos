"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangleIcon, SearchIcon, StoreIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { formatNumber } from "@/lib/money";

export interface SupplyRow {
  id: string;
  name: string;
  kind: "MATERIAL" | "SERVICE";
  category: string | null;
  purchaseUnit: string;
  usageUnit: string;
  packQuantity: string;
  packPrice: string;
  unitCost: string;
  supplier: string | null;
  linkedToMeli: boolean;
  daysSinceUpdate: number;
  stale: boolean;
  usedInCount: number;
}

export function SuppliesList({ rows }: { rows: SupplyRow[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))].sort(),
    [rows],
  );
  const filtered = rows.filter(
    (r) =>
      (!category || r.category === category) &&
      (!q || `${r.name} ${r.supplier ?? ""} ${r.category ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar insumo…" className="pl-8" />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Badge
              asChild
              variant={category === null ? "default" : "outline"}
              className="cursor-pointer"
            >
              <button type="button" onClick={() => setCategory(null)}>
                Todas
              </button>
            </Badge>
            {categories.map((c) => (
              <Badge key={c} asChild variant={category === c ? "default" : "outline"} className="cursor-pointer">
                <button type="button" onClick={() => setCategory(c === category ? null : c)}>
                  {c}
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <ul className="divide-y">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                href={`/insumos/${r.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{r.name}</span>
                    {r.kind === "SERVICE" && <Badge variant="secondary">Servicio</Badge>}
                    {r.linkedToMeli && (
                      <Badge variant="outline" className="gap-1">
                        <StoreIcon /> ML
                      </Badge>
                    )}
                    {r.stale && (
                      <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                        <AlertTriangleIcon /> {r.daysSinceUpdate} días sin actualizar
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <Money value={r.packPrice} /> por {r.purchaseUnit}
                    {r.packQuantity !== "1" && ` de ${formatNumber(r.packQuantity)} ${r.usageUnit}`}
                    {r.category && ` · ${r.category}`}
                    {r.usedInCount > 0 && ` · en ${r.usedInCount} producto${r.usedInCount > 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="text-right">
                  <Money value={r.unitCost} className="font-semibold" />
                  <p className="text-xs text-muted-foreground">por {r.usageUnit}</p>
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nada coincide con la búsqueda.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
