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
          <div className="grid gap-3 text-pretty">
            <p className="text-muted-foreground">
              Mercado Libre solo deja buscar precios a aplicaciones registradas. Se configura una sola vez (unos 10
              minutos) y después buscás precios de tinta, papel o lo que sea desde la app.
            </p>
            <ol className="grid list-decimal gap-1.5 pl-5">
              <li>
                Entrá a{" "}
                <a
                  href="https://developers.mercadolibre.com.ar/devcenter"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline"
                >
                  developers.mercadolibre.com.ar
                </a>{" "}
                con tu cuenta de Mercado Libre y tocá <b>Crear una aplicación</b>.
              </li>
              <li>
                Ponele cualquier nombre (ej: “Mi calculadora”). En <b>URI de redirect</b> pegá:{" "}
                <code className="rounded bg-muted px-1 break-all">https://localhost:3000/api/meli/callback</code>
              </li>
              <li>
                Cuando la guardes te muestra un <b>App ID</b> (número) y una <b>Secret Key</b>.
              </li>
              <li>
                Abrí el archivo <code className="rounded bg-muted px-1">.env</code> de la carpeta del proyecto y pegalos
                así:
                <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-xs">
{`MELI_CLIENT_ID="tu App ID"
MELI_CLIENT_SECRET="tu Secret Key"`}
                </pre>
              </li>
              <li>
                Cerrá la app y abrila con <code className="rounded bg-muted px-1">npm run dev:https</code> (Mercado
                Libre exige https). Volvé acá y vas a ver el botón <b>Conectar con Mercado Libre</b>.
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Mientras tanto, podés escribir los precios a mano o copiarlos de la publicación.
            </p>
          </div>
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
