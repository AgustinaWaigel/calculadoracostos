"use client";

import { useRouter } from "next/navigation";
import { CopyIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useAction } from "@/components/shared/use-action";
import { deleteProduct, duplicateProduct } from "@/actions/products";

export function ProductRowActions({
  id,
  name,
  showLabels = false,
  redirectAfterDelete,
}: {
  id: string;
  name: string;
  showLabels?: boolean;
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const dup = useAction();
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={showLabels ? "outline" : "ghost"}
        size={showLabels ? "default" : "icon-sm"}
        aria-label={`Duplicar ${name}`}
        disabled={dup.pending}
        onClick={() => dup.run(() => duplicateProduct(id), (d) => router.push(`/productos/${d.id}`))}
      >
        {dup.pending ? <Loader2Icon className="animate-spin" /> : <CopyIcon />}
        {showLabels && "Duplicar"}
      </Button>
      <ConfirmDelete
        title={`¿Eliminar “${name}”?`}
        description="Los presupuestos que ya lo incluyen conservan el precio y la descripción."
        label={showLabels ? "Eliminar" : undefined}
        onConfirm={() => deleteProduct(id)}
        onDone={() => (redirectAfterDelete ? router.push(redirectAfterDelete) : router.refresh())}
      />
    </div>
  );
}
