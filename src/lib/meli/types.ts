// Tipos compartidos cliente/servidor de la integración con Mercado Libre.

export type MeliErrorCode =
  | "NOT_CONFIGURED" // faltan MELI_CLIENT_ID / SECRET en .env
  | "NOT_CONNECTED" // no hay token y ML exige autenticación
  | "UNAUTHORIZED" // token inválido/revocado
  | "FORBIDDEN" // ML bloquea el endpoint para esta app
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "INVALID_INPUT"
  | "NETWORK"
  | "UNKNOWN";

export interface MeliApiErrorBody {
  error: { code: MeliErrorCode; message: string };
}

export interface MeliListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  thumbnail: string | null;
  permalink: string | null;
  seller: string | null;
  freeShipping: boolean;
  soldQuantity: number | null;
  condition: string | null;
}

export interface MeliMarketStats {
  total: number;
  used: number;
  discarded: number;
  min: string;
  max: string;
  median: string;
  average: string;
}

export interface MeliSearchResponse {
  query: string;
  /** "search" = buscador de publicaciones; "catalog" = catálogo de productos (fallback). */
  source: "search" | "catalog";
  results: MeliListing[];
  stats: MeliMarketStats | null;
  cached: boolean;
}

export interface MeliItemResponse {
  item: MeliListing;
  cached: boolean;
}

export interface MeliStatus {
  configured: boolean;
  connected: boolean;
  nickname: string | null;
  expiresAt: string | null;
}

export const MELI_ERROR_MESSAGES: Record<MeliErrorCode, string> = {
  NOT_CONFIGURED:
    "Para buscar precios, primero hay que conectar la app con Mercado Libre (se hace una sola vez). Los pasos están en Ajustes → Mercado Libre. Mientras tanto, podés escribir el precio a mano.",
  NOT_CONNECTED:
    "Mercado Libre pide iniciar sesión para esta consulta. Conectá tu cuenta en Ajustes → Mercado Libre, o cargá el precio a mano.",
  UNAUTHORIZED: "La sesión con Mercado Libre venció o fue revocada. Volvé a conectar tu cuenta en Ajustes.",
  FORBIDDEN:
    "Mercado Libre no habilita esta consulta para tu aplicación. Probá pegando el link de la publicación o cargá el precio a mano.",
  NOT_FOUND: "No encontramos esa publicación en Mercado Libre.",
  RATE_LIMIT: "Mercado Libre está limitando las consultas. Esperá un minuto y probá de nuevo.",
  INVALID_INPUT: "Revisá lo que ingresaste.",
  NETWORK: "No pudimos comunicarnos con Mercado Libre. Revisá tu conexión y probá de nuevo.",
  UNKNOWN: "Mercado Libre respondió con un error inesperado. Podés cargar el precio a mano.",
};
