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

export function Providers({ children, rates }: { children: React.ReactNode; rates: DolarRates }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DolarContext.Provider value={rates}>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </DolarContext.Provider>
    </ThemeProvider>
  );
}
