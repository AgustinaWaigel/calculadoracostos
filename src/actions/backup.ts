"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseCsv } from "@/lib/csv";
import { D } from "@/lib/money";
import { supplySchema } from "@/lib/schemas";
import { errorMessage, fail, ok, type ActionResult } from "@/lib/action-result";
import { BACKUP_VERSION } from "@/server/backup";

const rows = z.array(z.record(z.string(), z.unknown()));
const backupSchema = z.object({
  app: z.literal("calculadora-costos"),
  version: z.number().max(BACKUP_VERSION),
  data: z.object({
    business: rows,
    supplies: rows,
    supplyPriceHistory: rows,
    laborProfiles: rows,
    marketRates: rows,
    fixedCosts: rows,
    machines: rows,
    products: rows,
    productSupplies: rows,
    productLabor: rows,
    productMachines: rows,
    salesChannels: rows,
    volumeTiers: rows,
    quotes: rows,
    quoteItems: rows,
    // Opcional: los backups anteriores a la calculadora de impresión no la traen.
    printInks: rows.default([]),
    investmentMovements: rows.default([]),
  }),
});

/** Restaura un backup JSON completo (reemplaza todos los datos). */
export async function importBackup(json: string): Promise<ActionResult<{ counts: Record<string, number> }>> {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return fail("El archivo no es un JSON válido");
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) return fail("El archivo no parece un backup de esta app");
  const d = parsed.data.data;

  // Prisma acepta strings para Decimal y fechas ISO: los datos se insertan tal cual.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const as = (r: Record<string, unknown>[]) => r as any;
  try {
    await db.$transaction([
      db.quoteItem.deleteMany(),
      db.quote.deleteMany(),
      db.productSupply.deleteMany(),
      db.productLabor.deleteMany(),
      db.productMachine.deleteMany(),
      db.product.deleteMany(),
      db.supplyPriceHistory.deleteMany(),
      db.supply.deleteMany(),
      db.laborProfile.deleteMany(),
      db.marketRate.deleteMany(),
      db.fixedCost.deleteMany(),
      db.machine.deleteMany(),
      db.salesChannel.deleteMany(),
      db.volumeTier.deleteMany(),
      db.business.deleteMany(),
      db.printInk.deleteMany(),
      db.investmentMovement.deleteMany(),
      db.business.createMany({ data: as(d.business) }),
      db.supply.createMany({ data: as(d.supplies) }),
      db.supplyPriceHistory.createMany({ data: as(d.supplyPriceHistory) }),
      db.laborProfile.createMany({ data: as(d.laborProfiles) }),
      db.marketRate.createMany({ data: as(d.marketRates) }),
      db.fixedCost.createMany({ data: as(d.fixedCosts) }),
      db.machine.createMany({ data: as(d.machines) }),
      db.product.createMany({ data: as(d.products) }),
      db.productSupply.createMany({ data: as(d.productSupplies) }),
      db.productLabor.createMany({ data: as(d.productLabor) }),
      db.productMachine.createMany({ data: as(d.productMachines) }),
      db.salesChannel.createMany({ data: as(d.salesChannels) }),
      db.volumeTier.createMany({ data: as(d.volumeTiers) }),
      db.quote.createMany({ data: as(d.quotes) }),
      db.quoteItem.createMany({ data: as(d.quoteItems) }),
      db.printInk.createMany({ data: as(d.printInks) }),
      db.investmentMovement.createMany({ data: as(d.investmentMovements) }),
    ]);
  } catch (e) {
    return fail(`No se pudo restaurar: ${errorMessage(e).slice(0, 200)}`);
  }
  revalidatePath("/", "layout");
  const counts = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.length]));
  return ok({ counts }, "Backup restaurado");
}

/**
 * Importa insumos desde CSV (mismas columnas que la exportación).
 * Si ya existe un insumo con el mismo nombre, actualiza su precio (y registra el historial).
 */
export async function importSuppliesCsv(
  text: string,
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  const records = parseCsv(text);
  if (records.length === 0) return fail("El CSV está vacío o no tiene encabezados");

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [i, r] of records.entries()) {
    const parsed = supplySchema.safeParse({
      name: r.nombre ?? r.name,
      kind: (r.tipo ?? "").toLowerCase().startsWith("serv") ? "SERVICE" : "MATERIAL",
      category: r.categoria,
      purchaseUnit: r.unidad_compra || "unidad",
      usageUnit: r.unidad_uso || "unidad",
      packQuantity: r.cantidad_paquete || "1",
      packPrice: r.precio_paquete ?? r.precio,
      supplier: r.proveedor,
      url: r.link,
      priceSource: "IMPORT",
    });
    if (!parsed.success) {
      errors.push(`Fila ${i + 2}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    const { priceSource, id: _id, ...data } = parsed.data;
    void _id;
    const existing = await db.supply.findFirst({ where: { name: data.name } });
    if (existing) {
      const changed = !D(existing.packPrice).eq(data.packPrice) || !D(existing.packQuantity).eq(data.packQuantity);
      await db.supply.update({
        where: { id: existing.id },
        data: {
          ...data,
          ...(changed && {
            priceUpdatedAt: new Date(),
            priceHistory: { create: { packPrice: data.packPrice, packQuantity: data.packQuantity, source: priceSource } },
          }),
        },
      });
      updated++;
    } else {
      await db.supply.create({
        data: {
          ...data,
          priceHistory: { create: { packPrice: data.packPrice, packQuantity: data.packQuantity, source: priceSource } },
        },
      });
      created++;
    }
  }
  revalidatePath("/", "layout");
  return ok(
    { created, updated, errors },
    `Importados: ${created} nuevos, ${updated} actualizados${errors.length ? `, ${errors.length} con errores` : ""}`,
  );
}
