"use server";

import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth/server";
import { authConfigured } from "@/lib/auth/config";

export type LoginState = { error?: string; email?: string } | undefined;

/** Solo rutas de esta app: nada de mandar a otro sitio después de ingresar. */
function safeBack(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/";
}

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  if (!authConfigured) return { email, error: "Falta configurar el ingreso (ALAS_SUPABASE_URL y ALAS_SUPABASE_KEY)." };

  const supabase = await authClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(form.get("clave") ?? "") });
  if (error) return { email, error: "El mail o la contraseña no coinciden." };

  const { data: isAdmin } = await supabase.rpc("es_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { email, error: "Esta cuenta existe pero no tiene permiso. Tiene que estar en la tabla admins de la web." };
  }
  redirect(safeBack(form.get("volver")));
}

export async function logout() {
  if (authConfigured) await (await authClient()).auth.signOut();
  redirect("/ingresar");
}
