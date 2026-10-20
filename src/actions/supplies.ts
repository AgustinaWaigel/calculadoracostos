"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { D } from "@/lib/money";
import { supplySchema } from "@/lib/schemas";
import { errorMessage, fail, ok, zodFail, type ActionResult } from "@/lib/action-result";
import { getReferenceUsdRate } from "@/lib/dolar";
import { getListing } from "@/lib/meli/api";
import { MeliError } from "@/lib/meli/errors";

function revalidateSupplies(id?: string) {
  revalidatePath("/insumos");
  if (id) revalidatePath(`/insumos/${id}`);
  revalidatePath("/productos", "layout");
  revalidatePath("/");
}

export async function saveSupply(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = supplySchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { id, priceSource, ...data } = parsed.data;

  try {
    const usdRate = await getReferenceUsdRate();
    if (!id) {
      const created = await db.supply.create({
        data: {
          ...data,
          priceUpdatedAt: new Date(),
          priceHistory: {
            create: { packPrice: data.packPrice, packQuantity: data.packQuantity, source: priceSource, usdRate },
          },
        },
      });
      revalidateSupplies(created.id);
      return ok({ id: created.id }, "Insumo creado");
    }

    const current = await db.supply.findUnique({ where: { id } });
    if (!current) return fail("El insumo no existe");
    const priceChanged =
      !D(current.packPrice).eq(data.packPrice) || !D(current.packQuantity).eq(data.packQuantity);

    await db.supply.update({
      where: { id },
      data: {
        ...data,
        ...(priceChanged && {
          priceUpdatedAt: new Date(),
          priceHistory: {
            create: { packPrice: data.packPrice, packQuantity: data.packQuantity, source: priceSource, usdRate },
          },
        }),
      },
    });
    revalidateSupplies(id);
    return ok({ id }, priceChanged ? "Insumo actualizado (precio registrado en el historial)" : "Insumo actualizado");
  } catch (e) {
    return fail(errorMessage(e));
  }
}

/** Confirma que el precio sigue vigente sin cambiarlo (resetea la alerta de 30 días). */
export async function confirmSupplyPrice(id: string): Promise<ActionResult> {
  await db.supply.update({ where: { id }, data: { priceUpdatedAt: new Date() } });
  revalidateSupplies(id);
  return ok(undefined, "Precio confirmado");
}

export async function deleteSupply(id: string): Promise<ActionResult> {
  const usedIn = await db.productSupply.findMany({
    where: { supplyId: id },
    include: { product: { select: { name: true } } },
  });
  if (usedIn.length > 0) {
    const names = usedIn.map((u) => u.product.name).join(", ");
    return fail(`No se puede borrar: lo usan estos productos: ${names}`);
  }
  await db.supply.delete({ where: { id } });
  revalidateSupplies();
  return ok(undefined, "Insumo eliminado");
}

export async function deleteSupplyHistoryEntry(entryId: string): Promise<ActionResult> {
  const entry = await db.supplyPriceHistory.delete({ where: { id: entryId } });
  revalidateSupplies(entry.supplyId);
  return ok(undefined, "Registro eliminado");
}

/** "Actualizar precio desde ML" para insumos vinculados a una publicación. */
export async function refreshSupplyFromMeli(
  id: string,
): Promise<ActionResult<{ oldPrice: string; newPrice: string; changed: boolean }>> {
  const supply = await db.supply.findUnique({ where: { id } });
  if (!supply) return fail("El insumo no existe");
  const ref = supply.meliItemId ?? supply.url;
  if (!ref) return fail("Este insumo no está vinculado a una publicación de Mercado Libre");

  try {
    const { item } = await getListing(ref);
    const newPrice = D(item.price);
    const changed = !D(supply.packPrice).eq(newPrice);
    const usdRate = await getReferenceUsdRate();
    await db.supply.update({
      where: { id },
      data: {
        packPrice: newPrice.toString(),
        meliItemId: item.id,
        priceUpdatedAt: new Date(),
        ...(changed && {
          priceHistory: {
            create: {
              packPrice: newPrice.toString(),
              packQuantity: supply.packQuantity,
              source: "MELI_REFRESH",
              usdRate,
            },
          },
        }),
      },
    });
    revalidateSupplies(id);
    return ok(
      { oldPrice: supply.packPrice.toString(), newPrice: newPrice.toString(), changed },
      changed ? "Precio actualizado desde Mercado Libre" : "El precio en Mercado Libre sigue igual",
    );
  } catch (e) {
    return fail(e instanceof MeliError ? e.message : errorMessage(e));
  }
}
