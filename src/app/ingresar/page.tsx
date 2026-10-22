import { LoginForm } from "@/components/auth/login-form";
import { authConfigured } from "@/lib/auth/config";
import { getBusiness } from "@/server/costing";

export const metadata = { title: "Ingresar" };

const REASONS: Record<string, string> = {
  permiso: "Esa cuenta no tiene permiso. Tiene que estar en la tabla admins de la web.",
  config: "El ingreso todavía no está configurado en el servidor.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string; motivo?: string }>;
}) {
  const [{ volver, motivo }, business] = await Promise.all([searchParams, getBusiness()]);

  return (
    <div className="grid min-h-dvh place-items-center bg-amanecer px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center text-nube">
          {business.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- el logo es un data URL guardado en la base
            <img src={business.logoUrl} alt="" className="size-20 rounded-2xl object-cover" />
          )}
          <h1 className="font-display text-4xl leading-none tracking-wide uppercase">{business.name}</h1>
          <p className="text-sm text-lavanda">Costos y precios · solo para el taller</p>
        </div>
        <div className="rounded-2xl bg-card p-6 text-card-foreground">
          <p className="mb-4 text-sm text-muted-foreground">Entrá con la misma cuenta del panel de la web.</p>
          {motivo && REASONS[motivo] && (
            <p className="mb-4 rounded-md bg-halo/25 px-3 py-2 text-sm text-foreground">{REASONS[motivo]}</p>
          )}
          {authConfigured ? (
            <LoginForm back={volver} />
          ) : (
            <p className="text-sm">
              Falta cargar <code>ALAS_SUPABASE_URL</code> y <code>ALAS_SUPABASE_KEY</code> (los del Supabase de la web).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
