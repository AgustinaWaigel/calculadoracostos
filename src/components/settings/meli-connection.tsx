"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  LogOutIcon,
  StoreIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/shared/ui-bits";
import { useAction } from "@/components/shared/use-action";
import { removeMeliAppConfig, saveMeliAppConfig } from "@/actions/meli";
import { meliAppConfigSchema, type MeliAppConfigInput } from "@/lib/schemas";
import { MELI_ERROR_MESSAGES, type MeliErrorCode, type MeliStatus } from "@/lib/meli/types";

function Step({ n, done, children }: { n: number; done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className={
          done
            ? "grid size-7 shrink-0 place-items-center rounded-full bg-tinta text-nube"
            : "grid size-7 shrink-0 place-items-center rounded-full bg-yellow-400 text-sm font-bold text-yellow-950"
        }
      >
        {done ? <CheckCircle2Icon className="size-4" /> : n}
      </span>
      <div className="grid min-w-0 flex-1 gap-2 pt-0.5">{children}</div>
    </li>
  );
}

export function MeliConnection({ status }: { status: MeliStatus }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ host: string; protocol: string } | null>(null);
  useEffect(() => setOrigin({ host: window.location.host, protocol: window.location.protocol }), []);

  // Resultado del OAuth (vuelve con ?meli=ok|error&code=...).
  useEffect(() => {
    const result = params.get("meli");
    if (!result) return;
    if (result === "ok") {
      toast.success("¡Listo! Mercado Libre quedó conectado.");
      setLastError(null);
    } else {
      setLastError(
        params.get("detail") ?? MELI_ERROR_MESSAGES[(params.get("code") as MeliErrorCode) ?? "UNKNOWN"] ?? "Error",
      );
    }
    router.replace("/ajustes#mercado-libre");
  }, [params, router]);

  // ML exige https: sugerimos la misma dirección de la app, pero con https.
  const suggestedRedirect = `https://${origin?.host ?? "localhost:3000"}/api/meli/callback`;

  const form = useForm<MeliAppConfigInput>({
    resolver: zodResolver(meliAppConfigSchema),
    values: { clientId: "", clientSecret: "", redirectUri: suggestedRedirect },
  });
  const save = useAction<MeliAppConfigInput>(form.setError);
  const remove = useAction();
  const redirect = form.watch("redirectUri");

  async function disconnect() {
    setLoading(true);
    await fetch("/api/meli/disconnect", { method: "POST" });
    setLoading(false);
    toast.success("Cuenta desconectada");
    router.refresh();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado");
    } catch {
      toast.error("No se pudo copiar: seleccionalo y copialo a mano");
    }
  }

  const needsHttps = origin?.protocol === "http:" && (status.redirectUri ?? redirect).startsWith("https://");

  return (
    <Card id="mercado-libre" className="border-yellow-400/50 bg-yellow-400/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-yellow-400 text-yellow-950">
            <StoreIcon className="size-4" />
          </span>
          Mercado Libre
          {status.connected && (
            <Badge className="ml-auto bg-tinta text-nube">
              <CheckCircle2Icon /> Conectado{status.nickname ? `: ${status.nickname}` : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        {lastError && (
          <div role="alert" className="flex gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-900 dark:text-red-200">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <div className="grid gap-1">
              <p className="font-medium">No se pudo conectar</p>
              <p className="break-words">{lastError}</p>
              {/redirect|uri/i.test(lastError) && (
                <p>
                  Revisá que en tu app de Mercado Libre la <b>URI de redirect</b> sea exactamente{" "}
                  <code className="rounded bg-background px-1 break-all">{status.redirectUri}</code> (sin espacios ni
                  barra al final).
                </p>
              )}
            </div>
          </div>
        )}
        {status.connected ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-muted-foreground">Ya podés buscar precios con la lupa en Insumos e Impresión.</p>
            <Button variant="ghost" size="sm" onClick={disconnect} disabled={loading} className="ml-auto">
              {loading ? <Loader2Icon className="animate-spin" /> : <LogOutIcon />}
              Desconectar
            </Button>
          </div>
        ) : (
          <ol className="grid gap-5">
            <Step n={1} done={status.configured}>
              <p className="font-medium">Creá una “aplicación” en Mercado Libre (es gratis)</p>
              {!status.configured && (
                <>
                  <p className="text-muted-foreground">
                    Entrá con tu usuario de Mercado Libre y tocá <b>Crear aplicación</b>. Nombre y descripción: lo que
                    quieras (ej: “Mi calculadora”).
                  </p>
                  <div>
                    <Button asChild variant="outline" size="sm">
                      <a href="https://developers.mercadolibre.com.ar/devcenter" target="_blank" rel="noreferrer">
                        Abrir Mercado Libre Developers <ExternalLinkIcon />
                      </a>
                    </Button>
                  </div>
                  <p className="text-muted-foreground">
                    Donde dice <b>URI de redirect</b>, pegá esta dirección:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md border bg-background px-2 py-1.5 text-xs">
                      {redirect}
                    </code>
                    <Button type="button" variant="secondary" size="sm" onClick={() => copy(redirect)}>
                      <CopyIcon /> Copiar
                    </Button>
                  </div>
                  <p className="text-muted-foreground">
                    En permisos elegí <b>Lectura</b>. Guardá la aplicación.
                  </p>
                </>
              )}
            </Step>

            <Step n={2} done={status.configured}>
              <p className="font-medium">Pegá acá los datos que te muestra</p>
              {status.configured ? (
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  {status.source === "env" ? "Cargados en el archivo .env." : "Guardados."}
                  {status.source === "app" && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      disabled={remove.pending}
                      onClick={() => remove.run(() => removeMeliAppConfig(), () => router.refresh())}
                    >
                      Cambiar
                    </Button>
                  )}
                </div>
              ) : (
                <form
                  className="grid gap-3"
                  onSubmit={form.handleSubmit((v) => save.run(() => saveMeliAppConfig(v), () => router.refresh()))}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="App ID" htmlFor="ml-id" error={form.formState.errors.clientId?.message}>
                      <Input id="ml-id" inputMode="numeric" placeholder="1234567890123456" autoComplete="off" {...form.register("clientId")} />
                    </Field>
                    <Field label="Secret Key" htmlFor="ml-secret" error={form.formState.errors.clientSecret?.message}>
                      <Input id="ml-secret" type="password" autoComplete="off" {...form.register("clientSecret")} />
                    </Field>
                  </div>
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Cambiar la dirección de redirect</summary>
                    <Field label="URI de redirect" htmlFor="ml-redirect" error={form.formState.errors.redirectUri?.message} className="mt-2">
                      <Input id="ml-redirect" {...form.register("redirectUri")} />
                    </Field>
                  </details>
                  <div>
                    <Button type="submit" disabled={save.pending}>
                      {save.pending && <Loader2Icon className="animate-spin" />}
                      Guardar
                    </Button>
                  </div>
                </form>
              )}
            </Step>

            <Step n={3}>
              <p className="font-medium">Conectá tu cuenta</p>
              {status.configured && needsHttps && (
                <div className="flex gap-2 rounded-lg border border-kraft/60 bg-kraft/15 p-3 text-[#8a4f12] dark:text-[#f0c27a]">
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Mercado Libre solo vuelve a direcciones <b>https</b>. Cerrá la app y abrila con{" "}
                    <code className="rounded bg-background px-1">npm run dev:https</code>, entrá a{" "}
                    <b>https://localhost:3000/ajustes</b> y tocá el botón de abajo. La primera vez el navegador puede
                    avisar que el sitio “no es seguro”: es tu propia compu, tocá <b>Avanzado → Continuar</b>.
                  </p>
                </div>
              )}
              {status.configured && (
                <div>
                  <Button asChild className="bg-yellow-400 text-yellow-950 hover:bg-yellow-300">
                    {/* Navegación completa: el OAuth redirige a mercadolibre.com.ar */}
                    <a href="/api/meli/auth">
                      <StoreIcon /> Conectar con Mercado Libre
                    </a>
                  </Button>
                </div>
              )}
            </Step>
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
