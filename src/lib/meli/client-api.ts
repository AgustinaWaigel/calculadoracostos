// Llamadas desde el navegador a nuestras Route Handlers (nunca directo a ML).
import {
  MELI_ERROR_MESSAGES,
  type MeliApiErrorBody,
  type MeliErrorCode,
  type MeliItemResponse,
  type MeliSearchResponse,
} from "./types";

export class MeliClientError extends Error {
  constructor(
    public code: MeliErrorCode,
    message: string,
  ) {
    super(message);
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new MeliClientError("NETWORK", MELI_ERROR_MESSAGES.NETWORK);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as MeliApiErrorBody | null;
    const code = body?.error.code ?? "UNKNOWN";
    throw new MeliClientError(code, body?.error.message ?? MELI_ERROR_MESSAGES[code]);
  }
  return (await res.json()) as T;
}

export function searchMeli(q: string, signal?: AbortSignal) {
  return getJson<MeliSearchResponse>(`/api/meli/search?q=${encodeURIComponent(q)}`, signal);
}

export function fetchMeliItem(urlOrId: string, signal?: AbortSignal) {
  return getJson<MeliItemResponse>(`/api/meli/item?url=${encodeURIComponent(urlOrId)}`, signal);
}
