/**
 * El ingreso usa las cuentas del panel de la web (alasdeangel.com.ar/admin): su proyecto de Supabase
 * y su tabla `admins`. Es otro proyecto que el de los datos de la calculadora (DATABASE_URL).
 * URL y clave publicable de ESE proyecto: Project Settings → API Keys en el Supabase de la web.
 */
export const AUTH_URL = process.env.ALAS_SUPABASE_URL ?? "";
export const AUTH_KEY = process.env.ALAS_SUPABASE_KEY ?? "";

export const authConfigured = Boolean(AUTH_URL && AUTH_KEY);
