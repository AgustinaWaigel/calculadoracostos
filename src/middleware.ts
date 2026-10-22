import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_KEY, AUTH_URL, authConfigured } from "@/lib/auth/config";

const LOGIN = "/ingresar";

/**
 * La puerta de toda la app: hace falta haber iniciado sesión con una cuenta que figure en `admins`
 * del panel de la web. También renueva la sesión (las cookies vencen).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onLogin = pathname === LOGIN;

  if (!authConfigured) {
    // En desarrollo se puede trabajar sin configurar el ingreso; publicada, no se abre sin él.
    if (process.env.NODE_ENV !== "production" || onLogin) return NextResponse.next();
    return deny(request, "config");
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(AUTH_URL, AUTH_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return onLogin ? response : deny(request);

  const { data: isAdmin } = await supabase.rpc("es_admin");
  if (!isAdmin) {
    // La cuenta existe pero no es del panel (o la sacaron de `admins`): afuera.
    await supabase.auth.signOut();
    return onLogin ? response : deny(request, "permiso");
  }

  // Con sesión no tiene sentido ver el formulario de ingreso.
  if (onLogin) return NextResponse.redirect(new URL("/", request.url));
  return response;
}

function deny(request: NextRequest, reason?: "permiso" | "config") {
  // A las rutas de datos no se las redirige: responden 401 para que se vea el motivo.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Tenés que iniciar sesión." }, { status: 401 });
  }
  const url = new URL(LOGIN, request.url);
  const back = request.nextUrl.pathname + request.nextUrl.search;
  if (back !== "/") url.searchParams.set("volver", back);
  if (reason) url.searchParams.set("motivo", reason);
  return NextResponse.redirect(url);
}

export const config = {
  // Todo menos los archivos estáticos que el navegador y la app instalada piden sin sesión.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icons/|sw.js|offline.html|manifest.webmanifest).*)",
  ],
};
