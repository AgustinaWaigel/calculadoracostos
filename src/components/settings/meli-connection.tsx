"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon, LogOutIcon, StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MELI_ERROR_MESSAGES, type MeliErrorCode, type MeliStatus } from "@/lib/meli/types";

export function MeliConnection({ status }: { status: MeliStatus }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Resultado del OAuth (vuelve con ?meli=ok|error&code=...).
  useEffect(() => {
    const result = params.get("meli");
    if (!result) return;
    if (result === "ok") toast.success("¡Cuenta de Mercado Libre conectada!");
    else toast.error(MELI_ERROR_MESSAGES[(params.get("code") as MeliErrorCode) ?? "UNKNOWN"] ?? "Error");
    router.replace("/ajustes#mercado-libre");
  }, [params, router]);

  async function disconnect() {
    setLoading(true);
    await fetch("/api/meli/disconnect", { method: "POST" });
    setLoading(false);
    toast.success("Cuenta desconectada");
    router.refresh();
  }

  return (
    <Card id="mercado-libre">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StoreIcon className="size-4" /> Mercado Libre
        </CardTitle>
        <CardDescription>
          Para buscar precios y traer publicaciones. Las credenciales quedan en el servidor, nunca en tu navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {!status.configured ? (
          <p className="text-pretty text-muted-foreground">
            Falta configurar la app: creala en developers.mercadolibre.com.ar y cargá{" "}
            <code className="rounded bg-muted px-1">MELI_CLIENT_ID</code>,{" "}
            <code className="rounded bg-muted px-1">MELI_CLIENT_SECRET</code> y{" "}
            <code className="rounded bg-muted px-1">MELI_REDIRECT_URI</code> en el archivo <code>.env</code>. Los pasos
            están en el README. Mientras tanto podés cargar todos los precios a mano.
          </p>
        ) : status.connected ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2Icon /> Conectado{status.nickname ? ` como ${status.nickname}` : ""}
            </Badge>
            <span className="text-xs text-muted-foreground">El token se renueva solo.</span>
            <Button variant="ghost" size="sm" onClick={disconnect} disabled={loading} className="ml-auto">
              {loading ? <Loader2Icon className="animate-spin" /> : <LogOutIcon />}
              Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-muted-foreground">La app está configurada pero no conectaste tu cuenta.</p>
            <Button asChild>
              {/* Navegación completa: el OAuth redirige a mercadolibre.com.ar */}
              <a href="/api/meli/auth">Conectar con Mercado Libre</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
