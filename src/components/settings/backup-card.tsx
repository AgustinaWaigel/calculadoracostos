"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { importBackup, importSuppliesCsv } from "@/actions/backup";

export function BackupCard() {
  const router = useRouter();
  const jsonRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [pendingJson, setPendingJson] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function restore() {
    if (!pendingJson) return;
    setBusy(true);
    const res = await importBackup(pendingJson);
    setBusy(false);
    setPendingJson(null);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup de datos</CardTitle>
        <CardDescription>Exportá todo para guardarlo o pasarlo a otra compu.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/backup?format=json" download>
              <DownloadIcon /> Backup completo (JSON)
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/backup?format=csv&table=insumos" download>
              <DownloadIcon /> Insumos (CSV)
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/backup?format=csv&table=productos" download>
              <DownloadIcon /> Productos (CSV)
            </a>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button variant="secondary" onClick={() => jsonRef.current?.click()} disabled={busy}>
            {busy ? <Loader2Icon className="animate-spin" /> : <UploadIcon />} Restaurar backup (JSON)
          </Button>
          <Button variant="secondary" onClick={() => csvRef.current?.click()} disabled={busy}>
            <UploadIcon /> Importar insumos (CSV)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-pretty">
          El CSV de insumos usa las columnas: nombre; tipo; categoria; unidad_compra; unidad_uso; cantidad_paquete;
          precio_paquete; proveedor; link. Si un insumo ya existe (mismo nombre) se actualiza su precio.
        </p>
        <input
          ref={jsonRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) setPendingJson(await file.text());
          }}
        />
        <input
          ref={csvRef}
          type="file"
          accept="text/csv,.csv"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            const res = await importSuppliesCsv(await file.text());
            setBusy(false);
            if (res.ok) {
              toast.success(res.message);
              res.data.errors.slice(0, 3).forEach((err) => toast.warning(err));
              router.refresh();
            } else toast.error(res.error);
          }}
        />
        <AlertDialog open={pendingJson !== null} onOpenChange={(o) => !o && setPendingJson(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Restaurar este backup?</AlertDialogTitle>
              <AlertDialogDescription>
                Se van a reemplazar <b>todos</b> los datos actuales por los del archivo. Te conviene descargar un
                backup antes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={restore}>Restaurar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
