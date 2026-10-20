import {
  CalculatorIcon,
  ClockIcon,
  FileTextIcon,
  HomeIcon,
  PackageIcon,
  ReceiptIcon,
  SettingsIcon,
  ShapesIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Aparece en la barra inferior del celular. */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: HomeIcon, mobile: true },
  { href: "/insumos", label: "Insumos", icon: PackageIcon, mobile: true },
  { href: "/mano-de-obra", label: "Mano de obra", icon: ClockIcon },
  { href: "/costos-fijos", label: "Costos fijos", icon: ReceiptIcon },
  { href: "/productos", label: "Productos", icon: ShapesIcon, mobile: true },
  { href: "/presupuestos", label: "Presupuestos", icon: FileTextIcon, mobile: true },
  { href: "/calculadora", label: "Calculadora rápida", icon: CalculatorIcon },
  { href: "/ajustes", label: "Ajustes", icon: SettingsIcon },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
