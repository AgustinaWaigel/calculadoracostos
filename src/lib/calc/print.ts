import { D, Decimal, ZERO, pct, sum, type DecimalInput } from "@/lib/money";

/**
 * Los fabricantes informan el rendimiento de cada bote/cartucho en páginas A4
 * al 5% de cobertura (norma ISO/IEC 24711). A partir de eso escalamos por la
 * cobertura real de cada color y por el tamaño del papel.
 */
export const REFERENCE_COVERAGE = 5;
export const A4_AREA_MM2 = 210 * 297;

export type InkChannel = "K" | "C" | "M" | "Y" | "LC" | "LM" | "OTRO";

export interface PaperSize {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const PAPER_SIZES: PaperSize[] = [
  { id: "A4", label: "A4 (21 × 29,7 cm)", widthMm: 210, heightMm: 297 },
  { id: "A3", label: "A3 (29,7 × 42 cm)", widthMm: 297, heightMm: 420 },
  { id: "A5", label: "A5 (14,8 × 21 cm)", widthMm: 148, heightMm: 210 },
  { id: "CARTA", label: "Carta (21,6 × 27,9 cm)", widthMm: 216, heightMm: 279 },
  { id: "OFICIO", label: "Oficio (21,6 × 35,6 cm)", widthMm: 216, heightMm: 356 },
  { id: "FOTO10x15", label: "Foto 10 × 15 cm", widthMm: 100, heightMm: 150 },
  { id: "FOTO13x18", label: "Foto 13 × 18 cm", widthMm: 130, heightMm: 180 },
];

/** Cuántas "A4" equivale una hoja de este tamaño. */
export function areaFactor(widthMm: DecimalInput, heightMm: DecimalInput): Decimal {
  return D(widthMm).times(D(heightMm)).div(A4_AREA_MM2);
}

export interface InkInput {
  id?: string;
  name: string;
  /** Precio del bote o cartucho. */
  bottlePrice: DecimalInput;
  /** Páginas A4 que rinde al 5% de cobertura (dato del fabricante). */
  yieldPages: DecimalInput;
  /** Cobertura de este color en la impresión, en % de la hoja (0 a 100). */
  coverage: DecimalInput;
}

/** Costo de una página A4 al 5% de cobertura con esta tinta. */
export function inkCostPerReferencePage(bottlePrice: DecimalInput, yieldPages: DecimalInput): Decimal {
  const y = D(yieldPages);
  if (y.lte(0)) throw new RangeError("El rendimiento tiene que ser mayor a 0");
  return D(bottlePrice).div(y);
}

export interface PrintCostInput {
  inks: InkInput[];
  /** Tamaño en "A4 equivalentes" (A4 = 1, A3 = 2). */
  areaFactor?: DecimalInput;
  /** Tinta extra que se va en limpiezas de cabezal y purgas, en %. */
  wastePercent?: DecimalInput;
  /** Costo del papel por hoja (opcional). */
  paperCost?: DecimalInput;
  copies?: number;
}

export interface InkLineCost {
  id?: string;
  name: string;
  coverage: Decimal;
  /** Costo de esta tinta por hoja (ya con merma y tamaño). */
  cost: Decimal;
}

export interface PrintCostResult {
  lines: InkLineCost[];
  /** Tinta por hoja. */
  ink: Decimal;
  paper: Decimal;
  /** Tinta + papel por hoja. */
  perSheet: Decimal;
  copies: number;
  total: Decimal;
  /** Hojas que salen de un juego completo de tintas (lo que se agota primero). */
  sheetsPerSet: number | null;
}

/**
 * costo de cada color por hoja = (precio ÷ rendimiento) × (cobertura ÷ 5%) × tamaño × (1 + merma)
 */
export function printCost(input: PrintCostInput): PrintCostResult {
  const factor = D(input.areaFactor ?? 1);
  if (factor.lte(0)) throw new RangeError("El tamaño del papel no es válido");
  const waste = pct(input.wastePercent ?? 0).plus(1);
  const copies = Math.max(1, Math.floor(input.copies ?? 1));

  let sheetsPerSet: number | null = null;
  const lines = input.inks.map((ink) => {
    const coverage = D(ink.coverage);
    if (coverage.lt(0) || coverage.gt(100)) throw new RangeError("La cobertura va de 0% a 100%");
    const usage = coverage.div(REFERENCE_COVERAGE).times(factor).times(waste); // "páginas de referencia" por hoja
    const cost = inkCostPerReferencePage(ink.bottlePrice, ink.yieldPages).times(usage);
    if (usage.gt(0)) {
      const sheets = D(ink.yieldPages).div(usage).floor().toNumber();
      sheetsPerSet = sheetsPerSet === null ? sheets : Math.min(sheetsPerSet, sheets);
    }
    return { id: ink.id, name: ink.name, coverage, cost };
  });

  const ink = sum(lines.map((l) => l.cost));
  const paper = D(input.paperCost ?? ZERO);
  const perSheet = ink.plus(paper);
  return { lines, ink, paper, perSheet, copies, total: perSheet.times(copies), sheetsPerSet };
}

export interface CoveragePreset {
  id: string;
  label: string;
  description: string;
  /** Cobertura sugerida por canal de tinta, en %. */
  coverage: Record<InkChannel, number>;
}

/** Valores orientativos: cada diseño es distinto, ajustalos a tu trabajo. */
export const COVERAGE_PRESETS: CoveragePreset[] = [
  {
    id: "texto",
    label: "Texto en negro",
    description: "Una carilla de texto común",
    coverage: { K: 5, C: 0, M: 0, Y: 0, LC: 0, LM: 0, OTRO: 0 },
  },
  {
    id: "documento",
    label: "Documento color",
    description: "Texto con algún gráfico o logo",
    coverage: { K: 5, C: 5, M: 5, Y: 5, LC: 0, LM: 0, OTRO: 0 },
  },
  {
    id: "flyer",
    label: "Flyer / tarjetas",
    description: "Diseño con fondos y colores",
    coverage: { K: 10, C: 20, M: 20, Y: 20, LC: 10, LM: 10, OTRO: 0 },
  },
  {
    id: "foto",
    label: "Foto a sangre",
    description: "Foto que ocupa toda la hoja",
    coverage: { K: 15, C: 40, M: 40, Y: 40, LC: 30, LM: 30, OTRO: 0 },
  },
];
