"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalculatorIcon, MenuIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";
import { CurrencySwitcher } from "./currency-switcher";

function Brand({ name }: { name: string }) {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <CalculatorIcon className="size-4" />
      </span>
      <span className="truncate">{name}</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, businessName }: { children: React.ReactNode; businessName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
        <Brand name={businessName} />
        <NavLinks />
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <Brand name={businessName} />
              </SheetHeader>
              <NavLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <span className="text-sm font-semibold">{businessName}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <CurrencySwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 lg:pb-10">{children}</main>
      </div>

      {/* Barra inferior mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Navegación principal"
      >
        {NAV_ITEMS.filter((i) => i.mobile).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
