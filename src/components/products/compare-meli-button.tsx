"use client";

import { StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeliSearchDialog } from "@/components/meli/meli-search-dialog";

/** Compara el precio sugerido con productos similares publicados en ML. */
export function CompareMeliButton({ query, myPrice }: { query: string; myPrice: string | null }) {
  return (
    <MeliSearchDialog
      title="Productos similares en Mercado Libre"
      defaultQuery={query}
      myPrice={myPrice}
      myPriceLabel="Tu precio en ML"
      trigger={
        <Button variant="outline">
          <StoreIcon /> Comparar con Mercado Libre
        </Button>
      }
    />
  );
}
