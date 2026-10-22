"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/ui-bits";
import { login } from "@/actions/auth";

export function LoginForm({ back }: { back?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="volver" value={back ?? "/"} />
      <Field label="Mail" htmlFor="login-email">
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          autoFocus
        />
      </Field>
      <Field label="Contraseña" htmlFor="login-clave">
        <Input id="login-clave" name="clave" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending && <Loader2Icon className="animate-spin" />}
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
