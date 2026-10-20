import { D, Decimal, HUNDRED, ZERO, type DecimalInput } from "@/lib/money";
import { median, average } from "./stats";

export interface HourlyRateGoal {
  /** Cuánto querés ganar por mes (en mano). */
  monthlyIncome: DecimalInput;
  /** Horas que trabajás por mes. */
  hoursPerMonth: DecimalInput;
}

/** "Quiero ganar $X por mes trabajando Y horas" → valor hora sugerido. */
export function suggestedHourlyRate({ monthlyIncome, hoursPerMonth }: HourlyRateGoal): Decimal {
  const hours = D(hoursPerMonth);
  if (hours.lte(0)) throw new RangeError("Las horas por mes tienen que ser mayores a 0");
  return D(monthlyIncome).div(hours);
}

/** Costo de N minutos a un valor hora dado. */
export function laborCost(hourlyRate: DecimalInput, minutes: DecimalInput): Decimal {
  return D(hourlyRate).times(D(minutes)).div(60);
}

export interface MarketComparison {
  median: Decimal;
  average: Decimal;
  /** % de diferencia contra la mediana (negativo = estás por debajo). */
  diffPercent: Decimal;
  isBelowMarket: boolean;
}

/** Compara tu valor hora con los valores de referencia que cargaste. */
export function compareHourlyRate(
  myRate: DecimalInput,
  marketRates: DecimalInput[],
): MarketComparison | null {
  if (marketRates.length === 0) return null;
  const values = marketRates.map((v) => D(v));
  const med = median(values);
  const diffPercent = med.isZero() ? ZERO : D(myRate).minus(med).div(med).times(HUNDRED);
  return {
    median: med,
    average: average(values),
    diffPercent,
    isBelowMarket: D(myRate).lt(med),
  };
}
