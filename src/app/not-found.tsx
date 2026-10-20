import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-5xl font-semibold text-muted-foreground">404</p>
      <p className="text-lg font-medium">No encontramos esa página</p>
      <p className="text-sm text-muted-foreground">Puede que el elemento se haya borrado.</p>
      <Button asChild className="mt-2">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
