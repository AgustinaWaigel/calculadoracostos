import type { ZodError } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Convierte un ZodError en errores por campo ("supplies.0.quantity" → mensaje). */
export function zodFail(error: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] ??= issue.message;
  }
  const first = error.issues[0]?.message ?? "Revisá los datos";
  return fail(first, fieldErrors);
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Ocurrió un error inesperado";
}
