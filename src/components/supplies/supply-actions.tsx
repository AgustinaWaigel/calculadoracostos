"use client";

import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useAction } from "@/components/shared/use-action";
import { confirmSupplyPrice, deleteSupply, refreshSupplyFromMeli } from "@/actions/supplies";

export function SupplyActions({ id, linked, stale }: { id: string; linked: boolean; stale: boolean }) {
  const router = useRouter();
  const refresh = useAction();
  const confirm = useAction();

  return (
    <>
      {linked && (
        <Button
          variant="outline"
          disabled={refresh.pending}
          onClick={() => refresh.run(() => refreshSupplyFromMeli(id), () => router.refresh())}
        >
          {refresh.pending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
          Actualizar precio desde ML
        </Button>
      )}
      {stale && (
        <Button
          variant="outline"
          disabled={confirm.pending}
          onClick={() => confirm.run(() => confirmSupplyPrice(id), () => router.refresh())}
        >
          <CheckIcon /> El precio sigue igual
        </Button>
      )}
      <ConfirmDelete
        title="¿Eliminar este insumo?"
        description="Se borra también su historial de precios. Si algún producto lo usa, no se puede eliminar."
        label="Eliminar"
        onConfirm={() => deleteSupply(id)}
        onDone={() => router.push("/insumos")}
      />
    </>
  );
}
