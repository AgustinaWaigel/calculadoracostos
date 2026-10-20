"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/shared/ui-bits";
import { Money } from "@/components/shared/money";
import { LaborProfileDialog } from "./labor-profile-dialog";
import { suggestedHourlyRate } from "@/lib/calc/labor";
import { parseMoneyInput } from "@/lib/money";

/** "Quiero ganar $X por mes trabajando Y horas" → valor hora sugerido. */
export function HourlyRateCalculator() {
  const [income, setIncome] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");

  const monthly = parseMoneyInput(income);
  const weekly = parseMoneyInput(hoursPerWeek);
  // 52 semanas / 12 meses ≈ 4,33 semanas por mes
  const hoursPerMonth = weekly?.gt(0) ? weekly.times(52).div(12) : null;
  const rate =
    monthly?.gt(0) && hoursPerMonth ? suggestedHourlyRate({ monthlyIncome: monthly, hoursPerMonth }) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Cuánto vale tu hora?</CardTitle>
        <CardDescription>Partí de lo que querés ganar por mes.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quiero ganar por mes" htmlFor="calc-income">
            <Input
              id="calc-income"
              inputMode="decimal"
              placeholder="800.000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </Field>
          <Field
            label="Horas por semana"
            htmlFor="calc-hours"
            hint={hoursPerMonth ? `≈ ${hoursPerMonth.toDecimalPlaces(0).toString()} horas por mes` : undefined}
          >
            <Input
              id="calc-hours"
              inputMode="decimal"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Valor hora sugerido</p>
            <p className="text-2xl font-semibold text-primary">{rate ? <Money value={rate.toString()} /> : "—"}</p>
          </div>
          {rate && (
            <LaborProfileDialog
              suggestedRate={rate.toDecimalPlaces(0).toString()}
              trigger={
                <Button variant="outline" size="sm">
                  <PlusIcon /> Crear perfil con este valor
                </Button>
              }
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground text-pretty">
          Tené en cuenta que no todas las horas son productivas: atención al cliente, compras y redes también
          llevan tiempo. Si producís 30 de 40 horas, cargá 30.
        </p>
      </CardContent>
    </Card>
  );
}
