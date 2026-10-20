"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLinkIcon, SearchIcon, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMoneyFormatter } from "@/components/shared/money";
import { MarketStats } from "./market-stats";
import { MeliErrorAlert } from "./meli-error-alert";
import { MeliClientError, searchMeli } from "@/lib/meli/client-api";
import type { MeliListing, MeliSearchResponse } from "@/lib/meli/types";
import { formatNumber } from "@/lib/money";

export function MeliSearchDialog({
  defaultQuery = "",
  myPrice,
  myPriceLabel,
  onPick,
  trigger,
  title = "Buscar en Mercado Libre",
}: {
  defaultQuery?: string;
  myPrice?: string | null;
  myPriceLabel?: string;
  /** Si no se pasa, el diálogo es solo de consulta (comparar precios). */
  onPick?: (listing: MeliListing) => void;
  trigger: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [data, setData] = useState<MeliSearchResponse | null>(null);
  const [error, setError] = useState<MeliClientError | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fmt = useMoneyFormatter();

  async function run(q: string) {
    if (q.trim().length < 2) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      setData(await searchMeli(q, ctrl.signal));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setData(null);
      setError(e instanceof MeliClientError ? e : new MeliClientError("UNKNOWN", "Error inesperado"));
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setQuery(defaultQuery);
      if (defaultQuery.trim().length >= 2) void run(defaultQuery);
    } else {
      abortRef.current?.abort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Resultados de mercadolibre.com.ar. {onPick ? "Elegí uno para usar su precio." : ""}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(query);
          }}
        >
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: pouch A4 100 unidades"
            aria-label="Buscar en Mercado Libre"
          />
          <Button type="submit" disabled={loading || query.trim().length < 2}>
            <SearchIcon /> Buscar
          </Button>
        </form>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {error && <MeliErrorAlert error={error} />}

          {loading && (
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {!loading && data && (
            <div className="grid gap-3">
              {data.stats && <MarketStats stats={data.stats} myPrice={myPrice} myPriceLabel={myPriceLabel} />}
              {data.source === "catalog" && (
                <p className="text-xs text-muted-foreground">
                  El buscador de publicaciones no está disponible para tu app: mostramos productos del catálogo de
                  ML con el precio de la publicación ganadora.
                </p>
              )}
              {data.results.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No encontramos resultados para “{data.query}”.
                </p>
              )}
              <ul className="grid gap-2">
                {data.results.map((r) => (
                  <li key={r.id} className="flex gap-3 rounded-lg border p-2">
                    {r.thumbnail ? (
                      // Las fotos vienen de mlstatic: usamos <img> para no configurar dominios remotos.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.thumbnail}
                        alt=""
                        loading="lazy"
                        className="size-16 shrink-0 rounded-md bg-white object-contain"
                      />
                    ) : (
                      <div className="size-16 shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-snug">{r.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="text-base font-semibold text-foreground tabular-nums">
                          {r.currency === "ARS" ? fmt(r.price) : `${r.currency} ${formatNumber(r.price)}`}
                        </span>
                        {r.freeShipping && (
                          <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-400">
                            <TruckIcon /> Envío gratis
                          </Badge>
                        )}
                        {r.seller && <span className="truncate">{r.seller}</span>}
                        {r.soldQuantity !== null && <span>{formatNumber(r.soldQuantity, 0)} vendidos</span>}
                        {r.permalink && (
                          <a
                            href={r.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 hover:text-foreground"
                          >
                            Ver <ExternalLinkIcon className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    {onPick && r.currency === "ARS" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="self-center"
                        onClick={() => {
                          onPick(r);
                          setOpen(false);
                        }}
                      >
                        Usar
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {data.cached && (
                <p className="text-center text-xs text-muted-foreground">Resultados guardados (hasta 30 min).</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
