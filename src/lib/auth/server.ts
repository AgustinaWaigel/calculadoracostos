import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_KEY, AUTH_URL } from "./config";

/** Cliente de Supabase (el de la web) con la sesión de quien está usando la calculadora. */
export async function authClient() {
  const store = await cookies();
  return createServerClient(AUTH_URL, AUTH_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Desde un componente de servidor no se pueden escribir cookies; las renueva el middleware.
        }
      },
    },
  });
}

/** Mail de quien inició sesión (para mostrarlo), o null. */
export async function sessionEmail(): Promise<string | null> {
  const { data } = await (await authClient()).auth.getClaims();
  const email = data?.claims?.email;
  return email ? String(email) : null;
}
