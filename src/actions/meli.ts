"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { meliAppConfigSchema } from "@/lib/schemas";
import { ok, zodFail, type ActionResult } from "@/lib/action-result";

/** Guarda App ID / Secret Key de la app de ML (quedan en el servidor, nunca vuelven al navegador). */
export async function saveMeliAppConfig(input: unknown): Promise<ActionResult> {
  const parsed = meliAppConfigSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  await db.$transaction([
    db.meliAppConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...parsed.data },
      update: parsed.data,
    }),
    // Un token de otra app ya no sirve.
    db.meliToken.deleteMany(),
    db.meliCache.deleteMany(),
  ]);
  revalidatePath("/ajustes");
  return ok(undefined, "Datos guardados. Ahora tocá “Conectar con Mercado Libre”.");
}

export async function removeMeliAppConfig(): Promise<ActionResult> {
  await db.$transaction([db.meliAppConfig.deleteMany(), db.meliToken.deleteMany(), db.meliCache.deleteMany()]);
  revalidatePath("/ajustes");
  return ok(undefined, "Datos de Mercado Libre borrados");
}
