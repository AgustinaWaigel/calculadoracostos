import {
  CalculatorIcon,
  ClockIcon,
  FileTextIcon,
  HomeIcon,
  PackageIcon,
  PrinterIcon,
  ReceiptIcon,
  SettingsIcon,
  ShapesIcon,
  type LucideIcon,
} from "lucide-react";

export type Accent = "green" | "sky" | "amber" | "rose" | "violet" | "emerald" | "cyan" | "orange" | "slate";

/** Clases completas (Tailwind solo genera las que aparecen literalmente en el código). */
export const ACCENTS: Record<Accent, { text: string; bg: string; solid: string; border: string }> = {
  green: {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/12",
    solid: "bg-green-600 text-white",
    border: "border-green-500/30",
  },
  sky: { text: "text-sky-700 dark:text-sky-400", bg: "bg-sky-500/12", solid: "bg-sky-600 text-white", border: "border-sky-500/30" },
  amber: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/15",
    solid: "bg-amber-500 text-white",
    border: "border-amber-500/30",
  },
  rose: { text: "text-rose-700 dark:text-rose-400", bg: "bg-rose-500/12", solid: "bg-rose-600 text-white", border: "border-rose-500/30" },
  violet: {
    text: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-500/12",
    solid: "bg-violet-600 text-white",
    border: "border-violet-500/30",
  },
  emerald: {
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/12",
    solid: "bg-emerald-600 text-white",
    border: "border-emerald-500/30",
  },
  cyan: { text: "text-cyan-700 dark:text-cyan-400", bg: "bg-cyan-500/12", solid: "bg-cyan-600 text-white", border: "border-cyan-500/30" },
  orange: {
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/12",
    solid: "bg-orange-500 text-white",
    border: "border-orange-500/30",
  },
  slate: {
    text: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-500/12",
    solid: "bg-slate-600 text-white",
    border: "border-slate-500/30",
  },
};

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  accent: Accent;
  /** Aparece en la barra inferior del celular. */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: HomeIcon, accent: "green", mobile: true },
  { href: "/insumos", label: "Insumos", icon: PackageIcon, accent: "sky", mobile: true },
  { href: "/mano-de-obra", label: "Mano de obra", icon: ClockIcon, accent: "amber" },
  { href: "/costos-fijos", label: "Costos fijos", icon: ReceiptIcon, accent: "rose" },
  { href: "/productos", label: "Productos", icon: ShapesIcon, accent: "violet", mobile: true },
  { href: "/presupuestos", label: "Presupuestos", icon: FileTextIcon, accent: "emerald", mobile: true },
  { href: "/impresion", label: "Impresión", icon: PrinterIcon, accent: "cyan" },
  { href: "/calculadora", label: "Calculadora rápida", icon: CalculatorIcon, accent: "orange" },
  { href: "/ajustes", label: "Ajustes", icon: SettingsIcon, accent: "slate" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function navItemFor(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS].reverse().find((i) => isActive(pathname, i.href));
}
