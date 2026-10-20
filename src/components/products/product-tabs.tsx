"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProductTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/productos/${id}`, label: "Receta y costo" },
    { href: `/productos/${id}/precio`, label: "Precio de venta" },
  ];
  return (
    <nav className="mb-4 flex gap-1 border-b" aria-label="Secciones del producto">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
