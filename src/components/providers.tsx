"use client";

import { createContext, useContext } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { DolarRates } from "@/lib/dolar";

const DolarContext = createContext<DolarRates>({});

export function useDolarRates() {
  return useContext(DolarContext);
}

const LaborIsOwnContext = createContext(true);

/** El trabajo lo hace el dueño (ganancia) o se le paga a alguien (costo): default de los perfiles nuevos. */
export function useLaborIsOwn() {
  return useContext(LaborIsOwnContext);
}

export function Providers({
  children,
  rates,
  laborIsOwn,
}: {
  children: React.ReactNode;
  rates: DolarRates;
  laborIsOwn: boolean;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LaborIsOwnContext.Provider value={laborIsOwn}>
        <DolarContext.Provider value={rates}>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </DolarContext.Provider>
      </LaborIsOwnContext.Provider>
    </ThemeProvider>
  );
}
