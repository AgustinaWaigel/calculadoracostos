"use client";

import { usePathname } from "next/navigation";
import { ACCENTS, navItemFor } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

/** Título de página con el ícono y el color de su sección. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const item = navItemFor(usePathname());
  const accent = item ? ACCENTS[item.accent] : null;

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {item && accent && (
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", accent.solid)}>
            <item.icon className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none tracking-wide text-balance uppercase sm:text-4xl">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
