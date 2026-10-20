import "server-only";
import { MeliError, statusToMeliCode } from "./errors";
import { cacheGet, cacheSet } from "./cache";
import { getMeliConfig, getValidAccessToken, invalidateAccessToken } from "./oauth";
import {
  listingStats,
  normalizeItem,
  normalizeProduct,
  normalizeSearchResult,
  type RawItem,
  type RawProduct,
  type RawProductItem,
  type RawSearchResult,
} from "./normalize";
import { parseMeliRef } from "./parse-url";
import type { MeliItemResponse, MeliListing, MeliSearchResponse } from "./types";

const API = "https://api.mercadolibre.com";

/**
 * GET a la API de ML con el token del servidor (si hay). Ante un 401 con token,
 * fuerza un refresh y reintenta una vez. Nunca expone el token al cliente.
 */
async function meliGet<T>(path: string, retried = false): Promise<T> {
  const token = await getValidAccessToken();
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new MeliError("NETWORK");
  }

  if (res.status === 401 && token && !retried) {
    await invalidateAccessToken();
    return meliGet<T>(path, true);
  }
  if (!res.ok) {
    const code = statusToMeliCode(res.status, !!token);
    // Si la app ni siquiera está configurada, el mensaje útil es ese.
    if (code === "NOT_CONNECTED" && !getMeliConfig()) throw new MeliError("NOT_CONFIGURED");
    throw new MeliError(code, undefined, res.status);
  }
  return (await res.json()) as T;
}

const normalizeQuery = (q: string) => q.trim().toLowerCase().replace(/\s+/g, " ");

/** Busca publicaciones en MLA. Si el buscador está bloqueado, cae al catálogo de productos. */
export async function searchListings(rawQuery: string): Promise<MeliSearchResponse> {
  const query = normalizeQuery(rawQuery);
  if (query.length < 2) throw new MeliError("INVALID_INPUT", "Escribí al menos 2 letras para buscar.");

  const key = `search:${query}`;
  const cached = await cacheGet<MeliSearchResponse>(key);
  if (cached) return { ...cached, cached: true };

  let response: MeliSearchResponse;
  try {
    const data = await meliGet<{ results: RawSearchResult[] }>(
      `/sites/MLA/search?q=${encodeURIComponent(query)}&limit=50`,
    );
    const results = data.results.map(normalizeSearchResult).filter((r): r is MeliListing => r !== null);
    response = { query, source: "search", results, stats: listingStats(results), cached: false };
  } catch (e) {
    // El buscador público de ML devuelve 403 a muchas apps: probamos con el catálogo.
    if (!(e instanceof MeliError) || !["FORBIDDEN", "UNAUTHORIZED"].includes(e.code)) throw e;
    const results = await searchCatalog(query);
    response = { query, source: "catalog", results, stats: listingStats(results), cached: false };
  }

  await cacheSet(key, response);
  return response;
}

async function searchCatalog(query: string): Promise<MeliListing[]> {
  const data = await meliGet<{ results: RawProduct[] }>(
    `/products/search?status=active&site_id=MLA&q=${encodeURIComponent(query)}&limit=12`,
  );
  const listings = await Promise.all(
    data.results.map(async (p) => {
      if (p.buy_box_winner) return normalizeProduct(p);
      try {
        const items = await meliGet<{ results: RawProductItem[] }>(`/products/${p.id}/items?limit=5`);
        const cheapest = [...items.results].sort((a, b) => a.price - b.price)[0];
        return normalizeProduct(p, cheapest);
      } catch {
        return null;
      }
    }),
  );
  return listings.filter((l): l is MeliListing => l !== null);
}

/** Trae una publicación o producto de catálogo a partir de un link o ID. */
export async function getListing(input: string): Promise<MeliItemResponse> {
  const ref = parseMeliRef(input);
  if (!ref) {
    throw new MeliError(
      "INVALID_INPUT",
      "No encontramos un ID de Mercado Libre en ese link. Tiene que ser algo como MLA-1234567890.",
    );
  }
  const key = `${ref.kind}:${ref.id}`;
  const cached = await cacheGet<MeliListing>(key);
  if (cached) return { item: cached, cached: true };

  let item: MeliListing | null;
  if (ref.kind === "item") {
    item = normalizeItem(await meliGet<RawItem>(`/items/${ref.id}`));
  } else {
    const product = await meliGet<RawProduct>(`/products/${ref.id}`);
    let fallback: RawProductItem | null = null;
    if (!product.buy_box_winner) {
      const items = await meliGet<{ results: RawProductItem[] }>(`/products/${ref.id}/items?limit=5`).catch(
        () => ({ results: [] as RawProductItem[] }),
      );
      fallback = [...items.results].sort((a, b) => a.price - b.price)[0] ?? null;
    }
    item = normalizeProduct(product, fallback);
  }
  if (!item) throw new MeliError("NOT_FOUND", "La publicación no tiene precio disponible (¿está pausada?).");

  await cacheSet(key, item);
  return { item, cached: false };
}
