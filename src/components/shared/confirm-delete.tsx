"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export function ConfirmDelete({
  title,
  description,
  onConfirm,
  label,
  onDone,
}: {
  title: string;
  description?: string;
  onConfirm: () => Promise<ActionResult<unknown>>;
  /** Texto del botón; si no se pasa, se muestra solo el ícono. */
  label?: string;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size={label ? "sm" : "icon-sm"} aria-label={label ?? "Eliminar"} disabled={pending}>
          <Trash2Icon />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? "Esta acción no se puede deshacer."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const res = await onConfirm();
                if (res.ok) {
                  toast.success(res.message ?? "Eliminado");
                  onDone?.();
                } else toast.error(res.error);
              })
            }
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
