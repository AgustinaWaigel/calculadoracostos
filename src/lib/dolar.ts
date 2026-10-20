export type DolarType = "oficial" | "blue" | "mep";

export interface DolarQuote {
  type: DolarType;
  label: string;
  buy: number;
  sell: number;
  updatedAt: string;
}

export type DolarRates = Partial<Record<DolarType, DolarQuote>>;

export const DOLAR_LABELS: Record<DolarType, string> = {
  oficial: "Oficial",
  blue: "Blue",
  mep: "MEP",
};

/** Cotización que se guarda en el historial de precios para comparar en USD. */
export const REFERENCE_DOLAR: DolarType = "mep";

const CASA_TO_TYPE: Record<string, DolarType> = { oficial: "oficial", blue: "blue", bolsa: "mep" };

interface DolarApiItem {
  casa: string;
  compra: number | null;
  venta: number | null;
  fechaActualizacion: string;
}

/** Trae oficial, blue y MEP de dolarapi.com (cacheado 15 minutos). Nunca tira error. */
export async function getDolarRates(): Promise<DolarRates> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as DolarApiItem[];
    const rates: DolarRates = {};
    for (const item of data) {
      const type = CASA_TO_TYPE[item.casa];
      if (!type || !item.venta) continue;
      rates[type] = {
        type,
        label: DOLAR_LABELS[type],
        buy: item.compra ?? item.venta,
        sell: item.venta,
        updatedAt: item.fechaActualizacion,
      };
    }
    return rates;
  } catch {
    return {};
  }
}

export async function getReferenceUsdRate(): Promise<number | null> {
  const rates = await getDolarRates();
  return rates[REFERENCE_DOLAR]?.sell ?? rates.oficial?.sell ?? null;
}
