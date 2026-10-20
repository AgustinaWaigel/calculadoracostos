import "server-only";
import { db } from "@/lib/db";

export const MELI_CACHE_TTL_MS = 30 * 60 * 1000;

/** Cache en la base (sobrevive reinicios). Devuelve null si no hay o venció. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const row = await db.meliCache.findUnique({ where: { key } });
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.meliCache.delete({ where: { key } }).catch(() => undefined);
    return null;
  }
  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlMs = MELI_CACHE_TTL_MS): Promise<void> {
  const data = { payload: JSON.stringify(value), expiresAt: new Date(Date.now() + ttlMs) };
  await db.meliCache.upsert({ where: { key }, create: { key, ...data }, update: data });
  // Limpieza oportunista de entradas vencidas.
  if (Math.random() < 0.1) {
    await db.meliCache.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
  }
}
