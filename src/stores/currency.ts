"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency } from "@/lib/money";
import type { DolarType } from "@/lib/dolar";

interface CurrencyState {
  currency: Currency;
  dolarType: DolarType;
  setCurrency: (c: Currency) => void;
  setDolarType: (t: DolarType) => void;
}

/** Preferencia de visualización (ARS/USD y tipo de dólar). Se guarda en el navegador. */
export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "ARS",
      dolarType: "blue",
      setCurrency: (currency) => set({ currency }),
      setDolarType: (dolarType) => set({ dolarType }),
    }),
    { name: "calc-moneda" },
  ),
);
