import { PageHeader } from "@/components/shared/ui-bits";
import { QuickCalculator } from "@/components/dashboard/quick-calculator";

export const metadata = { title: "Calculadora rápida" };

export default function CalculadoraPage() {
  return (
    <>
      <PageHeader
        title="Calculadora rápida"
      />
      <QuickCalculator />
    </>
  );
}
