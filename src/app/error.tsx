"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-lg font-medium">Algo salió mal</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {process.env.NODE_ENV === "development" ? error.message : "Probá de nuevo en un momento."}
      </p>
      <Button onClick={reset} className="mt-2">
        Reintentar
      </Button>
    </div>
  );
}
