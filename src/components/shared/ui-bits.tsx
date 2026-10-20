import Link from "next/link";
import { InfoIcon, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACCENTS, type Accent } from "@/components/layout/nav-items";

export { PageHeader } from "./page-header";

export function InfoTooltip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Más información"
          className={cn("inline-flex align-middle text-muted-foreground hover:text-foreground", className)}
        >
          <InfoIcon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-pretty">{children}</TooltipContent>
    </Tooltip>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  example,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  /** Ejemplo concreto para inspirar la primera carga. */
  example?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="size-6" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          {description && (
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
          )}
        </div>
        {example && (
          <div className="mt-1 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{example}</div>
        )}
        {action && (
          <Button asChild className="mt-2">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  accent,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "good" | "warn" | "bad";
  /** Color de la tarjeta (fondo suave + ícono). */
  accent?: Accent;
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-red-600 dark:text-red-400",
  }[tone];
  const a = accent ? ACCENTS[accent] : null;
  return (
    <Card className={cn("gap-1 py-4", a && cn(a.bg, a.border))}>
      <CardContent className="px-4">
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <span>{label}</span>
          {Icon && (
            <span className={cn("grid size-7 place-items-center rounded-lg", a ? a.solid : "bg-muted")}>
              <Icon className="size-4" />
            </span>
          )}
        </div>
        <div className={cn("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}
