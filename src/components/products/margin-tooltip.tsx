import { InfoTooltip } from "@/components/shared/ui-bits";

/** Explica la diferencia entre margen y markup (se confunden mucho). */
export function MarginTooltip() {
  return (
    <InfoTooltip>
      <span className="block font-medium">Margen ≠ markup</span>
      <span className="block">
        <b>Markup</b>: % que le sumás al costo. Costo $100 + 50% → vendés a $150.
      </span>
      <span className="block">
        <b>Margen</b>: % del precio que es ganancia. 50% de margen sobre $100 de costo → vendés a $200 (la mitad
        del precio es ganancia).
      </span>
      <span className="block">Un 50% de margen equivale a un 100% de markup.</span>
    </InfoTooltip>
  );
}
