export type MeliRef = { kind: "item"; id: string } | { kind: "product"; id: string };

/** Normaliza "MLA-123456" / "mla123456" → "MLA123456". */
function normalize(raw: string): string {
  return raw.toUpperCase().replace("-", "");
}

/**
 * Extrae el ID de una publicación o producto de catálogo de Mercado Libre.
 * Soporta:
 *  - https://articulo.mercadolibre.com.ar/MLA-1234567890-titulo-_JM  → item
 *  - https://www.mercadolibre.com.ar/titulo/p/MLA12345678            → product (catálogo)
 *  - ...?pdp_filters=item_id:MLA1234567890 / ?wid=MLA123 / #...item_id=MLA123 → item
 *  - "MLA1234567890" pegado directo                                   → item
 */
export function parseMeliRef(input: string): MeliRef | null {
  const text = input.trim();
  if (!text) return null;

  const bare = text.match(/^MLA-?\d{5,}$/i);
  if (bare) return { kind: "item", id: normalize(bare[0]) };

  // Si el link de catálogo trae el ítem ganador explícito, preferimos el ítem.
  const explicitItem = text.match(/(?:item_id[:=]|wid=)(MLA-?\d{5,})/i);
  if (explicitItem) return { kind: "item", id: normalize(explicitItem[1]) };

  const product = text.match(/\/p\/(MLA-?\d{5,})/i);
  if (product) return { kind: "product", id: normalize(product[1]) };

  const item = text.match(/(MLA-?\d{5,})/i);
  if (item) return { kind: "item", id: normalize(item[1]) };

  return null;
}
