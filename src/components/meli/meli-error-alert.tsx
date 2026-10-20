import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { MeliClientError } from "@/lib/meli/client-api";

export function MeliErrorAlert({ error }: { error: MeliClientError }) {
  const needsSetup = ["NOT_CONFIGURED", "NOT_CONNECTED", "UNAUTHORIZED"].includes(error.code);
  return (
    <Alert variant="destructive" className="mb-3">
      <AlertCircleIcon />
      <AlertTitle>No pudimos consultar Mercado Libre</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {needsSetup && (
          <Link href="/ajustes#mercado-libre" className="font-medium underline underline-offset-2">
            Ir a Ajustes → Mercado Libre
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
