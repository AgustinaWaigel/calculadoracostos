import { marketStats } from "@/lib/calc/market-stats";
import type { MeliListing, MeliMarketStats } from "./types";

// Formas (parciales) de las respuestas de la API de ML que usamos.
export interface RawSearchResult {
  id: string;
  title: string;
  price: number | null;
  currency_id?: string;
  thumbnail?: string;
  permalink?: string;
  seller?: { id?: number; nickname?: string };
  shipping?: { free_shipping?: boolean };
  sold_quantity?: number;
  condition?: string;
}

export interface RawItem {
  id: string;
  title: string;
  price: number | null;
  currency_id?: string;
  thumbnail?: string;
  secure_thumbnail?: string;
  pictures?: { secure_url?: string; url?: string }[];
  permalink?: string;
  seller_id?: number;
  shipping?: { free_shipping?: boolean };
  sold_quantity?: number;
  condition?: string;
}

export interface RawProduct {
  id: string;
  name: string;
  permalink?: string;
  pictures?: { url?: string }[];
  buy_box_winner?: {
    item_id: string;
    price: number;
    currency_id?: string;
    seller_id?: number;
    shipping?: { free_shipping?: boolean };
    condition?: string;
  } | null;
}

export interface RawProductItem {
  item_id: string;
  price: number;
  currency_id?: string;
  seller_id?: number;
  shipping?: { free_shipping?: boolean };
  condition?: string;
}

const https = (url?: string | null) => (url ? url.replace(/^http:\/\//, "https://") : null);

export function normalizeSearchResult(r: RawSearchResult): MeliListing | null {
  if (r.price == null) return null;
  return {
    id: r.id,
    title: r.title,
    price: r.price,
    currency: r.currency_id ?? "ARS",
    thumbnail: https(r.thumbnail),
    permalink: r.permalink ?? null,
    seller: r.seller?.nickname ?? (r.seller?.id ? `Vendedor #${r.seller.id}` : null),
    freeShipping: !!r.shipping?.free_shipping,
    soldQuantity: typeof r.sold_quantity === "number" ? r.sold_quantity : null,
    condition: r.condition ?? null,
  };
}

export function normalizeItem(r: RawItem): MeliListing | null {
  if (r.price == null) return null;
  return {
    id: r.id,
    title: r.title,
    price: r.price,
    currency: r.currency_id ?? "ARS",
    thumbnail: https(r.secure_thumbnail ?? r.thumbnail ?? r.pictures?.[0]?.secure_url ?? r.pictures?.[0]?.url),
    permalink: r.permalink ?? null,
    seller: r.seller_id ? `Vendedor #${r.seller_id}` : null,
    freeShipping: !!r.shipping?.free_shipping,
    soldQuantity: typeof r.sold_quantity === "number" ? r.sold_quantity : null,
    condition: r.condition ?? null,
  };
}

export function normalizeProduct(p: RawProduct, fallbackItem?: RawProductItem | null): MeliListing | null {
  const winner = p.buy_box_winner ?? fallbackItem ?? null;
  if (!winner) return null;
  return {
    id: winner.item_id,
    title: p.name,
    price: winner.price,
    currency: winner.currency_id ?? "ARS",
    thumbnail: https(p.pictures?.[0]?.url),
    permalink: p.permalink ?? `https://www.mercadolibre.com.ar/p/${p.id}`,
    seller: winner.seller_id ? `Vendedor #${winner.seller_id}` : null,
    freeShipping: !!winner.shipping?.free_shipping,
    soldQuantity: null,
    condition: winner.condition ?? null,
  };
}

/** Estadísticas serializables (strings) sobre los precios en ARS. */
export function listingStats(listings: MeliListing[]): MeliMarketStats | null {
  const stats = marketStats(listings.filter((l) => l.currency === "ARS").map((l) => l.price));
  if (!stats) return null;
  return {
    total: stats.total,
    used: stats.used,
    discarded: stats.discarded,
    min: stats.min.toString(),
    max: stats.max.toString(),
    median: stats.median.toString(),
    average: stats.average.toDecimalPlaces(2).toString(),
  };
}
