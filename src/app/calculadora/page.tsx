import { PageHeader } from "@/components/shared/ui-bits";
import { QuickCalculator } from "@/components/dashboard/quick-calculator";

export const metadata = { title: "Calculadora rápida" };

export default function CalculadoraPage() {
  return (
    <>
      <PageHeader
        title="Calculadora rápida"
        description="Para cotizar algo al toque sin cargarlo. Si te sirve, después armalo como producto."
      />
      <QuickCalculator />
    </>
  );
}
