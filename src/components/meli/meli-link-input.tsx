"use client";

import { useState } from "react";
import { LinkIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MeliErrorAlert } from "./meli-error-alert";
import { fetchMeliItem, MeliClientError } from "@/lib/meli/client-api";
import { parseMeliRef } from "@/lib/meli/parse-url";
import type { MeliListing } from "@/lib/meli/types";

/** Pegar un link de ML → trae título y precio de /items/{id}. */
export function MeliLinkInput({ onResult }: { onResult: (listing: MeliListing, url: string) => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MeliClientError | null>(null);
  const looksValid = parseMeliRef(value) !== null;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { item } = await fetchMeliItem(value);
      onResult(item, value.trim());
      setValue("");
    } catch (e) {
      setError(e instanceof MeliClientError ? e : new MeliClientError("UNKNOWN", "Error inesperado"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://articulo.mercadolibre.com.ar/MLA-..."
          aria-label="Link de Mercado Libre"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (looksValid) void load();
            }
          }}
        />
        <Button type="button" variant="secondary" disabled={!looksValid || loading} onClick={load}>
          {loading ? <Loader2Icon className="animate-spin" /> : <LinkIcon />}
          Traer
        </Button>
      </div>
      {value && !looksValid && (
        <p className="text-xs text-muted-foreground">No vemos un ID tipo MLA-123456789 en ese link.</p>
      )}
      {error && <MeliErrorAlert error={error} />}
    </div>
  );
}
